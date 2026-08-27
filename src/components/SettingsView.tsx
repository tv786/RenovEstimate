import React, { useState } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  Percent,
  FileText,
  Save,
  Check,
} from 'lucide-react';
import { CompanySettings } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (newSettings: CompanySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<CompanySettings>(settings);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const [termsText, setTermsText] = useState(form.defaultTerms.join('\n'));
  const [exclusionsText, setExclusionsText] = useState(form.defaultExclusions.join('\n'));

  const handleChange = (field: keyof CompanySettings, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    const updatedTerms = termsText.split('\n').filter((t) => t.trim().length > 0);
    const updatedExclusions = exclusionsText.split('\n').filter((e) => e.trim().length > 0);

    const payload: CompanySettings = {
      ...form,
      defaultTerms: updatedTerms,
      defaultExclusions: updatedExclusions,
    };

    onSaveSettings(payload);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
              <Settings className="w-3 h-3" />
              <span>Company Settings</span>
            </span>
            {showSavedToast && (
              <span className="inline-flex items-center gap-1 text-[10px] text-black font-bold uppercase tracking-wider animate-pulse">
                <Check className="w-3 h-3 text-[#EBA224]" /> Saved
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
            Company Profile & Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Settings printed on client quotations, bank settlements, and default margins.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-[#EBA224] shadow-xs transition min-h-[38px] cursor-pointer self-stretch sm:self-auto active:scale-95"
        >
          <Save className="w-3.5 h-3.5 text-[#EBA224]" />
          <span>Save Settings</span>
        </button>
      </div>

      {/* 1. Company Identity & Contact */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-black flex items-center gap-2 border-b border-neutral-200 pb-3">
          <Building className="w-4 h-4 text-[#EBA224]" />
          <span>Company Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-xs">
          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Company / Firm Name *</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-bold text-sm text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Tagline / Business Line</label>
            <input
              type="text"
              value={form.tagline || ''}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="e.g. Interior Architecture & Turnkey Renovations"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Registered Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Official Phone *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs font-mono text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Official Email *</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">GSTIN Number</label>
            <input
              type="text"
              value={form.gstNumber || ''}
              onChange={(e) => handleChange('gstNumber', e.target.value)}
              placeholder="e.g. 08AAACR1234F1Z5"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-medium text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">PAN Number</label>
            <input
              type="text"
              value={form.panNumber || ''}
              onChange={(e) => handleChange('panNumber', e.target.value)}
              placeholder="e.g. AAACR1234F"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-medium text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 2. Bank & UPI Settlement Details */}
      <div className="bg-white rounded-3xl border border-black/10 p-5 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2.5 border-b border-neutral-200 pb-4">
          <CreditCard className="w-4 h-4 text-[#EBA224]" />
          <span>Bank Account & Payment Details (Printed on Quotations)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-xs">
          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Bank Name</label>
            <input
              type="text"
              value={form.bankName || ''}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="e.g. HDFC Bank Ltd."
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Account Holder Name</label>
            <input
              type="text"
              value={form.accountHolder || ''}
              onChange={(e) => handleChange('accountHolder', e.target.value)}
              placeholder="e.g. Ruh Al-Bina Construction"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Account Number</label>
            <input
              type="text"
              value={form.accountNumber || ''}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              placeholder="e.g. 50200084920194"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">IFSC Code</label>
            <input
              type="text"
              value={form.ifscCode || ''}
              onChange={(e) => handleChange('ifscCode', e.target.value)}
              placeholder="e.g. HDFC0001234"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">UPI ID for Quick Advance</label>
            <input
              type="text"
              value={form.upiId || ''}
              onChange={(e) => handleChange('upiId', e.target.value)}
              placeholder="e.g. ruhalbina@hdfcbank"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Markup & Tax Percentages */}
      <div className="bg-white rounded-3xl border border-black/10 p-5 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2.5 border-b border-neutral-200 pb-4">
          <Percent className="w-4 h-4 text-[#EBA224]" />
          <span>Default Financial Markup Percentages</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 text-xs">
          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Default Overhead %</label>
            <input
              type="number"
              value={form.defaultOverheadPercent}
              onChange={(e) => handleChange('defaultOverheadPercent', Number(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Default Profit %</label>
            <input
              type="number"
              value={form.defaultProfitMarginPercent}
              onChange={(e) => handleChange('defaultProfitMarginPercent', Number(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Default GST %</label>
            <input
              type="number"
              value={form.defaultGstPercent}
              onChange={(e) => handleChange('defaultGstPercent', Number(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Validity (Days)</label>
            <input
              type="number"
              value={form.defaultQuotationValidityDays}
              onChange={(e) => handleChange('defaultQuotationValidityDays', Number(e.target.value) || 15)}
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 4. Terms & Exclusions */}
      <div className="bg-white rounded-3xl border border-black/10 p-5 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2.5 border-b border-neutral-200 pb-4">
          <FileText className="w-4 h-4 text-[#EBA224]" />
          <span>Standard Contract Clauses & Exclusions</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-xs">
          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
              Standard Terms & Conditions (One per line)
            </label>
            <textarea
              rows={6}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-2xl leading-relaxed text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
              Standard Exclusions (One per line)
            </label>
            <textarea
              rows={6}
              value={exclusionsText}
              onChange={(e) => setExclusionsText(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-2xl leading-relaxed text-xs text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
