import React from 'react';
import {
  HardHat,
  Calculator,
  Layers,
  Users,
  Settings,
  TrendingUp,
  Plus
} from 'lucide-react';
import { CompanySettings } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: CompanySettings;
  onNewEstimate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onNewEstimate,
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black text-white border-b border-neutral-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center min-w-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer focus:outline-hidden min-w-0"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#EBA224] flex items-center justify-center text-black shadow-xs group-hover:bg-[#d8921b] transition font-bold shrink-0">
                  <HardHat className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate">
                      RenovEstimate
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-neutral-400 truncate max-w-[150px] xs:max-w-[220px] sm:max-w-xs">
                    {settings.companyName || 'Ruh Al-Bina Construction'}
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 bg-neutral-900 p-1 rounded-full border border-neutral-800">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#EBA224] text-black shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Projects</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('materials')}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                  activeTab === 'materials'
                    ? 'bg-[#EBA224] text-black shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Materials</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('labour')}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                  activeTab === 'labour'
                    ? 'bg-[#EBA224] text-black shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Labour SOR</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('actual-costs')}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                  activeTab === 'actual-costs'
                    ? 'bg-[#EBA224] text-black shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-bold transition cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#EBA224] text-black shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </div>
              </button>
            </nav>

            {/* Right Action Items */}
            <div className="flex items-center gap-2">
              <button
                onClick={onNewEstimate}
                className="inline-flex items-center justify-center gap-1.5 bg-[#EBA224] hover:bg-[#d8921b] text-black px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer shrink-0 min-h-[36px] active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden xs:inline">New Estimate</span>
                <span className="xs:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile (Thumb-Friendly Touch Target >= 44px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-800 shadow-2xl py-1 px-1">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#EBA224] text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-[#EBA224] text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Materials</span>
          </button>

          <button
            onClick={() => setActiveTab('labour')}
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'labour'
                ? 'bg-[#EBA224] text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Labour</span>
          </button>

          <button
            onClick={() => setActiveTab('actual-costs')}
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'actual-costs'
                ? 'bg-[#EBA224] text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#EBA224] text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};
