import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Eye,
  Layers,
  Ruler,
  Check,
  FileSpreadsheet,
  Info,
  ChevronRight
} from 'lucide-react';
import { Project, ClarificationQuestion } from '../types';
import { formatINR } from '../utils/calculationEngine';

interface AIAnalysisViewProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onProceedToBOQ: () => void;
  onProceedToQuotation: () => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  project,
  onUpdateProject,
  onProceedToBOQ,
  onProceedToQuotation,
}) => {
  const analysis = project.aiAnalysis;
  const [questions, setQuestions] = useState<ClarificationQuestion[]>(
    analysis?.questions || []
  );

  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-black/10">
        <Sparkles className="w-8 h-8 text-[#EBA224] mx-auto mb-2" />
        <h3 className="text-base font-bold text-black">No AI Analysis Found</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Run an AI Vision analysis on this project to generate site insights.
        </p>
      </div>
    );
  }

  const confidence = analysis.confidenceScore || 80;

  // Handle Question Confirmation & Dynamically Update BOQ
  const handleAnswerChange = (qId: string, val: any) => {
    const updated = questions.map((q) => {
      if (q.id === qId) {
        return { ...q, currentValue: val };
      }
      return q;
    });
    setQuestions(updated);
  };

  const handleConfirmQuestion = (qId: string) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === qId) {
        return { ...q, isConfirmed: true };
      }
      return q;
    });
    setQuestions(updatedQuestions);

    // Update project state
    const updatedProject: Project = {
      ...project,
      aiAnalysis: {
        ...analysis,
        questions: updatedQuestions,
      },
    };

    // If wardrobe width was answered, dynamically update wardrobe item quantity in BOQ
    const wardrobeQ = updatedQuestions.find((q) =>
      q.question.toLowerCase().includes('wardrobe')
    );
    if (wardrobeQ && typeof wardrobeQ.currentValue === 'number') {
      const newWidth = wardrobeQ.currentValue;
      const updatedSections = (updatedProject.boqSections || []).map((sec) => ({
        ...sec,
        items: sec.items.map((it) => {
          if (it.category === 'Carpentry' && it.unit === 'R.ft.') {
            const wastage = it.wastagePercent;
            const matRate = it.materialRate;
            const labRate = it.labourRate;
            const effQty = Math.round(newWidth * (1 + wastage / 100) * 100) / 100;
            const matCost = Math.round(effQty * matRate);
            const labCost = Math.round(newWidth * labRate);
            return {
              ...it,
              quantity: newWidth,
              effectiveQuantity: effQty,
              materialCost: matCost,
              labourCost: labCost,
              totalDirectAmount: matCost + labCost + (it.otherCost || 0),
              isManuallyAdjusted: true,
            };
          }
          return it;
        }),
      }));
      updatedProject.boqSections = updatedSections;
    }

    onUpdateProject(updatedProject);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
                <Sparkles className="w-3 h-3" />
                <span>AI Scope Analysis</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {analysis.modelUsed || 'gemini-2.5-flash'}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Site Vision & Scope Review
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {project.projectName} • {project.clientName || 'No Client'}
            </p>
          </div>

          {/* Confidence Score Pill */}
          <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2.5 rounded-2xl border border-black/10 self-start sm:self-auto">
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Confidence
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-black font-mono">
                  {confidence}%
                </span>
                <span className="text-[11px] text-neutral-500">
                  ({confidence >= 80 ? 'High' : 'Normal'})
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-black text-[#EBA224] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Site Narrative Summary */}
        <div className="mt-4 p-3.5 bg-neutral-50 rounded-xl border border-black/5 text-xs text-neutral-700 leading-relaxed">
          <strong className="font-bold text-black block mb-0.5">
            Site Summary:
          </strong>
          {analysis.summaryNarrative}
        </div>
      </div>

      {/* 2-Column Main Section: Existing Conditions & Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Existing Elements Detected */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-black flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#EBA224]" />
              <span>Visible Elements</span>
            </h2>
            <span className="text-xs text-neutral-500 font-semibold">
              {analysis.existingElements?.length || 0} items
            </span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {analysis.existingElements?.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-black/10 bg-neutral-50 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-black text-xs sm:text-sm truncate">{item.element}</span>
                  {item.isAffected ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black text-[#EBA224] shrink-0">
                      Scope Affected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-200 text-black shrink-0">
                      Keep
                    </span>
                  )}
                </div>
                <div className="text-neutral-700 text-[11px]">
                  <span className="font-semibold text-black">Location:</span> {item.location}
                </div>
                <div className="text-neutral-500 text-[11px]">
                  <span className="font-semibold text-black">Condition:</span> {item.condition}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Requested Scope vs AI Suggestions */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#EBA224]" />
              <span>Suggested Scope Items</span>
            </h2>
            <span className="text-xs text-neutral-500 font-semibold">
              {analysis.suggestedScope?.length || 0} items
            </span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {analysis.suggestedScope?.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-black/10 bg-neutral-50 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-black text-xs sm:text-sm truncate">{s.workDescription}</span>
                  <span className="font-mono text-black font-bold px-2 py-0.5 bg-[#EBA224] rounded-full text-[10px] shrink-0">
                    {s.quantity} {s.unit}
                  </span>
                </div>
                <div className="text-neutral-700 text-[11px]">
                  <span className="font-semibold text-black">Spec:</span> {s.specification}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contractor Clarification Questions (Interactive) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#EBA224]" />
              <span>Clarification Questions</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Confirm measurements and specifications before locking in the BOQ.
            </p>
          </div>
          <span className="px-3 py-0.5 rounded-full bg-black text-[#EBA224] text-[11px] font-bold uppercase tracking-wider self-start sm:self-auto">
            {questions.filter((q) => q.isConfirmed).length}/{questions.length} Confirmed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                q.isConfirmed
                  ? 'bg-neutral-50 border-black/20'
                  : 'bg-white border-black/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-bold text-black leading-snug">
                  {q.question}
                </div>
                {q.isConfirmed ? (
                  <span className="p-1 rounded-full bg-[#EBA224] text-black shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-300 shrink-0">
                    Pending
                  </span>
                )}
              </div>

              <p className="text-[11px] text-neutral-500 mt-1">
                Reason: {q.reason}
              </p>

              {/* Input Control */}
              <div className="mt-3 flex items-center gap-2">
                {q.inputType === 'select' && q.options ? (
                  <select
                    value={q.currentValue}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="w-full text-xs font-medium px-3 py-1.5 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black outline-hidden text-black"
                  >
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : q.inputType === 'number' ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="number"
                      value={q.currentValue}
                      onChange={(e) => handleAnswerChange(q.id, Number(e.target.value) || 0)}
                      className="w-24 text-xs font-bold px-3 py-1.5 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black outline-hidden font-mono text-black"
                    />
                    <span className="text-xs text-neutral-600 font-semibold">{q.unit}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={q.currentValue}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="w-full text-xs font-medium px-3 py-1.5 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black outline-hidden text-black"
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleConfirmQuestion(q.id)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition cursor-pointer bg-black text-[#EBA224] hover:bg-neutral-800"
                >
                  {q.isConfirmed ? 'Done' : 'Confirm'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions & Physical Site Verification Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/10 space-y-2 shadow-xs">
          <div className="font-bold text-sm sm:text-base text-black flex items-center gap-2">
            <Info className="w-4 h-4 text-[#EBA224]" />
            <span>Assumptions</span>
          </div>
          <ul className="space-y-1 text-neutral-700 pl-4 list-disc text-[11px]">
            {analysis.assumptions?.map((ass, i) => (
              <li key={i}>{ass}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/10 space-y-2 shadow-xs">
          <div className="font-bold text-sm sm:text-base text-black flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EBA224]" />
            <span>Site Checklist</span>
          </div>
          <ul className="space-y-1 text-neutral-700 pl-4 list-disc text-[11px]">
            {analysis.siteVerificationRequired?.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border border-neutral-800">
        <div>
          <div className="text-sm sm:text-base font-bold">Review Itemized BOQ</div>
          <div className="text-xs text-neutral-400 mt-0.5">
            Proceed to adjust rates, wastage allowances, and line item quantities.
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onProceedToQuotation}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white transition cursor-pointer border border-neutral-700 min-h-[40px]"
          >
            Quotation
          </button>
          <button
            onClick={onProceedToBOQ}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EBA224] hover:bg-[#d8921b] text-black shadow-xs transition cursor-pointer min-h-[40px]"
          >
            <span>Open BOQ</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
