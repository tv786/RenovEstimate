import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  X,
} from 'lucide-react';
import { LabourRate, QualityTier, MeasurementUnit } from '../types';
import { formatINR } from '../utils/calculationEngine';

interface LabourDatabaseViewProps {
  labourRates: LabourRate[];
  onUpdateLabourRate: (updatedRate: LabourRate) => void;
  onAddLabourRate: (newRate: LabourRate) => void;
}

export const LabourDatabaseView: React.FC<LabourDatabaseViewProps> = ({
  labourRates,
  onUpdateLabourRate,
  onAddLabourRate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingRate, setEditingRate] = useState<LabourRate | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states for Add/Edit
  const [editWorkType, setEditWorkType] = useState('');
  const [editCategory, setEditCategory] = useState('Carpentry');
  const [editUnit, setEditUnit] = useState<MeasurementUnit>('sq.ft.');
  const [editRatePerUnit, setEditRatePerUnit] = useState<number>(35);
  const [editMinCharge, setEditMinCharge] = useState<number>(500);
  const [editTier, setEditTier] = useState<QualityTier>('Standard');

  const categories = [
    'All',
    'Ceiling',
    'Carpentry',
    'Wall Finishes',
    'Painting',
    'Flooring',
    'Electrical',
    'Demolition',
    'Miscellaneous'
  ];

  const filtered = labourRates.filter((lr) => {
    const matchesSearch =
      lr.workType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lr.labourCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || lr.labourCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenEdit = (rate: LabourRate) => {
    setEditingRate(rate);
    setEditWorkType(rate.workType);
    setEditCategory(rate.labourCategory);
    setEditUnit(rate.unit);
    setEditRatePerUnit(rate.rate);
    setEditMinCharge(rate.minimumCharge);
    setEditTier(rate.qualityLevel);
  };

  const handleSaveEdit = () => {
    if (!editingRate) return;
    const updated: LabourRate = {
      ...editingRate,
      workType: editWorkType,
      labourCategory: editCategory,
      unit: editUnit,
      rate: editRatePerUnit,
      minimumCharge: editMinCharge,
      qualityLevel: editTier,
      lastUpdated: new Date().toISOString()
    };
    onUpdateLabourRate(updated);
    setEditingRate(null);
  };

  const handleCreate = () => {
    if (!editWorkType.trim()) return;
    const newRate: LabourRate = {
      id: 'lab-custom-' + Date.now(),
      workType: editWorkType,
      labourCategory: editCategory,
      unit: editUnit,
      rate: editRatePerUnit,
      minimumCharge: editMinCharge,
      qualityLevel: editTier,
      location: 'All',
      isActive: true,
      lastUpdated: new Date().toISOString()
    };
    onAddLabourRate(newRate);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
                <Users className="w-3 h-3" />
                <span>Labour Master (SOR)</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {labourRates.length} Skills
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Labour & Workmanship Master
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Standard contractor labour rates per unit and minimum site callout charges.
            </p>
          </div>

          <button
            onClick={() => {
              setEditWorkType('');
              setEditRatePerUnit(35);
              setEditMinCharge(500);
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-[#EBA224] shadow-xs transition min-h-[38px] cursor-pointer self-stretch sm:self-auto active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#EBA224]" />
            <span>Add Labour Rate</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-black/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search labour rates by trade or work description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-black outline-hidden font-medium text-black"
          />
        </div>

        <div className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-300 text-xs">
          <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Trade Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent font-semibold text-black focus:outline-hidden cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Labour Table (Desktop) */}
      <div className="bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200 text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Workmanship / Trade Type</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-5 py-3.5">Standard Rate (₹/unit)</th>
                <th className="px-5 py-3.5">Minimum Job Charge (₹)</th>
                <th className="px-4 py-3.5">Quality Tier</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((lr) => (
                <tr key={lr.id} className="hover:bg-neutral-50 transition group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-black">
                      {lr.workType}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-neutral-600">
                    {lr.labourCategory}
                  </td>
                  <td className="px-4 py-4 font-mono text-neutral-600 font-medium">
                    {lr.unit}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-black">
                    {formatINR(lr.rate)} <span className="text-[10px] text-neutral-400 font-normal">/ {lr.unit}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-neutral-600 font-medium">
                    {lr.minimumCharge > 0 ? formatINR(lr.minimumCharge) : 'Nil'}
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
                      {lr.qualityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(lr)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-100 border border-neutral-300 transition cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-[#EBA224]" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-neutral-200 p-3 space-y-3">
          {filtered.map((lr) => (
            <div key={lr.id} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-black">{lr.workType}</div>
                  <div className="text-[11px] text-neutral-500">{lr.labourCategory}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-[#EBA224]">
                  {lr.qualityLevel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-200">
                <div>
                  <span className="text-neutral-400">Rate: </span>
                  <span className="font-mono font-bold text-black">{formatINR(lr.rate)}</span>
                  <span className="text-[10px] text-neutral-500"> / {lr.unit}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Min Charge: </span>
                  <span className="font-mono font-medium text-black">{lr.minimumCharge > 0 ? formatINR(lr.minimumCharge) : 'Nil'}</span>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(lr)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-black border border-neutral-300 min-h-[36px]"
                >
                  <Edit2 className="w-3 h-3 text-[#EBA224]" />
                  <span>Edit Rate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {(editingRate || isAddOpen) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="px-6 py-5 bg-black text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingRate ? 'Edit Labour Rate' : 'Add New Labour Rate'}
              </h3>
              <button
                onClick={() => {
                  setEditingRate(null);
                  setIsAddOpen(false);
                }}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Work Description *</label>
                <input
                  type="text"
                  value={editWorkType}
                  onChange={(e) => setEditWorkType(e.target.value)}
                  placeholder="e.g. Master Carpenter Wardrobe Fabrication"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden cursor-pointer"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Unit</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as MeasurementUnit)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden cursor-pointer"
                  >
                    <option value="sq.ft.">sq.ft.</option>
                    <option value="R.ft.">R.ft.</option>
                    <option value="point">point</option>
                    <option value="job">job</option>
                    <option value="lot">lot</option>
                    <option value="piece">piece</option>
                    <option value="day">day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Labour Rate (₹/unit)</label>
                  <input
                    type="number"
                    value={editRatePerUnit}
                    onChange={(e) => setEditRatePerUnit(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Min. Job Callout (₹)</label>
                  <input
                    type="number"
                    value={editMinCharge}
                    onChange={(e) => setEditMinCharge(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-black/10 flex justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setEditingRate(null);
                  setIsAddOpen(false);
                }}
                className="px-5 py-2.5 rounded-full text-black hover:bg-neutral-200 font-bold uppercase tracking-wider transition min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={editingRate ? handleSaveEdit : handleCreate}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-[#EBA224] font-bold uppercase tracking-wider shadow-xs transition min-h-[44px] cursor-pointer"
              >
                {editingRate ? 'Update Rate' : 'Save Labour Rate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
