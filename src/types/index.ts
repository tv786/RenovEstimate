export type QualityTier = 'Economy' | 'Standard' | 'Premium' | 'Luxury';

export type ProjectType =
  | 'Complete Room'
  | 'Bedroom Renovation'
  | 'Living Room Renovation'
  | 'Kitchen Renovation'
  | 'Bathroom Renovation'
  | 'Office Renovation'
  | 'POP / False Ceiling'
  | 'Flooring Work'
  | 'Painting Work'
  | 'Electrical Work'
  | 'Plumbing Work'
  | 'Wardrobe / Carpentry'
  | 'Wall Paneling'
  | 'Full House Renovation'
  | 'Custom Renovation';

export type MeasurementUnit =
  | 'sq.ft.'
  | 'sq.m.'
  | 'R.ft.'
  | 'R.m.'
  | 'ft.'
  | 'inch'
  | 'mm'
  | 'meter'
  | 'piece'
  | 'point'
  | 'day'
  | 'job'
  | 'lot'
  | 'sheet'
  | 'kg'
  | 'litre'
  | 'brass';

export type ProjectStatus =
  | 'Draft'
  | 'AI Analysis Pending'
  | 'AI Analysis Complete'
  | 'Awaiting Confirmation'
  | 'Estimate Ready'
  | 'Under Review'
  | 'Approved Internally'
  | 'Quotation Generated'
  | 'Sent to Client'
  | 'Accepted'
  | 'Rejected'
  | 'Completed';

export interface RoomSection {
  id: string;
  name: string;
  lengthFt: number;
  widthFt: number;
}

export interface OpeningDeduction {
  id: string;
  type: 'Door' | 'Window' | 'Wardrobe Niche' | 'Other';
  widthFt: number;
  heightFt: number;
  quantity: number;
}

export interface ProjectDimensions {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  sections: RoomSection[];
  openings: OpeningDeduction[];
  calculatedFloorAreaSqFt: number;
  calculatedPerimeterRFt: number;
  calculatedWallAreaSqFt: number;
  calculatedCeilingAreaSqFt: number;
  // Specific custom measurements
  wardrobeWidthRFt?: number;
  bedBackWallWidthFt?: number;
  counterLengthRFt?: number;
  customNotes?: string;
}

export interface ClientRequirementsStructured {
  ceiling: 'Keep existing' | 'Repair' | 'Partial replacement' | 'Complete replacement' | 'New design';
  wardrobe: 'No change' | 'Repair' | 'Replace' | 'Add new wardrobe' | 'Custom carpentry';
  featureWall: 'Keep' | 'Repair' | 'Redesign' | 'Complete replacement' | 'Fluted paneling';
  flooring: 'Keep' | 'Repair' | 'Replace' | 'Tile over tile';
  painting: 'Keep' | 'Touch-up' | 'Repaint' | 'Royal luxury finish';
  electrical: 'Keep' | 'Modify' | 'Add points' | 'Complete rewiring' | 'Designer lighting';
  plumbing: 'Keep' | 'Modify' | 'Add points' | 'Complete replacement';
  customNotes: string;
}

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string; // base64 or object URL
  caption?: string;
  uploadedAt: string;
}

