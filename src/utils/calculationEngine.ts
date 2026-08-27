import {
  BOQItem,
  BOQSection,
  CalculationExplanation,
  InternalCostSummary,
  ProjectDimensions,
  RoomSection,
  OpeningDeduction,
  QualityTier,
  MeasurementUnit
} from '../types';

/**
 * Calculates physical geometric dimensions for regular and irregular rooms with openings deduction.
 */
export function computeDimensions(
  lengthFt: number,
  widthFt: number,
  heightFt: number,
  sections: RoomSection[] = [],
  openings: OpeningDeduction[] = []
): {
  floorAreaSqFt: number;
  perimeterRFt: number;
  grossWallAreaSqFt: number;
  openingsDeductionSqFt: number;
  netWallAreaSqFt: number;
  ceilingAreaSqFt: number;
} {
  let floorAreaSqFt = 0;
  let perimeterRFt = 0;

  if (sections && sections.length > 0) {
    floorAreaSqFt = sections.reduce(
      (sum, sec) => sum + (Number(sec.lengthFt) || 0) * (Number(sec.widthFt) || 0),
      0
    );
    // Approximation for irregular room perimeter: sum of 2*(L+W) per section or bounding perimeter
    perimeterRFt = sections.reduce(
      (sum, sec) => sum + 2 * ((Number(sec.lengthFt) || 0) + (Number(sec.widthFt) || 0)),
      0
    );
  } else {
    const l = Number(lengthFt) || 0;
    const w = Number(widthFt) || 0;
    floorAreaSqFt = l * w;
    perimeterRFt = 2 * (l + w);
  }

  const h = Number(heightFt) || 10;
  const grossWallAreaSqFt = perimeterRFt * h;

  const openingsDeductionSqFt = (openings || []).reduce((sum, op) => {
    const w = Number(op.widthFt) || 0;
    const oh = Number(op.heightFt) || 0;
    const q = Number(op.quantity) || 1;
    return sum + w * oh * q;
  }, 0);

  const netWallAreaSqFt = Math.max(0, grossWallAreaSqFt - openingsDeductionSqFt);
  const ceilingAreaSqFt = floorAreaSqFt;

  return {
    floorAreaSqFt: Math.round(floorAreaSqFt * 100) / 100,
    perimeterRFt: Math.round(perimeterRFt * 100) / 100,
    grossWallAreaSqFt: Math.round(grossWallAreaSqFt * 100) / 100,
    openingsDeductionSqFt: Math.round(openingsDeductionSqFt * 100) / 100,
    netWallAreaSqFt: Math.round(netWallAreaSqFt * 100) / 100,
    ceilingAreaSqFt: Math.round(ceilingAreaSqFt * 100) / 100,
  };
}

/**
 * Calculates a single BOQ item with strict deterministic mathematics and generates transparent explanation.
 */
export function calculateBOQItemRow(
  rawItem: Omit<
    BOQItem,
    | 'effectiveQuantity'
    | 'materialCost'
    | 'labourCost'
    | 'totalDirectAmount'
    | 'explanation'
  >
): BOQItem {
  const qty = Number(rawItem.quantity) || 0;
  const wastage = Math.max(0, Number(rawItem.wastagePercent) || 0);
  const matRate = Math.max(0, Number(rawItem.materialRate) || 0);
  const labRate = Math.max(0, Number(rawItem.labourRate) || 0);
  const minLabour = Math.max(0, Number(rawItem.labourMinCharge) || 0);
  const otherCost = Math.max(0, Number(rawItem.otherCost) || 0);

  // 1. Wastage calculation
  const effectiveQuantity = Math.round(qty * (1 + wastage / 100) * 100) / 100;

  // 2. Material Cost
  const materialCost = Math.round(effectiveQuantity * matRate);

  // 3. Labour Cost with minimum charge rule
  const calculatedLabour = Math.round(qty * labRate);
  const labourCost = Math.max(calculatedLabour, minLabour > 0 && qty > 0 ? minLabour : 0);

  // 4. Total Direct Cost
  const totalDirectAmount = materialCost + labourCost + otherCost;

  // 5. Build clear explanation text
  let formulaDescription = `Effective Qty = ${qty} ${rawItem.unit} + ${wastage}% wastage = ${effectiveQuantity} ${rawItem.unit}.\n`;
  formulaDescription += `Material Cost = ${effectiveQuantity} ${rawItem.unit} × ₹${matRate.toLocaleString('en-IN')}/${rawItem.unit} = ₹${materialCost.toLocaleString('en-IN')}.\n`;

  if (minLabour > 0 && calculatedLabour < minLabour && qty > 0) {
    formulaDescription += `Labour Cost = ₹${minLabour.toLocaleString('en-IN')} (Minimum job charge applied as calculated ₹${calculatedLabour.toLocaleString('en-IN')} < ₹${minLabour.toLocaleString('en-IN')}).\n`;
  } else {
    formulaDescription += `Labour Cost = ${qty} ${rawItem.unit} × ₹${labRate.toLocaleString('en-IN')}/${rawItem.unit} = ₹${labourCost.toLocaleString('en-IN')}.\n`;
  }

  if (otherCost > 0) {
    formulaDescription += `Other direct/hardware allowance = ₹${otherCost.toLocaleString('en-IN')}.\n`;
  }
  formulaDescription += `Total Direct Cost = ₹${totalDirectAmount.toLocaleString('en-IN')}`;

  const explanation: CalculationExplanation = {
    baseQuantity: qty,
    wastagePercent: wastage,
    effectiveQuantity,
    materialUnitRate: matRate,
    materialTotal: materialCost,
    labourUnitRate: labRate,
    labourMinCharge: minLabour,
    labourTotal: labourCost,
    directCostTotal: totalDirectAmount,
    formulaDescription,
  };

  return {
    ...rawItem,
    effectiveQuantity,
    materialCost,
    labourCost,
    totalDirectAmount,
    explanation,
  };
}

