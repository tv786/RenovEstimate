import React, { useState, useEffect } from 'react';
import {
  Project,
  MaterialItem,
  LabourRate,
  CompanySettings,
  PriceHistoryEntry,
  ActualProjectCostRecord,
  QualityTier
} from './types';
import { StorageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectWizardModal } from './components/ProjectWizardModal';
import { AIAnalysisView } from './components/AIAnalysisView';
import { BOQEditorView } from './components/BOQEditorView';
import { ClientQuotationView } from './components/ClientQuotationView';
import { MaterialDatabaseView } from './components/MaterialDatabaseView';
import { LabourDatabaseView } from './components/LabourDatabaseView';
import { ActualCostTrackingView } from './components/ActualCostTrackingView';
import { SettingsView } from './components/SettingsView';
import {
  ArrowLeft,
  Sparkles,
  FileSpreadsheet,
  Eye,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  HardHat
} from 'lucide-react';
import { formatINR } from './utils/calculationEngine';

export default function App() {
  // Persistence states
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [labourRates, setLabourRates] = useState<LabourRate[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [actualCosts, setActualCosts] = useState<ActualProjectCostRecord[]>([]);

  // Navigation & Project selection
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeLocation, setActiveLocation] = useState<string>('Jaipur');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedProjects = StorageService.getProjects();
    const loadedMaterials = StorageService.getMaterials();
    const loadedLabour = StorageService.getLabourRates();
    const loadedSettings = StorageService.getSettings();
    const loadedHistory = StorageService.getPriceHistory();
    const loadedActuals = StorageService.getActualCosts();

    setProjects(loadedProjects);
    setMaterials(loadedMaterials);
    setLabourRates(loadedLabour);
    setSettings(loadedSettings);
    setPriceHistory(loadedHistory);
    setActualCosts(loadedActuals);

    if (loadedProjects.length > 0) {
      setActiveProject(loadedProjects[0]);
    }
  }, []);

  // Save changes to storage
  const handleUpdateProject = (updated: Project) => {
    StorageService.saveProject(updated);
    setProjects(StorageService.getProjects());
    setActiveProject(updated);
  };

  const handleDeleteProject = (projectId: string) => {
    StorageService.deleteProject(projectId);
    const updatedList = StorageService.getProjects();
    setProjects(updatedList);
    if (activeProject?.id === projectId) {
      setActiveProject(updatedList.length > 0 ? updatedList[0] : null);
      setActiveTab('dashboard');
    }
  };

  const handleProjectCreated = (newProj: Project) => {
    StorageService.saveProject(newProj);
    setProjects(StorageService.getProjects());
    setActiveProject(newProj);
    setIsWizardOpen(false);
    setActiveTab('project-ai');
  };

  const handleSelectProject = (project: Project, subTab: string = 'boq') => {
    setActiveProject(project);
    if (subTab === 'ai') setActiveTab('project-ai');
    else if (subTab === 'quotation') setActiveTab('project-quotation');
    else setActiveTab('project-boq');
  };

  const handleUpdateMaterialPrice = (
    matId: string,
    newCost: number,
    newSelling: number,
    changedBy: string,
    reason?: string
  ) => {
    StorageService.updateMaterialPrice(matId, newCost, newSelling, changedBy, reason);
    setMaterials(StorageService.getMaterials());
    setPriceHistory(StorageService.getPriceHistory());
  };

  const handleAddMaterial = (newMat: MaterialItem) => {
    const list = [...materials, newMat];
    StorageService.saveMaterials(list);
    setMaterials(list);
  };

  const handleUpdateLabourRate = (updated: LabourRate) => {
    const list = labourRates.map((r) => (r.id === updated.id ? updated : r));
    StorageService.saveLabourRates(list);
    setLabourRates(list);
  };

  const handleAddLabourRate = (newRate: LabourRate) => {
    const list = [...labourRates, newRate];
    StorageService.saveLabourRates(list);
    setLabourRates(list);
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const isViewingProject =
    activeProject &&
    (activeTab === 'project-ai' ||
      activeTab === 'project-boq' ||
      activeTab === 'project-quotation');

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-black">
      {/* Top Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
        }}
        settings={settings}
        onNewEstimate={() => setIsWizardOpen(true)}
      />

      {/* Active Project Sub-Navigation Bar */}
      {isViewingProject && activeProject && (
        <div className="bg-white border-b border-black/10 px-3 sm:px-6 lg:px-8 py-2.5 print:hidden shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Top row / Left side: Back button, project name & meta */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 -ml-1 rounded-full text-black hover:bg-neutral-100 transition cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                title="Back to All Projects"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-sm sm:text-base text-black truncate">
                    {activeProject.projectName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black text-[#EBA224] shrink-0">
                    {activeProject.qualityTier}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 truncate">
                  <span className="truncate">{activeProject.clientName || 'No Client'}</span>
                  <span>•</span>
                  <span className="font-bold text-black font-mono shrink-0">
                    {formatINR(activeProject.costSummary?.finalClientPrice || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Navigation Sub-Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl sm:rounded-full border border-black/10 text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('project-ai')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-full transition cursor-pointer text-[11px] sm:text-xs min-h-[36px] active:scale-95 ${
                  activeTab === 'project-ai'
                    ? 'bg-black text-[#EBA224] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">AI Scope</span>
              </button>

              <button
                onClick={() => setActiveTab('project-boq')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-full transition cursor-pointer text-[11px] sm:text-xs min-h-[36px] active:scale-95 ${
                  activeTab === 'project-boq'
                    ? 'bg-black text-[#EBA224] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">BOQ Editor</span>
              </button>

              <button
                onClick={() => setActiveTab('project-quotation')}
                className={`flex items-center justify-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-full transition cursor-pointer text-[11px] sm:text-xs min-h-[36px] active:scale-95 ${
                  activeTab === 'project-quotation'
                    ? 'bg-black text-[#EBA224] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Quotation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <DashboardView
            projects={projects}
            onNewEstimate={() => setIsWizardOpen(true)}
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
            onOpenMaterials={() => setActiveTab('materials')}
            onOpenLabour={() => setActiveTab('labour')}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {/* AI FINDINGS TAB */}
        {activeTab === 'project-ai' && activeProject && (
          <AIAnalysisView
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onProceedToBOQ={() => setActiveTab('project-boq')}
            onProceedToQuotation={() => setActiveTab('project-quotation')}
          />
        )}

        {/* BOQ EDITOR TAB */}
        {activeTab === 'project-boq' && activeProject && (
          <BOQEditorView
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onProceedToQuotation={() => setActiveTab('project-quotation')}
            materials={materials}
            labourRates={labourRates}
          />
        )}

        {/* CLIENT QUOTATION TAB */}
        {activeTab === 'project-quotation' && activeProject && (
          <ClientQuotationView
            project={activeProject}
            settings={settings}
            onUpdateProject={handleUpdateProject}
            onBackToBOQ={() => setActiveTab('project-boq')}
          />
        )}

        {/* MATERIALS MASTER TAB */}
        {activeTab === 'materials' && (
          <MaterialDatabaseView
            materials={materials}
            priceHistory={priceHistory}
            onUpdateMaterialPrice={handleUpdateMaterialPrice}
            onAddMaterial={handleAddMaterial}
          />
        )}

        {/* LABOUR RATES TAB */}
        {activeTab === 'labour' && (
          <LabourDatabaseView
            labourRates={labourRates}
            onUpdateLabourRate={handleUpdateLabourRate}
            onAddLabourRate={handleAddLabourRate}
          />
        )}

        {/* ACTUAL COSTS & VARIANCE TAB */}
        {activeTab === 'actual-costs' && (
          <ActualCostTrackingView
            actualCosts={actualCosts}
            projects={projects}
            onSaveActualCost={(rec) => {
              StorageService.saveActualCost(rec);
              setActualCosts(StorageService.getActualCosts());
            }}
          />
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-neutral-800 py-3.5 px-4 sm:px-6 lg:px-8 text-center text-xs print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-neutral-400 text-[11px]">
          <div>
            <strong className="text-white">RenovEstimate</strong> — Internal Contractor Estimation & BOQ System
          </div>
          <div>
            Ruh Al-Bina Construction
          </div>
        </div>
      </footer>

      {/* Multi-Step New Estimate Wizard Modal */}
      <ProjectWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
