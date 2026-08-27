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

    // Return empty array instead of demo project
    const initialList: Project[] = [];
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
    return [];
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
}
