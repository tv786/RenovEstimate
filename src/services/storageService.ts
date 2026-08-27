import {
  Project,
  MaterialItem,
  LabourRate,
  CompanySettings,
  PriceHistoryEntry,
  ActualProjectCostRecord,
  BOQSection,
  BOQItem,
  QualityTier
} from '../types';
import {
  DEFAULT_MATERIALS,
  DEFAULT_LABOUR_RATES,
  DEFAULT_COMPANY_SETTINGS
} from '../data/defaultRates';
import { calculateBOQItemRow, calculateCostSummary } from '../utils/calculationEngine';

const STORAGE_KEYS = {
  PROJECTS: 'renov_projects_v3',
  MATERIALS: 'renov_materials_v1',
  LABOUR: 'renov_labour_v1',
  SETTINGS: 'renov_settings_v1',
  PRICE_HISTORY: 'renov_price_history_v1',
  ACTUAL_COSTS: 'renov_actual_costs_v1',
};

export class StorageService {
  // --- SETTINGS ---
  static getSettings(): CompanySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.companyName === 'AuraCraft Interiors & Renovations' || !parsed.companyName) {
          parsed.companyName = DEFAULT_COMPANY_SETTINGS.companyName;
          parsed.accountHolder = DEFAULT_COMPANY_SETTINGS.accountHolder;
          parsed.email = DEFAULT_COMPANY_SETTINGS.email;
          parsed.website = DEFAULT_COMPANY_SETTINGS.website;
          parsed.upiId = DEFAULT_COMPANY_SETTINGS.upiId;
          StorageService.saveSettings(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse settings from storage', e);
    }
    return DEFAULT_COMPANY_SETTINGS;
  }

  static saveSettings(settings: CompanySettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- MATERIALS ---
  static getMaterials(): MaterialItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse materials from storage', e);
    }
    // Seed default materials
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
    return DEFAULT_MATERIALS;
  }

  static saveMaterials(materials: MaterialItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }

  static updateMaterialPrice(
    materialId: string,
    newCostPrice: number,
    newSellingRate: number,
    changedBy: string = 'Contractor Admin',
    reason?: string
  ): void {
    const materials = this.getMaterials();
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;

    const prevRate = mat.sellingRate;
    mat.costPrice = newCostPrice;
    mat.sellingRate = newSellingRate;
    mat.lastUpdated = new Date().toISOString();

    this.saveMaterials(materials);

    // Record price history
    this.addPriceHistory({
      id: 'ph-' + Date.now(),
      itemId: mat.id,
      itemName: `${mat.category} - ${mat.itemName} (${mat.specification})`,
      type: 'material',
      previousRate: prevRate,
      newRate: newSellingRate,
      unit: mat.unit,
      changedBy,
      timestamp: new Date().toISOString(),
      reason: reason || 'Market rate revision',
    });
  }

  // --- LABOUR RATES ---
  static getLabourRates(): LabourRate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LABOUR);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse labour rates from storage', e);
    }
    localStorage.setItem(STORAGE_KEYS.LABOUR, JSON.stringify(DEFAULT_LABOUR_RATES));
    return DEFAULT_LABOUR_RATES;
  }

  static saveLabourRates(rates: LabourRate[]): void {
    localStorage.setItem(STORAGE_KEYS.LABOUR, JSON.stringify(rates));
  }

  // --- PRICE HISTORY ---
  static getPriceHistory(): PriceHistoryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse price history', e);
    }
    return [
      {
        id: 'ph-init-1',
        itemId: 'mat-carp-02',
        itemName: 'BWP Grade Marine Plywood (18mm 710)',
        type: 'material',
        previousRate: 135,
        newRate: 145,
        unit: 'sq.ft.',
        changedBy: 'Er. Rajesh Varma',
        timestamp: '2026-08-15T09:30:00Z',
        reason: 'Timber & resin price hike by manufacturer'
      },
      {
        id: 'ph-init-2',
        itemId: 'mat-carp-04',
        itemName: 'Wardrobe Box with Internal Laminate',
        type: 'material',
        previousRate: 8800,
        newRate: 9200,
        unit: 'R.ft.',
        changedBy: 'Er. Rajesh Varma',
        timestamp: '2026-08-10T14:20:00Z',
        reason: 'Adhesive and edge-banding rate escalation'
      }
    ];
  }

  static addPriceHistory(entry: PriceHistoryEntry): void {
    const list = this.getPriceHistory();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(list));
  }

  // --- PROJECTS ---
  static getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse projects from storage', e);
    }

    // Seed Demo Master Bedroom Project
    const demoProject = this.createDemoProject();
    const initialList = [demoProject];
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initialList));
    return initialList;
  }

  static getProjectById(id: string): Project | null {
    const list = this.getProjects();
    return list.find((p) => p.id === id) || null;
  }

  static saveProject(project: Project): void {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    project.updatedAt = new Date().toISOString();
    project.version = (project.version || 1) + 1;

    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.unshift(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
  }

  static deleteProject(id: string): void {
    const list = this.getProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
  }

  // --- ACTUAL COSTS ---
  static getActualCosts(): ActualProjectCostRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTUAL_COSTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse actual costs', e);
    }
    return [
      {
        projectId: 'demo-proj-completed-01',
        completedDate: '2026-08-10',
        totalEstimatedSellingPrice: 510000,
        totalEstimatedInternalCost: 410000,
        totalActualCost: 438000,
        netVarianceAmount: 28000,
        netVariancePercent: 6.8,
        items: [
          {
            boqItemId: 'item-demo-1',
            workDescription: 'POP Demolition & Disposal',
            estimatedAmount: 12000,
            actualAmount: 13800,
            varianceAmount: 1800,
            variancePercent: 15,
            notes: 'Extra hidden cornice framework had to be chipped out manually'
          },
          {
            boqItemId: 'item-demo-2',
            workDescription: 'Full Height Sliding Wardrobe Fabrication',
            estimatedAmount: 115000,
            actualAmount: 122000,
            varianceAmount: 7000,
            variancePercent: 6.1,
            notes: 'Client upgraded to soft-close slide channels and heavy aluminum handles'
          },
          {
            boqItemId: 'item-demo-3',
            workDescription: 'Bed-Back Feature Wall Paneling',
            estimatedAmount: 42000,
            actualAmount: 46500,
            varianceAmount: 4500,
            variancePercent: 10.7,
            notes: 'Extra brass inlay profiles requested during fabrication'
          }
        ],
        learningInsights: [
          'POP demolition on older ceilings consistently incurs ~10-15% higher labor due to embedded mesh and debris disposal.',
          'Wardrobe and carpentry estimates are generally tight within ±6% variance.',
          'Electrical modifications often exceed initial wire run estimates by ~8%.'
        ]
      }
    ];
  }

  static saveActualCost(record: ActualProjectCostRecord): void {
    const list = this.getActualCosts();
    const idx = list.findIndex((r) => r.projectId === record.projectId);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.ACTUAL_COSTS, JSON.stringify(list));
  }

  // --- HELPER: SEED REALISTIC DEMO PROJECT ---
  static createDemoProject(): Project {
    const dim = {
      lengthFt: 20,
      widthFt: 20,
      heightFt: 10,
      sections: [],
      openings: [
        { id: 'op-1', type: 'Door' as const, widthFt: 3.5, heightFt: 7, quantity: 1 },
        { id: 'op-2', type: 'Window' as const, widthFt: 5, heightFt: 5, quantity: 1 }
      ],
      calculatedFloorAreaSqFt: 400,
      calculatedPerimeterRFt: 80,
      calculatedWallAreaSqFt: 750.5,
      calculatedCeilingAreaSqFt: 400,
      wardrobeWidthRFt: 8,
      bedBackWallWidthFt: 11,
      customNotes: 'Master bedroom in upscale residential apartment in Jaipur.'
    };

    // Pre-calculated default BOQ for the 20x20 Master Bedroom Renovation demo
    const rawItemsSec1: Omit<
      BOQItem,
      | 'effectiveQuantity'
      | 'materialCost'
      | 'labourCost'
      | 'totalDirectAmount'
      | 'explanation'
    >[] = [
      {
        id: 'boq-item-1',
        sectionId: 'sec-1',
        srNo: 1,
        category: 'Demolition',
        workDescription: 'Careful demolition & removal of existing outdated POP false ceiling',
        materialName: 'Contractor Demolition Work',
        specification: 'Dismantling of perimeter GI grid, gypsum boards, concealed wire extraction & site sweep',
        quantity: 400,
        unit: 'sq.ft.',
        materialRate: 15,
        wastagePercent: 0,
        labourRate: 8,
        isManuallyAdjusted: false,
        confidence: 'high',
        otherCost: 0,
        notes: 'Includes vacuuming dust before framework start'
      },
      {
        id: 'boq-item-2',
        sectionId: 'sec-1',
        srNo: 2,
        category: 'Demolition',
        workDescription: 'Dismantling & removal of existing study/laptop desk unit',
        materialName: 'Site Labour Crew',
        specification: 'Disassembly of 8ft wall-mounted study desk & display overhead box',
        quantity: 1,
        unit: 'job',
        materialRate: 3500,
        wastagePercent: 0,
        labourRate: 1200,
        isManuallyAdjusted: false,
        confidence: 'high',
        otherCost: 0,
        notes: 'Area to be cleared for the new full-height wardrobe'
      },
      {
        id: 'boq-item-3',
        sectionId: 'sec-1',
        srNo: 3,
        category: 'Demolition',
        workDescription: 'Debris bagging, staircase shifting & tractor transportation',
        materialName: 'Contractor Transport Services',
        specification: 'Commercial debris removal and municipal dumping permit',
        quantity: 1,
        unit: 'lot',
        materialRate: 5500,
        wastagePercent: 0,
        labourRate: 1500,
        isManuallyAdjusted: false,
        confidence: 'medium',
        otherCost: 0
      }
    ];

    const rawItemsSec2: Omit<
      BOQItem,
      | 'effectiveQuantity'
      | 'materialCost'
      | 'labourCost'
      | 'totalDirectAmount'
      | 'explanation'
    >[] = [
      {
        id: 'boq-item-4',
        sectionId: 'sec-2',
        srNo: 4,
        category: 'Ceiling',
        workDescription: 'New Designer POP / Gypsum False Ceiling with Double Perimeter Cove',
        materialName: 'POP Sheet & Framing (Gyproc Elite)',
        specification: '12.5mm Saint-Gobain Gyproc board on galvanized GI framework with LED cove profile',
        quantity: 400,
        unit: 'sq.ft.',
        materialRate: 58,
        wastagePercent: 8,
        labourRate: 24,
        isManuallyAdjusted: false,
        confidence: 'high',
        otherCost: 1500,
        notes: 'Covers entire 20x20 ft ceiling'
      },
      {
        id: 'boq-item-5',
        sectionId: 'sec-2',
        srNo: 5,
        category: 'Electrical',
        workDescription: 'Ceiling Electrical Point Modifications & COB Downlights',
        materialName: 'Modular Light Point Wiring + COB Lights',
        specification: 'Polycab 1.5 sq.mm FRLS wiring + 8 Philips 9W warm white deep downlights',
        quantity: 12,
        unit: 'point',
        materialRate: 520,
        wastagePercent: 5,
        labourRate: 220,
        isManuallyAdjusted: false,
        confidence: 'medium',
        otherCost: 2000,
        notes: 'Includes 8 downlights and 4 fan/pendant hook-ups'
      },
      {
        id: 'boq-item-6',
        sectionId: 'sec-2',
        srNo: 6,
        category: 'Electrical',
        workDescription: 'Concealed LED Strip Light in False Ceiling Cove (24V Warm White)',
        materialName: 'LED Strip Light + Aluminium Profile Channel',
        specification: 'Philips 240 LED/m 24V Dotless Strip + Slim Diffuser + 150W Driver',
        quantity: 65,
        unit: 'R.ft.',
        materialRate: 140,
        wastagePercent: 6,
        labourRate: 35,
        isManuallyAdjusted: false,
        confidence: 'high',
        otherCost: 800
      }
    ];

    const rawItemsSec3: Omit<
      BOQItem,
      | 'effectiveQuantity'
      | 'materialCost'
      | 'labourCost'
      | 'totalDirectAmount'
      | 'explanation'
    >[] = [
      {
        id: 'boq-item-7',
        sectionId: 'sec-3',
        srNo: 7,
        category: 'Carpentry',
        workDescription: 'Full-Height Sliding Wardrobe with Loft & Internal Organizers (8 R.ft. × 9.5 ft Height)',
        materialName: 'Wardrobe Box with Internal Laminate (Complete Substrate)',
        specification: '18mm Century BWP Plywood carcass + 1.0mm Merino Designer exterior laminate + 0.8mm interior',
        quantity: 8,
        unit: 'R.ft.',
        materialRate: 9200,
        wastagePercent: 5,
        labourRate: 1800,
        isManuallyAdjusted: true,
        confidence: 'high',
        otherCost: 8500,
        notes: 'Replacing previous study desk. 8 R.ft verified measurement. Includes Hettich soft-close sliding system.'
      },
      {
        id: 'boq-item-8',
        sectionId: 'sec-3',
        srNo: 8,
        category: 'Carpentry',
        workDescription: 'Bed-Back Designer Feature Wall with Fluted Louver & Fabric Paneling',
        materialName: 'Bed-Back Feature Wall Paneling + Charcoal Louvers',
        specification: 'High density cushioned velvet panelling (11 ft × 5 ft) + Euro Pratik charcoal side louvers & PVD brass strips',
        quantity: 95,
        unit: 'sq.ft.',
        materialRate: 185,
        wastagePercent: 8,
        labourRate: 45,
        isManuallyAdjusted: false,
        confidence: 'medium',
        otherCost: 3500,
        notes: 'Redesign of wall behind master double bed'
      }
    ];

    const rawItemsSec4: Omit<
      BOQItem,
      | 'effectiveQuantity'
      | 'materialCost'
      | 'labourCost'
      | 'totalDirectAmount'
      | 'explanation'
    >[] = [
      {
        id: 'boq-item-9',
        sectionId: 'sec-4',
        srNo: 9,
        category: 'Painting',
        workDescription: 'Complete Room Wall Painting (Royale Luxury Sheen Emulsion)',
        materialName: 'Royale Luxury Emulsion (Full Wall Prep + Birle Putty + Royal Silk)',
        specification: 'Surface sanding, 2 coats Birla White Putty, 1 coat primer, 2 coats Asian Paints Royale Silk',
        quantity: 750,
        unit: 'sq.ft.',
        materialRate: 28,
        wastagePercent: 6,
        labourRate: 12,
        isManuallyAdjusted: false,
        confidence: 'high',
        otherCost: 1000
      },
      {
        id: 'boq-item-10',
        sectionId: 'sec-4',
        srNo: 10,
        category: 'Miscellaneous',
        workDescription: 'Furniture & Floor Masking Protection & Post-Work Deep Cleaning',
        materialName: 'Site Protection + HEPA Deep Vacuuming',
        specification: 'Heavy floor guard roll + double bubblewrap on existing bed/mattress + chemical floor polishing',
        quantity: 1,
        unit: 'job',
        materialRate: 6500,
        wastagePercent: 0,
        labourRate: 2500,
        isManuallyAdjusted: false,
        confidence: 'high',
        otherCost: 0
      }
    ];

    const sec1: BOQSection = {
      id: 'sec-1',
      name: '1. Demolition & Removal Works',
      order: 1,
      items: rawItemsSec1.map((it) => calculateBOQItemRow(it))
    };

    const sec2: BOQSection = {
      id: 'sec-2',
      name: '2. POP False Ceiling & Designer Lighting',
      order: 2,
      items: rawItemsSec2.map((it) => calculateBOQItemRow(it))
    };

    const sec3: BOQSection = {
      id: 'sec-3',
      name: '3. Custom Carpentry, Wardrobe & Feature Wall',
      order: 3,
      items: rawItemsSec3.map((it) => calculateBOQItemRow(it))
    };

    const sec4: BOQSection = {
      id: 'sec-4',
      name: '4. Surface Finishing, Painting & Site Protection',
      order: 4,
      items: rawItemsSec4.map((it) => calculateBOQItemRow(it))
    };

    const allSections = [sec1, sec2, sec3, sec4];
    const costSummary = calculateCostSummary(allSections, {
      overheadPercent: 8,
      profitMarginPercent: 18,
      gstPercent: 18,
      transportationCost: 4500,
      debrisRemovalCost: 5000,
      siteProtectionCost: 3500,
      miscellaneousCost: 2500
    });

    return {
      id: 'proj-demo-master-bed-01',
      projectName: 'Sharma Residence – Master Bedroom',
      clientName: 'Shri Vikram Sharma',
      clientPhone: '+91 98290 88776',
      clientEmail: 'vikram.sharma.in@gmail.com',
      siteLocation: 'Jaipur',
      projectType: 'Bedroom Renovation',
      qualityTier: 'Standard',
      status: 'Awaiting Confirmation',
      createdAt: '2026-08-25T11:00:00Z',
      updatedAt: '2026-08-26T21:00:00Z',
      version: 2,
      dimensions: dim,
      images: [
        {
          id: 'img-1',
          name: 'Master_Bed_Current_View_1.jpg',
          dataUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
          caption: 'Existing POP ceiling and bed wall condition',
          uploadedAt: '2026-08-25T11:05:00Z'
        },
        {
          id: 'img-2',
          name: 'Master_Bed_Desk_Corner_2.jpg',
          dataUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
          caption: 'Existing laptop desk to be replaced with full-height wardrobe',
          uploadedAt: '2026-08-25T11:06:00Z'
        }
      ],
      clientRequirements: {
        ceiling: 'Complete replacement',
        wardrobe: 'Replace',
        featureWall: 'Redesign',
        flooring: 'Keep',
        painting: 'Repaint',
        electrical: 'Modify',
        plumbing: 'Keep',
        customNotes:
          'Client wants to change the POP ceiling design with warm LED cove lighting, replace the existing laptop desk with a full-height 8 R.ft sliding wardrobe, and redesign the wall behind the bed with fluted louvers. Existing double bed and Italian marble flooring must be strictly protected and remain.'
      },
      aiAnalysis: {
        analyzedAt: '2026-08-25T11:08:00Z',
        modelUsed: 'gemini-3.7-flash',
        summaryNarrative:
          'Comprehensive multi-point visual inspection of the 20×20 ft master bedroom. Detected existing decorative POP ceiling with old central fan, existing desk/display unit in right niche, existing master bed with plain headboard, and intact marble flooring. Renovation scope clearly centers on ceiling demolition/rebuild, desk removal, new 8 R.ft wardrobe installation, bed-back wall accentuation, and complete luxury repainting.',
        confidenceScore: 84,
        existingElements: [
          {
            id: 'ee-1',
            element: 'POP False Ceiling',
            location: 'Full Ceiling (20×20 ft)',
            condition: 'Outdated design with surface hairline cracking',
            isAffected: true,
            confidence: 'high'
          },
          {
            id: 'ee-2',
            element: 'Laptop Desk & Display Unit',
            location: 'Right Side Wall Niche',
            condition: 'Existing wooden laminate desk',
            isAffected: true,
            confidence: 'high'
          },
          {
            id: 'ee-3',
            element: 'Master Bed & Mattress',
            location: 'Center of Bedroom',
            condition: 'Good condition double bed',
            isAffected: false,
            confidence: 'high'
          },
          {
            id: 'ee-4',
            element: 'Bed-Back Wall Paneling',
            location: 'Behind Master Bed',
            condition: 'Plain painted wall with basic wall sconces',
            isAffected: true,
            confidence: 'high'
          },
          {
            id: 'ee-5',
            element: 'Flooring (Italian Marble)',
            location: 'Entire Room',
            condition: 'Polished marble in excellent condition',
            isAffected: false,
            confidence: 'high'
          },
          {
            id: 'ee-6',
            element: 'Ceiling Lighting & Fan',
            location: 'Ceiling grid',
            condition: 'Basic halogen spotlights & central fan',
            isAffected: true,
            confidence: 'high'
          }
        ],
        requestedChanges: [
          {
            id: 'rc-1',
            area: 'Ceiling',
            change: 'Complete POP demolition and new contemporary false ceiling with perimeter cove lighting',
            urgency: 'High'
          },
          {
            id: 'rc-2',
            area: 'Wardrobe',
            change: 'Demolish laptop desk niche and build full-height 8 R.ft sliding wardrobe',
            urgency: 'High'
          },
          {
            id: 'rc-3',
            area: 'Feature Wall',
            change: 'Redesign wall behind bed with acoustic fluted louvers and cushioned fabric headboard',
            urgency: 'Medium'
          },
          {
            id: 'rc-4',
            area: 'Finishes',
            change: 'Repaint entire room with Asian Paints Royale Luxury silk finish',
            urgency: 'Medium'
          }
        ],
        suggestedScope: [
          {
            id: 'ss-1',
            category: 'Demolition',
            workDescription: 'POP ceiling demolition and debris bagging',
            suggestedMaterial: 'Contractor Demolition Work',
            specification: '400 sq.ft. area removal',
            quantity: 400,
            unit: 'sq.ft.',
            confidence: 'high',
            basis: 'Room dimensions 20×20 ft',
            requires_confirmation: false
          },
          {
            id: 'ss-2',
            category: 'Ceiling',
            workDescription: 'New Saint-Gobain Gyproc False Ceiling with LED Cove',
            suggestedMaterial: 'POP Sheet & Framing',
            specification: '12.5mm Gyproc on GI channels',
            quantity: 400,
            unit: 'sq.ft.',
            confidence: 'high',
            basis: 'Room dimensions 20×20 ft',
            requires_confirmation: false
          },
          {
            id: 'ss-3',
            category: 'Carpentry',
            workDescription: 'Full-Height Sliding Wardrobe',
            suggestedMaterial: 'BWP Plywood 18mm + 1.0mm Laminate',
            specification: '8 R.ft. wide × 9.5 ft height',
            quantity: 8,
            unit: 'R.ft.',
            confidence: 'medium',
            basis: 'Estimated from niche visual proportion (Confirmed as 8 R.ft.)',
            requires_confirmation: true
          },
          {
            id: 'ss-4',
            category: 'Wall Finishes',
            workDescription: 'Bed-Back Feature Paneling & Fluted Louvers',
            suggestedMaterial: 'Charcoal Louvers + Fabric Paneling',
            specification: '11 ft width behind bed',
            quantity: 95,
            unit: 'sq.ft.',
            confidence: 'medium',
            basis: 'Bed-back wall width proportion',
            requires_confirmation: true
          },
          {
            id: 'ss-5',
            category: 'Painting',
            workDescription: 'Royale Luxury Emulsion Wall Painting',
            suggestedMaterial: 'Asian Paints Royale Silk',
            specification: 'Perimeter wall area 750 sq.ft.',
            quantity: 750,
            unit: 'sq.ft.',
            confidence: 'high',
            basis: 'Net wall surface calculation',
            requires_confirmation: false
          }
        ],
        questions: [
          {
            id: 'q-1',
            question: 'What is the exact available width for the new wardrobe in the niche?',
            reason: 'Critical for carpentry material and slide hardware calculation.',
            defaultValue: 8,
            currentValue: 8,
            inputType: 'number',
            unit: 'R.ft.',
            isConfirmed: true
          },
          {
            id: 'q-2',
            question: 'Should the entire existing POP ceiling be dismantled down to RCC slab?',
            reason: 'Ensures accurate demolition and debris carting estimation.',
            defaultValue: 'Yes, full demolition',
            currentValue: 'Yes, full demolition',
            inputType: 'select',
            options: ['Yes, full demolition', 'Partial modification only', 'Repair existing'],
            isConfirmed: true
          },
          {
            id: 'q-3',
            question: 'What is the preferred wardrobe shutter mechanism and material?',
            reason: 'Drives hardware and laminate cost pricing.',
            defaultValue: 'Sliding Shutters (Soft-Close)',
            currentValue: 'Sliding Shutters (Soft-Close)',
            inputType: 'select',
            options: ['Sliding Shutters (Soft-Close)', 'Hinged Openable Shutters', 'Glass Aluminum Profile Shutters'],
            isConfirmed: true
          },
          {
            id: 'q-4',
            question: 'How many new electrical light/downlight points need to be wired in the new ceiling?',
            reason: 'Determines wiring conduits, copper cables, and COB spotlight fixtures.',
            defaultValue: 12,
            currentValue: 12,
            inputType: 'number',
            unit: 'points',
            isConfirmed: true
          }
        ],
        assumptions: [
          'Existing Italian marble flooring is structurally sound and only requires heavy masking protection.',
          'Ceiling height is standard 10 ft from finished floor level.',
          'Main 3-phase electrical supply and MCB DB are adequate for additional LED drivers and cove lights.'
        ],
        siteVerificationRequired: [
          'Verify concealment route of AC drain pipe above false ceiling.',
          'Verify wall moisture reading behind bed headboard before applying charcoal louvers.',
          'Confirm exact door frame swing clearance for new sliding wardrobe.'
        ]
      },
      boqSections: allSections,
      costSummary: costSummary,
      quotation: {
        quotationNumber: 'QTN-2026-0842',
        generatedDate: '2026-08-26',
        validUntilDate: '2026-09-10',
        discountAmount: 0,
        customTerms: DEFAULT_COMPANY_SETTINGS.defaultTerms,
        customExclusions: DEFAULT_COMPANY_SETTINGS.defaultExclusions,
        paymentMilestones: DEFAULT_COMPANY_SETTINGS.defaultPaymentSchedule,
        isLocked: false
      }
    };
  }
}