/**
 * Calculates project-wide internal cost, contractor markup, and final client selling price.
 */
export function calculateCostSummary(
  sections: BOQSection[],
  options: {
    overheadPercent?: number;
    profitMarginPercent?: number;
    gstPercent?: number;
    transportationCost?: number;
    debrisRemovalCost?: number;
    siteProtectionCost?: number;
    miscellaneousCost?: number;
  } = {}
): InternalCostSummary {
  let totalMaterialCost = 0;
  let totalLabourCost = 0;
  let totalDirectCost = 0;

  for (const sec of sections) {
    for (const item of sec.items) {
      totalMaterialCost += item.materialCost || 0;
      totalLabourCost += item.labourCost || 0;
      totalDirectCost += item.totalDirectAmount || 0;
    }
  }

  const transportationCost = options.transportationCost ?? 4500;
  const debrisRemovalCost = options.debrisRemovalCost ?? 5000;
  const siteProtectionCost = options.siteProtectionCost ?? 3500;
  const miscellaneousCost = options.miscellaneousCost ?? 3000;

  const subtotal =
    totalDirectCost +
    transportationCost +
    debrisRemovalCost +
    siteProtectionCost +
    miscellaneousCost;

  const overheadPercent = options.overheadPercent ?? 8;
  const overheadAmount = Math.round(subtotal * (overheadPercent / 100));

  const costBeforeProfit = subtotal + overheadAmount;

  const profitMarginPercent = options.profitMarginPercent ?? 18;
  const profitAmount = Math.round(costBeforeProfit * (profitMarginPercent / 100));

  const recommendedSellingPrice = costBeforeProfit + profitAmount;

  const gstPercent = options.gstPercent ?? 18;
  const gstAmount = Math.round(recommendedSellingPrice * (gstPercent / 100));

  const finalClientPrice = recommendedSellingPrice + gstAmount;

  return {
    totalMaterialCost,
    totalLabourCost,
    totalDirectCost,
    transportationCost,
    debrisRemovalCost,
    siteProtectionCost,
    miscellaneousCost,
    subtotal,
    overheadPercent,
    overheadAmount,
    costBeforeProfit,
    profitMarginPercent,
    profitAmount,
    recommendedSellingPrice,
    gstPercent,
    gstAmount,
    finalClientPrice,
  };
}

/**
 * Calculates estimation confidence score (0 - 100%) based on verifiable physical data:
 * - Dimensions provided and non-zero
 * - Photos uploaded (1 = +15%, 3+ = +30%)
 * - Clarification questions answered and confirmed
 * - High vs low confidence scope items ratio
 */
export function computeConfidenceScore(
  dimensions: ProjectDimensions,
  imagesCount: number,
  questions: Array<{ isConfirmed: boolean }>,
  boqItems: BOQItem[]
): number {
  let score = 30; // base confidence

  // Dimensions factor (up to 25 pts)
  if (dimensions.lengthFt > 0 && dimensions.widthFt > 0) score += 15;
  if (dimensions.heightFt > 0) score += 5;
  if (dimensions.wardrobeWidthRFt || dimensions.bedBackWallWidthFt) score += 5;

  // Photos factor (up to 20 pts)
  if (imagesCount >= 1) score += 10;
  if (imagesCount >= 3) score += 10;

  // Questions confirmed factor (up to 15 pts)
  if (questions.length > 0) {
    const confirmedCount = questions.filter((q) => q.isConfirmed).length;
    const ratio = confirmedCount / questions.length;
    score += Math.round(ratio * 15);
  } else {
    score += 15;
  }

  // BOQ items confidence factor (up to 10 pts)
  if (boqItems.length > 0) {
    const highCount = boqItems.filter((i) => i.confidence === 'high').length;
    const ratio = highCount / boqItems.length;
    score += Math.round(ratio * 10);
  }

  return Math.min(98, Math.max(40, score));
}

/**
 * Format Indian Currency (e.g. ₹4,85,000)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

/**
 * Converts Indian Rupee number to Words (e.g. Rupees Five Lakh Eighty-Five Thousand Four Hundred Twenty Only)
 */
export function numberToWordsINR(num: number): string {
  if (isNaN(num) || num === null || num === undefined || num === 0) {
    return 'Rupees Zero Only';
  }

  const rounded = Math.round(num);
  if (rounded === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tensMultiple[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + singleDigits[n % 10] : '') + ' ';
    } else if (n >= 10) {
      str += twoDigits[n - 10] + ' ';
    } else if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str.trim();
  }

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  let hundredPart = remainder;

  let words = '';

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (hundredPart > 0) {
    words += convertLessThanThousand(hundredPart) + ' ';
  }

  return `Rupees ${words.trim()} Only`;
}

