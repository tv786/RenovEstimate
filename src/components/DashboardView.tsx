import React from 'react';
import {
  FolderGit2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Send,
  IndianRupee,
  Sparkles,
  Building2,
  Plus,
  Eye,
  Trash2,
  FileCheck2,
  Layers
} from 'lucide-react';
import { Project } from '../types';
import { formatINR } from '../utils/calculationEngine';

interface DashboardViewProps {
  projects: Project[];
  onNewEstimate: () => void;
  onSelectProject: (project: Project, tab?: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenMaterials: () => void;
  onOpenLabour: () => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onNewEstimate,
  onSelectProject,
  onDeleteProject,
  onOpenMaterials,
}) => {
  // Compute Metrics
  const totalProjects = projects.length;
  const awaitingReview = projects.filter(
    (p) =>
      p.status === 'Awaiting Confirmation' ||
      p.status === 'AI Analysis Complete' ||
      p.status === 'Under Review' ||
      p.status === 'Estimate Ready'
  ).length;
  const quotationsGenerated = projects.filter(
    (p) => p.status === 'Quotation Generated' || p.status === 'Sent to Client'
  ).length;
  const acceptedProjects = projects.filter(
    (p) => p.status === 'Accepted' || p.status === 'Completed'
  ).length;

  const totalEstimatedValue = projects.reduce((sum, p) => {
    return sum + (p.costSummary?.finalClientPrice || 0);
  }, 0);

  const avgConfidence =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + (p.aiAnalysis?.confidenceScore || 75), 0) /
            projects.length
        )
      : 85;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Awaiting Confirmation':
      case 'AI Analysis Complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-neutral-100 text-black border border-neutral-300">
            <Clock className="w-3 h-3 text-[#EBA224]" />
            In Review
          </span>
        );
      case 'Estimate Ready':
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black text-[#EBA224]">
            <FileSpreadsheet className="w-3 h-3 text-[#EBA224]" />
            BOQ Ready
          </span>
        );
      case 'Quotation Generated':
      case 'Sent to Client':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#EBA224]/20 text-black border border-[#EBA224]">
            <Send className="w-3 h-3 text-[#EBA224]" />
            Quote Sent
          </span>
        );
      case 'Accepted':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black text-white">
            <CheckCircle2 className="w-3 h-3 text-[#EBA224]" />
            Accepted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-300">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Renovation Estimates & Quotations
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Aapke saare projects ka hisaab, itemized BOQ aur client quotations ek jagah.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNewEstimate}
              className="inline-flex items-center justify-center gap-1.5 bg-[#EBA224] hover:bg-[#d8921b] text-black font-bold px-4 py-2 rounded-full text-xs shadow-xs transition cursor-pointer min-h-[38px] active:scale-95 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Naya Estimate Banayein</span>
            </button>
            <button
              onClick={onOpenMaterials}
              className="inline-flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black font-bold px-3.5 py-2 rounded-full text-xs border border-neutral-300 transition cursor-pointer min-h-[38px] flex-1 sm:flex-none"
            >
              <Layers className="w-3.5 h-3.5 text-[#EBA224]" />
              <span>Rate List</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-black/10 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Kul Projects (Total)</span>
            <Building2 className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono">
            {totalProjects}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            {totalProjects === 0 ? 'Abhi koi project nahi hai' : `${totalProjects} active projects`}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-black/10 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Total Value (₹)</span>
            <IndianRupee className="w-3.5 h-3.5 text-[#EBA224]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono truncate">
            {formatINR(totalEstimatedValue)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Total Quotation Amount (incl. GST)
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-black/10 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>Client Quotes (Tayyar)</span>
            <FileCheck2 className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black font-mono">
            {quotationsGenerated}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 truncate">
            Client ko bhejne ke liye ready quotations
          </div>
        </div>
      </div>

      {/* Projects Table & List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-black/10 flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-black">
            Saved Estimates & Quotations ({projects.length})
          </h2>

          <button
            onClick={onNewEstimate}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-[#EBA224] hover:bg-[#d8921b] px-3.5 py-1.5 rounded-full transition cursor-pointer min-h-[32px]"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            <span>+ Naya</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 sm:p-14 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-black mx-auto flex items-center justify-center border border-neutral-200">
              <FolderGit2 className="w-7 h-7 text-[#EBA224]" />
            </div>
            <div>
              <p className="text-base font-bold text-black">
                Abhi koi estimate nahi hai
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Apne naye renovation project ki site photos aur dimensions daal kar turant BOQ aur client quotation banayein.
              </p>
            </div>
            <div>
              <button
                onClick={onNewEstimate}
                className="inline-flex items-center gap-2 bg-[#EBA224] hover:bg-[#d8921b] text-black text-xs font-bold px-5 py-2.5 rounded-full shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Naya Estimate / Quotation Banayein</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 text-[11px] font-bold uppercase tracking-wider border-b border-black/10">
                  <tr>
                    <th className="px-5 py-3.5">Project & Client</th>
                    <th className="px-4 py-3.5">Type & Tier</th>
                    <th className="px-4 py-3.5">Dimensions</th>
                    <th className="px-4 py-3.5">Amount (₹)</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {projects.map((project) => {
                    const price = project.costSummary?.finalClientPrice || 0;
                    const dims = project.dimensions;
                    const dimText =
                      dims?.lengthFt && dims?.widthFt
                        ? `${dims.lengthFt}×${dims.widthFt} ft (${dims.calculatedFloorAreaSqFt || dims.lengthFt * dims.widthFt} sq.ft.)`
                        : '—';

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-neutral-50/70 transition group"
                      >
                        {/* Project & Client */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-black text-sm">
                            {project.projectName}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {project.clientName || 'No Client'} {project.clientPhone ? `• ${project.clientPhone}` : ''}
                          </div>
                        </td>

                        {/* Type & Tier */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-black">
                            {project.projectType}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {project.qualityTier} Tier
                          </div>
                        </td>

                        {/* Dimensions */}
                        <td className="px-4 py-3.5 text-neutral-700 font-mono text-[11px]">
                          {dimText}
                        </td>

                        {/* Estimated Price */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-black font-mono text-sm">
                            {formatINR(price)}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Incl. GST
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {getStatusBadge(project.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onSelectProject(project, 'ai')}
                              title="AI Scope"
                              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSelectProject(project, 'boq')}
                              title="BOQ Editor"
                              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSelectProject(project, 'quotation')}
                              title="Quotation"
                              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteProject(project.id)}
                              title="Delete"
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Project Cards List */}
            <div className="md:hidden divide-y divide-black/10">
              {projects.map((project) => {
                const price = project.costSummary?.finalClientPrice || 0;
                const dims = project.dimensions;
                const dimText =
                  dims?.lengthFt && dims?.widthFt
                    ? `${dims.lengthFt}×${dims.widthFt} ft (${dims.calculatedFloorAreaSqFt || dims.lengthFt * dims.widthFt} sq.ft.)`
                    : '—';

                return (
                  <div key={project.id} className="p-3.5 space-y-2.5 bg-white">
                    {/* Header: Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-black truncate">
                          {project.projectName}
                        </h3>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {project.clientName || 'No Client'} {project.clientPhone ? `• ${project.clientPhone}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(project.status)}
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="flex items-center justify-between bg-neutral-50 px-2.5 py-1.5 rounded-xl text-[11px] border border-black/5">
                      <span className="text-neutral-600 font-medium truncate">{project.projectType} • {project.qualityTier}</span>
                      <span className="font-mono text-neutral-700 shrink-0 ml-1">{dimText}</span>
                    </div>

                    {/* Price Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-black font-mono">
                          {formatINR(price)}
                        </span>
                        <span className="text-[10px] text-neutral-400">incl. GST</span>
                      </div>

                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="text-[10px] text-neutral-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Touch Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <button
                        onClick={() => onSelectProject(project, 'ai')}
                        className="flex items-center justify-center gap-1 py-2 px-1.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-lg text-xs font-semibold transition active:scale-95 min-h-[38px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#EBA224]" />
                        <span>AI Scope</span>
                      </button>

                      <button
                        onClick={() => onSelectProject(project, 'boq')}
                        className="flex items-center justify-center gap-1 py-2 px-1.5 bg-black hover:bg-neutral-800 text-[#EBA224] rounded-lg text-xs font-bold transition active:scale-95 min-h-[38px]"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>BOQ</span>
                      </button>

                      <button
                        onClick={() => onSelectProject(project, 'quotation')}
                        className="flex items-center justify-center gap-1 py-2 px-1.5 bg-[#EBA224] hover:bg-[#d8921b] text-black rounded-lg text-xs font-bold transition active:scale-95 min-h-[38px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quote</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