export interface ExistingElement {
  id: string;
  element: string;
  location: string;
  condition: string;
  isAffected: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface RequestedChange {
  id: string;
  area: string;
  change: string;
  urgency: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  reason: string;
  defaultValue?: string | number;
  currentValue?: string | number;
  inputType: 'number' | 'text' | 'select';
  unit?: string;
  options?: string[];
  category?: string;
  isConfirmed: boolean;
}

export interface SuggestedScopeItem {
  id: string;
  category: string;
  workDescription: string;
  suggestedMaterial: string;
  specification: string;
  quantity: number;
  unit: MeasurementUnit;
  confidence: 'high' | 'medium' | 'low';
  basis: string;
  requires_confirmation: boolean;
  notes?: string;
}

export interface AIAnalysisResult {
  analyzedAt: string;
  modelUsed: string;
  summaryNarrative: string;
  confidenceScore: number; // 0 to 100
  existingElements: ExistingElement[];
  requestedChanges: RequestedChange[];
  suggestedScope: SuggestedScopeItem[];
  questions: ClarificationQuestion[];
  assumptions: string[];
  siteVerificationRequired: string[];
}

export interface MaterialItem {
  id: string;
  category: string;
  itemName: string;
  brand: string;
  specification: string;
  grade?: string;
  unit: MeasurementUnit;
  costPrice: number; // ₹ Contractor cost
  sellingRate: number; // ₹ Base selling rate before markup
  qualityLevel: QualityTier;
  supplier?: string;
  location: string; // 'All' | 'Jaipur' | 'Delhi' | 'Mumbai' etc.
  defaultWastagePercent: number;
  isActive: boolean;
  lastUpdated: string;
  notes?: string;
}

export interface LabourRate {
  id: string;
  labourCategory: string;
  workType: string;
  unit: MeasurementUnit;
  rate: number; // ₹ per unit
  minimumCharge: number; // ₹ minimum trip/job charge
  location: string;
  qualityLevel: QualityTier;
  notes?: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface PriceHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  type: 'material' | 'labour';
  previousRate: number;
  newRate: number;
  unit: string;
  changedBy: string;
  timestamp: string;
  reason?: string;
}

export interface CalculationExplanation {
  baseQuantity: number;
  wastagePercent: number;
  effectiveQuantity: number;
  materialUnitRate: number;
  materialTotal: number;
  labourUnitRate: number;
  labourMinCharge: number;
  labourTotal: number;
  directCostTotal: number;
  formulaDescription: string;
}

export interface BOQItem {
  id: string;
  sectionId: string;
  srNo: number;
  category: string;
  workDescription: string;
  materialId?: string;
  materialName: string;
  specification: string;
  brand?: string;
  quantity: number;
  unit: MeasurementUnit;
  materialRate: number; // ₹ / unit
  wastagePercent: number; // e.g. 10 for 10%
  labourRate: number; // ₹ / unit
  labourMinCharge?: number;
  otherCost: number; // ₹ direct other
  isManuallyAdjusted: boolean;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  // Computed values
  effectiveQuantity: number;
  materialCost: number;
  labourCost: number;
  totalDirectAmount: number;
  explanation: CalculationExplanation;
}

export interface BOQSection {
  id: string;
  name: string; // e.g., "1. Demolition & Removal", "2. POP & False Ceiling"
  order: number;
  items: BOQItem[];
}

export interface InternalCostSummary {
  totalMaterialCost: number;
  totalLabourCost: number;
  totalDirectCost: number;
  transportationCost: number;
  debrisRemovalCost: number;
  siteProtectionCost: number;
  miscellaneousCost: number;
  subtotal: number;
  overheadPercent: number;
  overheadAmount: number;
  costBeforeProfit: number;
  profitMarginPercent: number;
  profitAmount: number;
  recommendedSellingPrice: number;
  gstPercent: number;
  gstAmount: number;
  finalClientPrice: number;
}

export interface PaymentMilestone {
  stageName: string;
  percentage: number;
  description: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  defaultQuotationValidityDays: number;
  defaultOverheadPercent: number;
  defaultProfitMarginPercent: number;
  defaultGstPercent: number;
  defaultPaymentSchedule: PaymentMilestone[];
  defaultTerms: string[];
  defaultExclusions: string[];
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
}

export interface ClientQuotation {
  quotationNumber: string;
  generatedDate: string;
  validUntilDate: string;
  discountAmount: number;
  customTerms: string[];
  customExclusions: string[];
  paymentMilestones: PaymentMilestone[];
  isLocked: boolean;
}

export interface ActualCostItemRecord {
  boqItemId: string;
  workDescription: string;
  estimatedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercent: number;
  notes?: string;
}

export interface ActualProjectCostRecord {
  projectId: string;
  completedDate: string;
  totalEstimatedSellingPrice: number;
  totalEstimatedInternalCost: number;
  totalActualCost: number;
  netVarianceAmount: number;
  netVariancePercent: number;
  items: ActualCostItemRecord[];
  learningInsights: string[];
}

export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  siteLocation: string; // e.g., 'Jaipur', 'Delhi', etc.
  projectType: ProjectType;
  qualityTier: QualityTier;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  dimensions: ProjectDimensions;
  images: UploadedImage[];
  clientRequirements: ClientRequirementsStructured;
  aiAnalysis?: AIAnalysisResult;
  boqSections: BOQSection[];
  costSummary: InternalCostSummary;
  quotation?: ClientQuotation;
  actualCostRecord?: ActualProjectCostRecord;
  version: number;
  notes?: string;
}
