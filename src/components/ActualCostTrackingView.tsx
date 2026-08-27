import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  IndianRupee,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { ActualProjectCostRecord, Project } from '../types';
import { formatINR } from '../utils/calculationEngine';

interface ActualCostTrackingViewProps {
  actualCosts: ActualProjectCostRecord[];
  projects: Project[];
  onSaveActualCost: (record: ActualProjectCostRecord) => void;
}

export const ActualCostTrackingView: React.FC<ActualCostTrackingViewProps> = ({
  actualCosts,
  projects,
  onSaveActualCost,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<ActualProjectCostRecord | null>(
    actualCosts.length > 0 ? actualCosts[0] : null
  );

  // Overall Variance KPIs
  const totalEstimated = actualCosts.reduce(
    (sum, r) => sum + r.totalEstimatedInternalCost,
    0
  );
  const totalActual = actualCosts.reduce((sum, r) => sum + r.totalActualCost, 0);
  const netVariance = totalActual - totalEstimated;
  const netVariancePercent =
    totalEstimated > 0 ? ((netVariance / totalEstimated) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
                <TrendingUp className="w-3 h-3" />
                <span>Cost Analytics</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {actualCosts.length} Audits
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Actual vs Estimated Cost
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track project profit variances and improve future wastage allowances.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Total Estimated
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono">
            {formatINR(totalEstimated)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Internal contractor budget
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Total Incurred
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono">
            {formatINR(totalActual)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Actual materials & labour payout
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/10 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Historical Variance
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-black">
              {netVariance > 0 ? `+${formatINR(netVariance)}` : formatINR(netVariance)}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-[#EBA224]">
              {netVariance > 0 ? `+${netVariancePercent}%` : `${netVariancePercent}%`}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Contractor safety variance
          </div>
        </div>
      </div>

      {/* Main Audit Record Details */}
      {selectedRecord && (
        <div className="space-y-6">
          {/* Itemized Line-by-Line Variance Table / Mobile Cards */}
          <div className="bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 bg-neutral-50 border-b border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-bold text-sm sm:text-base text-black">
                Completed Project Cost Audit: {selectedRecord.projectId}
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                Completed: {selectedRecord.completedDate}
              </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200 text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Work Package Description</th>
                    <th className="px-5 py-3.5 text-right">Estimated Cost (₹)</th>
                    <th className="px-5 py-3.5 text-right">Actual Incurred (₹)</th>
                    <th className="px-5 py-3.5 text-right">Variance (₹ / %)</th>
                    <th className="px-6 py-3.5">Site Variance Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {selectedRecord.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 transition">
                      <td className="px-6 py-4 font-bold text-sm text-black">
                        {it.workDescription}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-neutral-600 font-medium">
                        {formatINR(it.estimatedAmount)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-black">
                        {formatINR(it.actualAmount)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono">
                        <span className={`font-bold ${it.varianceAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {it.varianceAmount > 0 ? `+${formatINR(it.varianceAmount)}` : formatINR(it.varianceAmount)}
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          ({it.variancePercent > 0 ? `+${it.variancePercent}%` : `${it.variancePercent}%`})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 text-xs">
                        {it.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-neutral-200 p-3 space-y-3">
              {selectedRecord.items.map((it, idx) => (
                <div key={idx} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <div className="font-bold text-sm text-black">{it.workDescription}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-400">Estimated: </span>
                      <span className="font-mono font-medium text-black">{formatINR(it.estimatedAmount)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Actual: </span>
                      <span className="font-mono font-bold text-black">{formatINR(it.actualAmount)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200">
                    <span className="text-neutral-400">Variance:</span>
                    <span className={`font-mono font-bold ${it.varianceAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {it.varianceAmount > 0 ? `+${formatINR(it.varianceAmount)}` : formatINR(it.varianceAmount)} ({it.variancePercent > 0 ? `+${it.variancePercent}%` : `${it.variancePercent}%`})
                    </span>
                  </div>
                  {it.notes && (
                    <div className="text-[11px] text-neutral-500 bg-white p-2 rounded-xl border border-neutral-200">
                      {it.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Learning & Calibration Insights */}
          <div className="bg-black text-white rounded-3xl p-5 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-white">
              <Sparkles className="w-5 h-5 text-[#EBA224]" />
              <span>AI Learning & Estimation Calibration Insights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {selectedRecord.learningInsights.map((insight, i) => (
                <div
                  key={i}
                  className="bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-neutral-800 text-neutral-200 space-y-1.5"
                >
                  <div className="font-bold text-[#EBA224] uppercase tracking-wider text-[10px]">Insight #{i + 1}</div>
                  <p className="leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
