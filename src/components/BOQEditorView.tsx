import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Copy,
  HelpCircle,
  Calculator,
  Eye,
  Send,
  Sparkles,
  Layers,
  IndianRupee,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  Save,
  Check,
  Percent,
  Sliders,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  Project,
  BOQSection,
  BOQItem,
  MaterialItem,
  LabourRate
} from '../types';
import {
  calculateBOQItemRow,
  calculateCostSummary,
  formatINR
} from '../utils/calculationEngine';
import { ExplainCalculationModal } from './ExplainCalculationModal';

interface BOQEditorViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToQuotation: () => void;
  materials: MaterialItem[];
  labourRates: LabourRate[];
}

export const BOQEditorView: React.FC<BOQEditorViewProps> = ({
  project,
  onUpdateProject,
  onProceedToQuotation,
  materials,
  labourRates,
}) => {
  const [sections, setSections] = useState<BOQSection[]>(
    project.boqSections || []
  );
  const [selectedExplItem, setSelectedExplItem] = useState<BOQItem | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true,
    'sec-3': true,
    'sec-4': true,
  });

  // Global Markup & Margin Tool State
  const [isMarkupToolOpen, setIsMarkupToolOpen] = useState(false);
  const [markupTarget, setMarkupTarget] = useState<'both' | 'material' | 'labour'>('both');
  const [materialMarkupPercent, setMaterialMarkupPercent] = useState<number>(10);
  const [labourMarkupPercent, setLabourMarkupPercent] = useState<number>(10);
  const [globalUniformPercent, setGlobalUniformPercent] = useState<number>(10);
  const [isUniformMode, setIsUniformMode] = useState<boolean>(true);
  const [targetCategoryFilter, setTargetCategoryFilter] = useState<string>('all');
  const [roundingOption, setRoundingOption] = useState<'none' | '5' | '10'>('none');
  const [previousSectionsSnapshot, setPreviousSectionsSnapshot] = useState<BOQSection[] | null>(null);
  const [lastAppliedNote, setLastAppliedNote] = useState<string | null>(null);

  // Cost markup params
  const [overheadPercent, setOverheadPercent] = useState<number>(
    project.costSummary?.overheadPercent ?? 8
  );
  const [profitPercent, setProfitPercent] = useState<number>(
    project.costSummary?.profitMarginPercent ?? 18
  );
  const [transportCost, setTransportCost] = useState<number>(
    project.costSummary?.transportationCost ?? 4500
  );
  const [debrisCost, setDebrisCost] = useState<number>(
    project.costSummary?.debrisRemovalCost ?? 5000
  );
  const [protectionCost, setProtectionCost] = useState<number>(
    project.costSummary?.siteProtectionCost ?? 3500
  );
  const [miscCost, setMiscCost] = useState<number>(
    project.costSummary?.miscellaneousCost ?? 2500
  );
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Saved');

  // New Item Modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addItemSectionId, setAddItemSectionId] = useState<string>('');
  const [newWorkDesc, setNewWorkDesc] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newCat, setNewCat] = useState('Carpentry');
  const [newQty, setNewQty] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('sq.ft.');
  const [newMatRate, setNewMatRate] = useState<number>(100);
  const [newWastage, setNewWastage] = useState<number>(8);
  const [newLabRate, setNewLabRate] = useState<number>(35);

  // Toggle section accordion
  const toggleSection = (secId: string) => {
    setExpandedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Recompute cost summary
  const currentSummary = calculateCostSummary(sections, {
    overheadPercent,
    profitMarginPercent: profitPercent,
    gstPercent: 18,
    transportationCost: transportCost,
    debrisRemovalCost: debrisCost,
    siteProtectionCost: protectionCost,
    miscellaneousCost: miscCost,
  });

  // Helper to commit changes to project
  const saveAllChanges = (newSecs: BOQSection[], customToastMsg?: string) => {
    const summary = calculateCostSummary(newSecs, {
      overheadPercent,
      profitMarginPercent: profitPercent,
      gstPercent: 18,
      transportationCost: transportCost,
      debrisRemovalCost: debrisCost,
      siteProtectionCost: protectionCost,
      miscellaneousCost: miscCost,
    });

    const updated: Project = {
      ...project,
      boqSections: newSecs,
      costSummary: summary,
      status: 'Estimate Ready',
    };

    setSections(newSecs);
    onUpdateProject(updated);
    setToastMessage(customToastMsg || 'Saved');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  // Extract distinct categories from current items
  const availableCategories = Array.from(
    new Set(
      sections.flatMap((s) => s.items.map((i) => i.category || 'General'))
    )
  ).filter(Boolean);

  // Simulate preview of Global Markup
  const calculateSimulatedPreview = () => {
    const matPct = isUniformMode ? globalUniformPercent : (markupTarget === 'labour' ? 0 : materialMarkupPercent);
    const labPct = isUniformMode ? globalUniformPercent : (markupTarget === 'material' ? 0 : labourMarkupPercent);

    let countAffected = 0;
    const simulatedSecs = sections.map((sec) => ({
      ...sec,
      items: sec.items.map((it) => {
        const matchesCategory = targetCategoryFilter === 'all' || it.category === targetCategoryFilter;
        if (!matchesCategory) return it;

        countAffected++;
        let newMat = it.materialRate;
        let newLab = it.labourRate;

        if (matPct !== 0 && (markupTarget === 'both' || markupTarget === 'material' || isUniformMode)) {
          newMat = Math.max(0, Math.round(it.materialRate * (1 + matPct / 100) * 100) / 100);
          if (roundingOption === '5') newMat = Math.round(newMat / 5) * 5;
          if (roundingOption === '10') newMat = Math.round(newMat / 10) * 10;
        }

        if (labPct !== 0 && (markupTarget === 'both' || markupTarget === 'labour' || isUniformMode)) {
          newLab = Math.max(0, Math.round(it.labourRate * (1 + labPct / 100) * 100) / 100);
          if (roundingOption === '5') newLab = Math.round(newLab / 5) * 5;
          if (roundingOption === '10') newLab = Math.round(newLab / 10) * 10;
        }

        return calculateBOQItemRow({
          ...it,
          materialRate: newMat,
          labourRate: newLab,
        });
      }),
    }));

    const simSummary = calculateCostSummary(simulatedSecs, {
      overheadPercent,
      profitMarginPercent: profitPercent,
      gstPercent: 18,
      transportationCost: transportCost,
      debrisRemovalCost: debrisCost,
      siteProtectionCost: protectionCost,
      miscellaneousCost: miscCost,
    });

    return {
      simulatedSecs,
      simSummary,
      countAffected,
      matDelta: simSummary.totalMaterialCost - currentSummary.totalMaterialCost,
      labDelta: simSummary.totalLabourCost - currentSummary.totalLabourCost,
      directDelta: simSummary.totalDirectCost - currentSummary.totalDirectCost,
      priceDelta: simSummary.finalClientPrice - currentSummary.finalClientPrice,
    };
  };

  const preview = calculateSimulatedPreview();

  // Execute Global Markup Application
  const handleApplyGlobalMarkup = () => {
    // Save current snapshot for undo capability
    setPreviousSectionsSnapshot(JSON.parse(JSON.stringify(sections)));

    const matPct = isUniformMode ? globalUniformPercent : (markupTarget === 'labour' ? 0 : materialMarkupPercent);
    const labPct = isUniformMode ? globalUniformPercent : (markupTarget === 'material' ? 0 : labourMarkupPercent);

    saveAllChanges(
      preview.simulatedSecs,
      `Applied ${isUniformMode ? `${globalUniformPercent}%` : `Mat +${matPct}%, Lab +${labPct}%`} markup across ${preview.countAffected} items`
    );

    setLastAppliedNote(
      `Applied ${isUniformMode ? `${globalUniformPercent}% uniform markup` : `Material +${matPct}%, Labour +${labPct}%`} on ${preview.countAffected} items`
    );
  };

  // Undo / Revert back to snapshot
  const handleUndoMarkup = () => {
    if (!previousSectionsSnapshot) return;
    saveAllChanges(previousSectionsSnapshot, 'Reverted to previous rates');
    setPreviousSectionsSnapshot(null);
    setLastAppliedNote(null);
  };

  // Update a single cell in a BOQ item
  const handleItemFieldChange = (
    secId: string,
    itemId: string,
    field: keyof BOQItem,
    value: any
  ) => {
    const updatedSecs = sections.map((sec) => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        items: sec.items.map((it) => {
          if (it.id !== itemId) return it;
          const updatedRaw = {
            ...it,
            [field]: value,
            isManuallyAdjusted: true,
          };
          return calculateBOQItemRow(updatedRaw);
        }),
      };
    });

    saveAllChanges(updatedSecs);
  };

  // Delete item row
  const handleDeleteItem = (secId: string, itemId: string) => {
    const updatedSecs = sections.map((sec) => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        items: sec.items.filter((it) => it.id !== itemId),
      };
    });
    saveAllChanges(updatedSecs);
  };

  // Duplicate item row
  const handleDuplicateItem = (secId: string, item: BOQItem) => {
    const duplicated: BOQItem = {
      ...item,
      id: 'boq-item-' + Date.now(),
      workDescription: `${item.workDescription} (Copy)`,
      srNo: item.srNo + 1,
    };

    const updatedSecs = sections.map((sec) => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        items: [...sec.items, duplicated],
      };
    });
    saveAllChanges(updatedSecs);
  };

  // Add new section
  const handleAddSection = () => {
    const newSec: BOQSection = {
      id: 'sec-' + Date.now(),
      name: `${sections.length + 1}. Additional Work Package`,
      order: sections.length + 1,
      items: [],
    };
    saveAllChanges([...sections, newSec]);
  };

  // Add Item Submit
  const handleAddItemSubmit = () => {
    if (!newWorkDesc.trim()) return;

    const raw = {
      id: 'boq-item-' + Date.now(),
      sectionId: addItemSectionId,
      srNo: 1,
      category: newCat,
      workDescription: newWorkDesc,
      materialName: newWorkDesc,
      specification: newSpec || 'Contractor standard specification',
      quantity: newQty,
      unit: newUnit,
      materialRate: newMatRate,
      wastagePercent: newWastage,
      labourRate: newLabRate,
      otherCost: 0,
      isManuallyAdjusted: true,
      confidence: 'high' as const,
    };

    const calculated = calculateBOQItemRow(raw);

    const updatedSecs = sections.map((sec) => {
      if (sec.id !== addItemSectionId) return sec;
      return {
        ...sec,
        items: [...sec.items, calculated],
      };
    });

    saveAllChanges(updatedSecs);
    setIsAddItemOpen(false);
    setNewWorkDesc('');
    setNewSpec('');
  };

  // Quick picker from Materials Database
  const handleSelectPredefinedMaterial = (matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    if (!mat) return;
    setNewWorkDesc(`${mat.category} - ${mat.itemName}`);
    setNewSpec(mat.specification);
    setNewCat(mat.category);
    setNewUnit(mat.unit);
    setNewMatRate(mat.sellingRate);
    setNewWastage(mat.wastagePercent);
    // Find matching labour rate
    const lab = labourRates.find(
      (l) => l.category === mat.category && l.unit === mat.unit
    );
    if (lab) setNewLabRate(lab.ratePerUnit);
  };

  // Export BOQ to CSV
  const handleExportCSV = () => {
    let csv = 'Section,Sr No,Work Description,Specification,Quantity,Unit,Material Rate (INR),Wastage (%),Labour Rate (INR),Material Cost (INR),Labour Cost (INR),Total Direct Amount (INR)\n';
    sections.forEach((sec) => {
      sec.items.forEach((it) => {
        csv += `"${sec.name}",${it.srNo},"${it.workDescription.replace(/"/g, '""')}","${it.specification.replace(/"/g, '""')}",${it.quantity},"${it.unit}",${it.materialRate},${it.wastagePercent},${it.labourRate},${it.materialCost},${it.labourCost},${it.totalDirectAmount}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.projectName.replace(/\s+/g, '_')}_BOQ.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
                <FileSpreadsheet className="w-3 h-3" />
                <span>BOQ Schedule</span>
              </span>

              {showSaveToast && (
                <span className="inline-flex items-center gap-1 text-[10px] text-black font-bold uppercase tracking-wider bg-[#EBA224]/30 px-2 py-0.5 rounded-full border border-[#EBA224]">
                  <Check className="w-3 h-3 text-black" /> {toastMessage}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Bill of Quantities (BOQ)
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Itemized renovation schedule with material wastage, labour, and markup controls.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMarkupToolOpen(!isMarkupToolOpen)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer min-h-[38px] active:scale-95 ${
                isMarkupToolOpen
                  ? 'bg-[#EBA224] text-black shadow-xs'
                  : 'bg-black text-[#EBA224] hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isMarkupToolOpen ? 'Close Markup' : 'Markup Tool'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-black transition cursor-pointer border border-neutral-300 min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleAddSection}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-black transition cursor-pointer border border-neutral-300 min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Section</span>
            </button>

            <button
              onClick={onProceedToQuotation}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EBA224] hover:bg-[#d8921b] text-black shadow-xs transition cursor-pointer min-h-[38px] active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MARKUP & MARGIN TOOL (Dedicated Interactive Multiplier Console) */}
      {/* ========================================================================= */}
      {isMarkupToolOpen && (
        <div className="bg-black text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-lg space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBA224] flex items-center justify-center text-black font-extrabold shadow-sm">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Global Markup & Margin Multiplier</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#EBA224] text-black">
                    Live Engine
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Bulk adjust material unit rates, labour allowances, and target margins across all items in one click.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {previousSectionsSnapshot && (
                <button
                  onClick={handleUndoMarkup}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-neutral-800 hover:bg-neutral-700 text-[#EBA224] transition cursor-pointer border border-neutral-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo Last Markup</span>
                </button>
              )}
              <button
                onClick={() => setIsMarkupToolOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            {/* Left Controls (6 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Mode Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUniformMode(true)}
                  className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider transition cursor-pointer text-xs ${
                    isUniformMode
                      ? 'bg-[#EBA224] text-black'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  Uniform Markup (Materials + Labour)
                </button>
                <button
                  type="button"
                  onClick={() => setIsUniformMode(false)}
                  className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider transition cursor-pointer text-xs ${
                    !isUniformMode
                      ? 'bg-[#EBA224] text-black'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  Split Multipliers (Individual)
                </button>
              </div>

              {/* Uniform Slider / Stepper */}
              {isUniformMode ? (
                <div className="bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">Uniform Overhead Percentage</div>
                      <div className="text-[11px] text-neutral-400">
                        Applies simultaneously to both material rates and labour charges
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="-50"
                        max="100"
                        value={globalUniformPercent}
                        onChange={(e) => setGlobalUniformPercent(Number(e.target.value) || 0)}
                        className="w-20 px-2.5 py-1.5 bg-black border border-neutral-700 rounded-xl text-center font-mono font-bold text-base text-[#EBA224] focus:outline-hidden"
                      />
                      <span className="font-bold text-base text-neutral-400">%</span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    step="1"
                    value={globalUniformPercent}
                    onChange={(e) => setGlobalUniformPercent(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#EBA224]"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Quick Presets:</span>
                    {[-10, -5, 0, 5, 10, 15, 20, 25, 30].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGlobalUniformPercent(preset)}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                          globalUniformPercent === preset
                            ? 'bg-[#EBA224] text-black'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {preset > 0 ? `+${preset}%` : `${preset}%`}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Split Sliders */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Material Markup Box */}
                  <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Material Rates Markup</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-[#EBA224]">
                        <input
                          type="number"
                          value={materialMarkupPercent}
                          onChange={(e) => setMaterialMarkupPercent(Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-black border border-neutral-700 rounded-lg text-center text-xs"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="50"
                      step="1"
                      value={materialMarkupPercent}
                      onChange={(e) => setMaterialMarkupPercent(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#EBA224]"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[0, 5, 10, 15, 20].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setMaterialMarkupPercent(p)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                        >
                          {p > 0 ? `+${p}%` : '0%'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Labour Markup Box */}
                  <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Labour Rates Markup</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-[#EBA224]">
                        <input
                          type="number"
                          value={labourMarkupPercent}
                          onChange={(e) => setLabourMarkupPercent(Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-black border border-neutral-700 rounded-lg text-center text-xs"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="50"
                      step="1"
                      value={labourMarkupPercent}
                      onChange={(e) => setLabourMarkupPercent(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#EBA224]"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[0, 5, 10, 15, 20].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setLabourMarkupPercent(p)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                        >
                          {p > 0 ? `+${p}%` : '0%'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider text-[10px] font-bold mb-1.5">
                    Target Category Filter
                  </label>
                  <select
                    value={targetCategoryFilter}
                    onChange={(e) => setTargetCategoryFilter(e.target.value)}
                    className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white font-medium focus:outline-hidden"
                  >
                    <option value="all">All BOQ Items ({sections.reduce((acc, s) => acc + s.items.length, 0)} items)</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        Category: {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider text-[10px] font-bold mb-1.5">
                    Rate Rounding Preference
                  </label>
                  <select
                    value={roundingOption}
                    onChange={(e) => setRoundingOption(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white font-medium focus:outline-hidden"
                  >
                    <option value="none">Exact (Decimal precision)</option>
                    <option value="5">Round to nearest ₹5</option>
                    <option value="10">Round to nearest ₹10</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Live Simulation Impact Card (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-900 p-5 rounded-2xl border border-neutral-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
                  <span className="font-bold text-[#EBA224] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Live Impact Simulation
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {preview.countAffected} items affected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Material Shift */}
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Material Direct Cost:</span>
                    <div className="text-right font-mono">
                      <span className="text-neutral-500 line-through mr-1.5">{formatINR(currentSummary.totalMaterialCost)}</span>
                      <span className="font-bold text-white">{formatINR(preview.simSummary.totalMaterialCost)}</span>
                      <span className="text-[10px] text-[#EBA224] block">
                        {preview.matDelta >= 0 ? `+${formatINR(preview.matDelta)}` : formatINR(preview.matDelta)}
                      </span>
                    </div>
                  </div>

                  {/* Labour Shift */}
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Labour Direct Cost:</span>
                    <div className="text-right font-mono">
                      <span className="text-neutral-500 line-through mr-1.5">{formatINR(currentSummary.totalLabourCost)}</span>
                      <span className="font-bold text-white">{formatINR(preview.simSummary.totalLabourCost)}</span>
                      <span className="text-[10px] text-[#EBA224] block">
                        {preview.labDelta >= 0 ? `+${formatINR(preview.labDelta)}` : formatINR(preview.labDelta)}
                      </span>
                    </div>
                  </div>

                  {/* Direct Cost Subtotal */}
                  <div className="pt-2 border-t border-neutral-800 flex justify-between items-center font-bold text-white">
                    <span>New Direct Site Cost:</span>
                    <span className="font-mono text-white text-sm">
                      {formatINR(preview.simSummary.totalDirectCost)}
                    </span>
                  </div>

                  {/* Quotation Shift */}
                  <div className="bg-black/60 p-3 rounded-xl border border-neutral-800 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-bold">New Final Client Quotation</div>
                      <div className="text-xs text-[#EBA224] font-semibold">
                        {preview.priceDelta >= 0 ? `+${formatINR(preview.priceDelta)} net gain` : `${formatINR(preview.priceDelta)} net discount`}
                      </div>
                    </div>
                    <div className="font-mono text-base font-extrabold text-[#EBA224]">
                      {formatINR(preview.simSummary.finalClientPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleApplyGlobalMarkup}
                  className="w-full py-3 rounded-full bg-[#EBA224] hover:bg-[#d8921b] text-black font-extrabold text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Markup to All BOQ Items</span>
                </button>

                {lastAppliedNote && (
                  <p className="text-[10px] text-neutral-400 text-center italic">
                    ✓ {lastAppliedNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOQ Sections Table Container */}
      <div className="space-y-6">
        {sections.map((section) => {
          const isExpanded = expandedSections[section.id] !== false;
          const sectionTotal = section.items.reduce(
            (sum, it) => sum + it.totalDirectAmount,
            0
          );

          return (
            <div
              key={section.id}
              className="bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden"
            >
              {/* Section Header Accordion */}
              <div
                onClick={() => toggleSection(section.id)}
                className="p-5 bg-neutral-100/70 border-b border-black/10 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-200/50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-full bg-black text-white">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#EBA224]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#EBA224]" />
                    )}
                  </span>
                  <div className="font-bold text-base text-black">
                    {section.name}
                  </div>
                  <span className="text-xs text-neutral-500 font-semibold">
                    ({section.items.length} items)
                  </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                      Section Direct Total
                    </div>
                    <div className="text-base font-bold text-black font-mono">
                      {formatINR(sectionTotal)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddItemSectionId(section.id);
                      setIsAddItemOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-black bg-[#EBA224] hover:bg-[#d8921b] px-3.5 py-1.5 rounded-full transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items Container: Table for Desktop, Touch Cards for Mobile */}
              {isExpanded && (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider font-bold border-b border-black/10">
                        <tr>
                          <th className="px-4 py-3 w-10 text-center">#</th>
                          <th className="px-4 py-3 min-w-[220px]">Work & Specification</th>
                          <th className="px-3 py-3 w-24">Qty</th>
                          <th className="px-3 py-3 w-24">Unit</th>
                          <th className="px-3 py-3 w-24">Mat Rate (₹)</th>
                          <th className="px-3 py-3 w-24">Wastage</th>
                          <th className="px-3 py-3 w-24">Labour (₹)</th>
                          <th className="px-4 py-3 w-28 text-right">Line Total (₹)</th>
                          <th className="px-3 py-3 w-20 text-center">Formula</th>
                          <th className="px-4 py-3 w-16 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {section.items.map((item, idx) => (
                          <tr
                            key={item.id}
                            className="hover:bg-neutral-50/80 transition group"
                          >
                            {/* Sr No */}
                            <td className="px-4 py-3.5 text-center font-mono text-neutral-400 font-semibold">
                              {idx + 1}
                            </td>

                            {/* Work Description & Spec */}
                            <td className="px-4 py-3.5">
                              <input
                                type="text"
                                value={item.workDescription}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'workDescription',
                                    e.target.value
                                  )
                                }
                                className="w-full font-bold text-sm text-black bg-transparent hover:bg-neutral-100 focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-hidden"
                              />
                              <input
                                type="text"
                                value={item.specification}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'specification',
                                    e.target.value
                                  )
                                }
                                placeholder="Specification / Brand"
                                className="w-full text-neutral-500 italic bg-transparent hover:bg-neutral-100 focus:bg-white px-2 py-0.5 rounded-lg border border-transparent hover:border-neutral-300 focus:border-black outline-hidden text-[11px] mt-0.5"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="px-3 py-3.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'quantity',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-2.5 py-1 font-bold text-black bg-neutral-100 hover:bg-white focus:bg-white border border-neutral-300 rounded-lg focus:border-black outline-hidden text-xs font-mono"
                              />
                            </td>

                            {/* Unit */}
                            <td className="px-3 py-3.5">
                              <select
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded-lg font-medium text-black text-xs focus:outline-hidden"
                              >
                                <option value="sq.ft.">sq.ft.</option>
                                <option value="R.ft.">R.ft.</option>
                                <option value="point">point</option>
                                <option value="job">job</option>
                                <option value="lot">lot</option>
                                <option value="piece">piece</option>
                                <option value="day">day</option>
                                <option value="bag">bag</option>
                                <option value="brass">brass</option>
                              </select>
                            </td>

                            {/* Material Rate */}
                            <td className="px-3 py-3.5">
                              <input
                                type="number"
                                min="0"
                                value={item.materialRate}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'materialRate',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-2.5 py-1 font-semibold text-black bg-neutral-100 hover:bg-white focus:bg-white border border-neutral-300 rounded-lg focus:border-black outline-hidden text-xs font-mono"
                              />
                            </td>

                            {/* Wastage */}
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={item.wastagePercent}
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      section.id,
                                      item.id,
                                      'wastagePercent',
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="w-12 px-1.5 py-1 text-center font-medium text-black bg-neutral-100 hover:bg-white focus:bg-white border border-neutral-300 rounded-lg focus:border-black outline-hidden text-xs font-mono"
                                />
                                <span className="text-neutral-500 font-mono">%</span>
                              </div>
                            </td>

                            {/* Labour Rate */}
                            <td className="px-3 py-3.5">
                              <input
                                type="number"
                                min="0"
                                value={item.labourRate}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'labourRate',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-2.5 py-1 font-semibold text-black bg-neutral-100 hover:bg-white focus:bg-white border border-neutral-300 rounded-lg focus:border-black outline-hidden text-xs font-mono"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="px-4 py-3.5 text-right font-bold text-black font-mono text-sm">
                              {formatINR(item.totalDirectAmount)}
                            </td>

                            {/* Why? Popover trigger */}
                            <td className="px-3 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedExplItem(item)}
                                title="Click to inspect step-by-step formula breakdown"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 hover:bg-black hover:text-white text-black font-bold text-[11px] border border-neutral-300 transition cursor-pointer"
                              >
                                <Calculator className="w-3 h-3 text-[#EBA224]" />
                                <span>Why?</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateItem(section.id, item)}
                                  title="Duplicate Row"
                                  className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-200 rounded-full transition cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(section.id, item.id)}
                                  title="Delete Row"
                                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile BOQ Item Cards View (Field friendly, large touch targets) */}
                  <div className="md:hidden divide-y divide-black/10">
                    {section.items.map((item, idx) => (
                      <div key={item.id} className="p-4 space-y-3 bg-white">
                        {/* Row 1: Item # + Work Description */}
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-1">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.workDescription}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  section.id,
                                  item.id,
                                  'workDescription',
                                  e.target.value
                                )
                              }
                              placeholder="Work Description"
                              className="w-full font-bold text-sm text-black bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200 focus:border-black outline-hidden"
                            />
                            <input
                              type="text"
                              value={item.specification}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  section.id,
                                  item.id,
                                  'specification',
                                  e.target.value
                                )
                              }
                              placeholder="Specification / Brand"
                              className="w-full text-xs text-neutral-500 italic bg-transparent px-2.5 py-1 mt-0.5 rounded-lg border border-transparent focus:border-neutral-300 outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Row 2: Inputs Grid (Quantity, Unit, Material Rate, Wastage, Labour) */}
                        <div className="grid grid-cols-2 gap-2.5 bg-neutral-50 p-3 rounded-2xl border border-black/5 text-xs">
                          {/* Quantity & Unit */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Quantity & Unit
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'quantity',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2.5 py-1.5 font-bold font-mono text-black bg-white border border-neutral-200 rounded-xl focus:border-black outline-hidden"
                              />
                              <select
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1.5 bg-white border border-neutral-200 rounded-xl text-black font-semibold focus:border-black outline-hidden"
                              >
                                <option value="sq.ft.">sq.ft.</option>
                                <option value="R.ft.">R.ft.</option>
                                <option value="point">point</option>
                                <option value="job">job</option>
                                <option value="lot">lot</option>
                                <option value="piece">pc</option>
                                <option value="day">day</option>
                                <option value="bag">bag</option>
                                <option value="brass">brass</option>
                              </select>
                            </div>
                          </div>

                          {/* Wastage % */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Wastage %
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={item.wastagePercent}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    section.id,
                                    item.id,
                                    'wastagePercent',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2.5 py-1.5 font-mono text-black bg-white border border-neutral-200 rounded-xl focus:border-black outline-hidden text-center"
                              />
                              <span className="text-neutral-400 font-mono text-xs">%</span>
                            </div>
                          </div>

                          {/* Material Unit Rate */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Mat Rate (₹/{item.unit})
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.materialRate}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  section.id,
                                  item.id,
                                  'materialRate',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-1.5 font-bold font-mono text-black bg-white border border-neutral-200 rounded-xl focus:border-black outline-hidden"
                            />
                          </div>

                          {/* Labour Rate */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                              Labour Rate (₹/{item.unit})
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.labourRate}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  section.id,
                                  item.id,
                                  'labourRate',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-1.5 font-bold font-mono text-black bg-white border border-neutral-200 rounded-xl focus:border-black outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Row 3: Total & Quick Action Buttons */}
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Line Amount</span>
                            <span className="text-base font-extrabold text-black font-mono">
                              {formatINR(item.totalDirectAmount)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedExplItem(item)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-black hover:text-white text-black font-bold text-xs border border-neutral-200 transition min-h-[38px] active:scale-95 cursor-pointer"
                            >
                              <Calculator className="w-3.5 h-3.5 text-[#EBA224]" />
                              <span>Why?</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(section.id, item)}
                              title="Duplicate"
                              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(section.id, item.id)}
                              title="Delete"
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Internal Cost vs Client Price Financial Summary */}
      <div className="bg-black rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-5 mb-6 gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <IndianRupee className="w-5 h-5 text-[#EBA224]" />
              <span>Internal Cost Structure & Contractor Markup Engine</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Contractor margins and indirect allowances are private and strictly hidden from client quotations.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-[#EBA224] text-black text-xs font-bold uppercase tracking-wider">
            <Check className="w-3.5 h-3.5" /> Formula Verified
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Direct Costs Breakdown */}
          <div className="lg:col-span-4 bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-3">
            <div className="font-bold text-[#EBA224] uppercase tracking-widest text-[11px]">
              1. Direct Site Costs
            </div>
            <div className="flex justify-between text-neutral-300">
              <span>Total Material Cost (with wastage):</span>
              <span className="font-mono font-semibold text-white">{formatINR(currentSummary.totalMaterialCost)}</span>
            </div>
            <div className="flex justify-between text-neutral-300">
              <span>Total Labour Cost:</span>
              <span className="font-mono font-semibold text-white">{formatINR(currentSummary.totalLabourCost)}</span>
            </div>
            <div className="pt-3 border-t border-neutral-800 flex justify-between font-bold text-white">
              <span>Total Direct Site Cost:</span>
              <span className="font-mono text-[#EBA224] text-sm">{formatINR(currentSummary.totalDirectCost)}</span>
            </div>
          </div>

          {/* Indirect Allowances */}
          <div className="lg:col-span-4 bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-3">
            <div className="font-bold text-[#EBA224] uppercase tracking-widest text-[11px]">
              2. Indirect & Logistics Allowances
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span>Transport & Material Shifting:</span>
              <input
                type="number"
                value={transportCost}
                onChange={(e) => {
                  setTransportCost(Number(e.target.value) || 0);
                  saveAllChanges(sections);
                }}
                className="w-24 px-2 py-1 bg-black border border-neutral-700 rounded-lg text-right font-mono font-semibold text-white focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span>Debris Loading & Carting:</span>
              <input
                type="number"
                value={debrisCost}
                onChange={(e) => {
                  setDebrisCost(Number(e.target.value) || 0);
                  saveAllChanges(sections);
                }}
                className="w-24 px-2 py-1 bg-black border border-neutral-700 rounded-lg text-right font-mono font-semibold text-white focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span>Site Masking & Protection:</span>
              <input
                type="number"
                value={protectionCost}
                onChange={(e) => {
                  setProtectionCost(Number(e.target.value) || 0);
                  saveAllChanges(sections);
                }}
                className="w-24 px-2 py-1 bg-black border border-neutral-700 rounded-lg text-right font-mono font-semibold text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Overheads, Profit & Client Final Price */}
          <div className="lg:col-span-4 bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
            <div className="font-bold text-[#EBA224] uppercase tracking-widest text-[11px]">
              3. Overheads, Margin & GST
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span>Company Overhead ({overheadPercent}%):</span>
              <span className="font-mono text-white">{formatINR(currentSummary.overheadAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span>Contractor Profit ({profitPercent}%):</span>
              <span className="font-mono text-[#EBA224] font-semibold">{formatINR(currentSummary.profitAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span>Selling Price (Excl. Tax):</span>
              <span className="font-mono font-bold text-white">{formatINR(currentSummary.recommendedSellingPrice)}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span>GST (18% Output Tax):</span>
              <span className="font-mono text-white">{formatINR(currentSummary.gstAmount)}</span>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-between items-baseline">
              <span className="font-bold text-white text-sm">Client Quotation:</span>
              <span className="font-mono text-xl font-extrabold text-[#EBA224]">
                {formatINR(currentSummary.finalClientPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Line Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-black/10 overflow-hidden">
            <div className="px-6 py-4.5 bg-black text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#EBA224]" />
                <span>Add Item to BOQ Section</span>
              </h3>
              <button
                onClick={() => setIsAddItemOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Quick Select from Materials Master */}
              <div>
                <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
                  Quick Pick from Database
                </label>
                <select
                  onChange={(e) => handleSelectPredefinedMaterial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-300 rounded-full text-black font-medium focus:ring-2 focus:ring-black outline-hidden"
                >
                  <option value="">-- Choose from Master Database --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.category} • {m.itemName} ({m.specification}) — ₹{m.sellingRate}/{m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-black mb-1">
                  Work Description *
                </label>
                <input
                  type="text"
                  value={newWorkDesc}
                  onChange={(e) => setNewWorkDesc(e.target.value)}
                  placeholder="e.g. Full-Height Sliding Wardrobe Box Fabrication"
                  className="w-full px-3.5 py-2 border border-neutral-300 rounded-full font-medium focus:ring-2 focus:ring-black outline-hidden text-black"
                />
              </div>

              <div>
                <label className="block font-semibold text-black mb-1">
                  Technical Specification
                </label>
                <input
                  type="text"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  placeholder="e.g. 18mm Century BWP 710 Plywood + 1.0mm Merino Laminate"
                  className="w-full px-3.5 py-2 border border-neutral-300 rounded-full focus:ring-2 focus:ring-black outline-hidden text-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-black mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-full font-mono font-bold focus:ring-2 focus:ring-black outline-hidden text-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-black mb-1">Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-full focus:ring-2 focus:ring-black outline-hidden text-black"
                  >
                    <option value="sq.ft.">sq.ft.</option>
                    <option value="R.ft.">R.ft.</option>
                    <option value="point">point</option>
                    <option value="job">job</option>
                    <option value="lot">lot</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-black mb-1">Wastage %</label>
                  <input
                    type="number"
                    value={newWastage}
                    onChange={(e) => setNewWastage(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-full font-mono font-medium focus:ring-2 focus:ring-black outline-hidden text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black mb-1">Material Rate (₹)</label>
                  <input
                    type="number"
                    value={newMatRate}
                    onChange={(e) => setNewMatRate(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-full font-mono font-bold focus:ring-2 focus:ring-black outline-hidden text-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-black mb-1">Labour Rate (₹)</label>
                  <input
                    type="number"
                    value={newLabRate}
                    onChange={(e) => setNewLabRate(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-full font-mono font-bold focus:ring-2 focus:ring-black outline-hidden text-black"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setIsAddItemOpen(false)}
                className="px-5 py-2.5 rounded-full text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItemSubmit}
                className="px-6 py-2.5 rounded-full bg-[#EBA224] hover:bg-[#d8921b] text-black text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
              >
                Add Item to BOQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Why / Explain Calculation Modal */}
      <ExplainCalculationModal
        item={selectedExplItem}
        onClose={() => setSelectedExplItem(null)}
      />
    </div>
  );
};
