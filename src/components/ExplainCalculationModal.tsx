import React from 'react';
import { X, Calculator, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { BOQItem } from '../types';
import { formatINR } from '../utils/calculationEngine';

interface ExplainCalculationModalProps {
  item: BOQItem | null;
  onClose: () => void;
}

export const ExplainCalculationModal: React.FC<ExplainCalculationModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const expl = item.explanation;
  const baseQty = expl?.baseQuantity ?? item.quantity;
  const wastage = expl?.wastagePercent ?? item.wastagePercent;
  const effQty = expl?.effectiveQuantity ?? item.effectiveQuantity;
  const matRate = expl?.materialUnitRate ?? item.materialRate;
  const matTotal = expl?.materialTotal ?? item.materialCost;
  const labRate = expl?.labourUnitRate ?? item.labourRate;
  const labTotal = expl?.labourTotal ?? item.labourCost;
  const directTotal = expl?.directCostTotal ?? item.totalDirectAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-black text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EBA224] flex items-center justify-center text-black font-extrabold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Calculation Breakdown (Why?)</h2>
              <p className="text-xs text-neutral-400">
                Transparent Step-by-Step Formula
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Info Banner */}
        <div className="p-6 border-b border-black/10 bg-neutral-50 space-y-1.5">
          <div className="text-xs font-bold text-black uppercase tracking-wider">
            {item.category} • Line Item #{item.srNo}
          </div>
          <div className="text-base font-extrabold text-black">
            {item.workDescription}
          </div>
          <div className="text-xs text-neutral-700">
            Material: <span className="font-semibold text-black">{item.materialName}</span>
          </div>
          <div className="text-xs text-neutral-500">
            Spec: {item.specification}
          </div>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="p-6 space-y-4 text-xs">
          {/* Step 1: Base Qty & Wastage */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-black/10 space-y-2">
            <div className="font-bold text-sm text-black flex items-center justify-between">
              <span>1. Material Quantity & Wastage Allowance</span>
              <span className="font-mono text-black font-bold px-2 py-0.5 bg-[#EBA224] rounded-md">{effQty} {item.unit}</span>
            </div>
            <div className="text-neutral-700 space-y-1">
              <p>• Measured Net Site Quantity: <strong className="text-black">{baseQty} {item.unit}</strong></p>
              <p>• Standard Site Wastage: <strong className="text-black">{wastage}%</strong> (cutting, off-cuts & edge trims)</p>
              <p>• Effective Material Required = {baseQty} × (1 + {wastage}/100) = <strong className="text-black font-bold">{effQty} {item.unit}</strong></p>
            </div>
          </div>

          {/* Step 2: Material Cost */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-black/10 space-y-2">
            <div className="font-bold text-sm text-black flex items-center justify-between">
              <span>2. Material Subtotal</span>
              <span className="font-mono text-black font-bold">{formatINR(matTotal)}</span>
            </div>
            <div className="text-neutral-700 space-y-1">
              <p>• Database Material Unit Rate: <strong className="text-black">{formatINR(matRate)} / {item.unit}</strong></p>
              <p>• Calculation = {effQty} {item.unit} × {formatINR(matRate)} = <strong className="text-black font-bold">{formatINR(matTotal)}</strong></p>
            </div>
          </div>

          {/* Step 3: Labour Cost */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-black/10 space-y-2">
            <div className="font-bold text-sm text-black flex items-center justify-between">
              <span>3. Labour & Execution Subtotal</span>
              <span className="font-mono text-black font-bold">{formatINR(labTotal)}</span>
            </div>
            <div className="text-neutral-700 space-y-1">
              <p>• Standard Labour Rate: <strong className="text-black">{formatINR(labRate)} / {item.unit}</strong></p>
              <p>• Calculation = {baseQty} {item.unit} × {formatINR(labRate)} = <strong className="text-black font-bold">{formatINR(labTotal)}</strong></p>
            </div>
          </div>

          {/* Step 4: Line Item Total */}
          <div className="bg-black p-5 rounded-2xl border border-neutral-800 flex items-center justify-between text-white">
            <div>
              <div className="text-xs font-bold text-[#EBA224] uppercase tracking-wider">
                Total Direct Cost (Material + Labour)
              </div>
              <div className="text-[11px] text-neutral-400">
                Formula: {formatINR(matTotal)} (Material) + {formatINR(labTotal)} (Labour)
              </div>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {formatINR(directTotal)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-black/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-black font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#EBA224]" />
            <span>Deterministic Verified Formula</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
