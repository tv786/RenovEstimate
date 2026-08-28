import React, { useState } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  History,
  Download,
  X
} from 'lucide-react';
import { MaterialItem, PriceHistoryEntry, QualityTier, MeasurementUnit } from '../types';
import { formatINR } from '../utils/calculationEngine';

interface MaterialDatabaseViewProps {
  materials: MaterialItem[];
  priceHistory: PriceHistoryEntry[];
  onUpdateMaterialPrice: (
    matId: string,
    newCost: number,
    newSelling: number,
    changedBy: string,
    reason?: string
  ) => void;
  onAddMaterial: (mat: MaterialItem) => void;
}

export const MaterialDatabaseView: React.FC<MaterialDatabaseViewProps> = ({
  materials,
  priceHistory,
  onUpdateMaterialPrice,
  onAddMaterial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [activeTab, setActiveTab] = useState<'materials' | 'history'>('materials');

  // Edit Material Price Modal
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editSellingRate, setEditSellingRate] = useState<number>(0);
  const [editChangedBy, setEditChangedBy] = useState('Er. Rajesh Varma');
  const [editReason, setEditReason] = useState('Quarterly timber & hardware escalation');

  // Add New Material Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newBrand, setNewBrand] = useState('Generic / ISI');
  const [newCategory, setNewCategory] = useState('Carpentry');
  const [newSpecification, setNewSpecification] = useState('');
  const [newUnit, setNewUnit] = useState<MeasurementUnit>('sq.ft.');
  const [newCostPrice, setNewCostPrice] = useState<number>(100);
  const [newSellingRate, setNewSellingRate] = useState<number>(130);
  const [newWastage, setNewWastage] = useState<number>(8);
  const [newTier, setNewTier] = useState<QualityTier>('Standard');

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

  const filteredMaterials = materials.filter((mat) => {
    const matchesSearch =
      mat.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || mat.category === selectedCategory;
    const matchesTier =
      selectedTier === 'All' || mat.qualityLevel === selectedTier;
    return matchesSearch && matchesCategory && matchesTier;
  });

  const handleOpenEdit = (mat: MaterialItem) => {
    setEditingMaterial(mat);
    setEditCostPrice(mat.costPrice);
    setEditSellingRate(mat.sellingRate);
  };

  const handleSaveEdit = () => {
    if (!editingMaterial) return;
    onUpdateMaterialPrice(
      editingMaterial.id,
      editCostPrice,
      editSellingRate,
      editChangedBy,
      editReason
    );
    setEditingMaterial(null);
  };

  const handleCreateMaterial = () => {
    if (!newItemName.trim()) return;
    const newMat: MaterialItem = {
      id: 'mat-custom-' + Date.now(),
      itemName: newItemName,
      brand: newBrand,
      category: newCategory,
      specification: newSpecification,
      unit: newUnit,
      costPrice: newCostPrice,
      sellingRate: newSellingRate,
      defaultWastagePercent: newWastage,
      qualityLevel: newTier,
      location: 'All',
      isActive: true,
      lastUpdated: new Date().toISOString()
    };
    onAddMaterial(newMat);
    setIsAddOpen(false);
    setNewItemName('');
    setNewSpecification('');
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    let csv = 'ID,Category,Item Name,Brand,Specification,Unit,Cost Price,Selling Rate,Wastage %,Quality Tier,Last Updated\n';
    materials.forEach((m) => {
      csv += `"${m.id}","${m.category}","${m.itemName.replace(/"/g, '""')}","${m.brand || ''}","${m.specification.replace(/"/g, '""')}","${m.unit}",${m.costPrice},${m.sellingRate},${m.defaultWastagePercent},"${m.qualityLevel}","${m.lastUpdated}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RuhAlBina_Materials_Master.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black/10 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-[#EBA224]">
                <Layers className="w-3 h-3" />
                <span>Price Master</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {materials.length} Items
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
              Materials Master Database
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Rate schedule for carpentry, electrical, finishes, and hardware.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-black transition cursor-pointer border border-neutral-300 min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-800 text-[#EBA224] shadow-xs transition min-h-[38px] cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#EBA224]" />
              <span>Add Material</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Catalog vs Price Audit History */}
        <div className="mt-4 border-t border-neutral-200 pt-3 flex items-center gap-4 sm:gap-6 text-xs">
          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-1.5 border-b-2 font-bold uppercase tracking-wider transition cursor-pointer text-xs ${
              activeTab === 'materials'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            Catalog ({filteredMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-1.5 border-b-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 text-xs ${
              activeTab === 'history'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Price Log ({priceHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'materials' ? (
        /* MATERIALS CATALOG VIEW */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-black/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search materials by name, spec, or grade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-black outline-hidden font-medium text-black"
              />
            </div>

            {/* Category & Tier Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-2 bg-neutral-50 px-3.5 py-2 rounded-2xl border border-neutral-300">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Category:</span>
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

              <div className="flex items-center gap-2 bg-neutral-50 px-3.5 py-2 rounded-2xl border border-neutral-300">
                <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Tier:</span>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="bg-transparent font-semibold text-black focus:outline-hidden cursor-pointer"
                >
                  <option value="All">All Tiers</option>
                  <option value="Economy">Economy</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
            </div>
          </div>

          {/* Materials Table (Desktop) */}
          <div className="bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200 text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Category & Item</th>
                    <th className="px-5 py-3.5">Technical Specification</th>
                    <th className="px-4 py-3.5">Unit</th>
                    <th className="px-5 py-3.5">Cost Price (₹)</th>
                    <th className="px-5 py-3.5">Selling Rate (₹)</th>
                    <th className="px-4 py-3.5 text-center">Wastage %</th>
                    <th className="px-4 py-3.5">Tier</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredMaterials.map((mat) => (
                    <tr
                      key={mat.id}
                      className="hover:bg-neutral-50 transition group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-black group-hover:text-neutral-800 transition">
                          {mat.itemName}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
                          {mat.category} {mat.brand ? `• ${mat.brand}` : ''}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-neutral-600 max-w-xs truncate">
                        {mat.specification}
                      </td>

                      <td className="px-4 py-4 font-mono text-neutral-600 font-medium">
                        {mat.unit}
                      </td>

                      <td className="px-5 py-4 font-mono font-medium text-black">
                        {formatINR(mat.costPrice)}
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-black">
                        {formatINR(mat.sellingRate)}
                      </td>

                      <td className="px-4 py-4 text-center font-mono font-bold text-black">
                        {mat.defaultWastagePercent}%
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          mat.qualityLevel === 'Luxury'
                            ? 'bg-black text-[#EBA224]'
                            : mat.qualityLevel === 'Premium'
                            ? 'bg-black text-white'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}>
                          {mat.qualityLevel}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(mat)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-neutral-100 border border-neutral-300 transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-[#EBA224]" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-neutral-200 p-3 space-y-3">
              {filteredMaterials.map((mat) => (
                <div key={mat.id} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-black">{mat.itemName}</div>
                      <div className="text-[11px] text-neutral-500">{mat.category} {mat.brand ? `• ${mat.brand}` : ''}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-[#EBA224]">
                      {mat.qualityLevel}
                    </span>
                  </div>
                  {mat.specification && (
                    <div className="text-[11px] text-neutral-600">
                      {mat.specification}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-200">
                    <div>
                      <span className="text-neutral-400">Cost: </span>
                      <span className="font-mono font-medium text-black">{formatINR(mat.costPrice)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Selling: </span>
                      <span className="font-mono font-bold text-black">{formatINR(mat.sellingRate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-neutral-400">Unit: <strong className="text-black font-mono">{mat.unit}</strong> (Wastage: {mat.defaultWastagePercent}%)</span>
                    <button
                      onClick={() => handleOpenEdit(mat)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-black border border-neutral-300 min-h-[36px]"
                    >
                      <Edit2 className="w-3 h-3 text-[#EBA224]" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* PRICE REVISION AUDIT LOG VIEW */
        <div className="bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-neutral-50 border-b border-black/10 text-xs font-bold text-black flex items-center gap-2">
            <History className="w-4 h-4 text-[#EBA224]" />
            <span>Price Revision Audit History (Logged Changes)</span>
          </div>

          <div className="divide-y divide-neutral-200 text-xs">
            {priceHistory.map((ph) => {
              const diff = ph.newRate - ph.previousRate;
              const percent = ph.previousRate > 0 ? ((diff / ph.previousRate) * 100).toFixed(1) : '0';

              return (
                <div key={ph.id} className="p-4 sm:p-5 hover:bg-neutral-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-black">
                      {ph.itemName}
                    </div>
                    <div className="text-neutral-500 text-[11px] flex flex-wrap items-center gap-2">
                      <span>By: <strong className="text-black">{ph.changedBy}</strong></span>
                      <span>•</span>
                      <span>Date: {new Date(ph.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {ph.reason && (
                        <>
                          <span>•</span>
                          <span className="italic text-neutral-600">"{ph.reason}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 sm:text-right">
                    <div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {formatINR(ph.previousRate)} → <strong className="text-black text-sm font-mono">{formatINR(ph.newRate)}</strong> / {ph.unit}
                      </div>
                      <div className={`text-[10px] font-mono font-bold ${diff >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {diff >= 0 ? `+${formatINR(diff)} (+${percent}%)` : `${formatINR(diff)} (${percent}%)`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="px-6 py-5 bg-black text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Update Material Price</h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div className="font-bold text-sm text-black">{editingMaterial.itemName}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">{editingMaterial.specification}</div>
                <div className="text-[11px] text-black font-bold uppercase tracking-wider mt-1.5">Unit: {editingMaterial.unit}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">
                    Selling Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={editSellingRate}
                    onChange={(e) => setEditSellingRate(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-2xl font-mono font-bold text-black bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setEditingMaterial(null)}
                className="px-5 py-2.5 rounded-full text-black hover:bg-neutral-200 font-bold uppercase tracking-wider transition min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-[#EBA224] font-bold uppercase tracking-wider shadow-xs transition min-h-[44px] cursor-pointer"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="px-6 py-5 bg-black text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Add New Master Material</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Item Name *</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Century Club Prime Marine Plywood"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. Century Ply / Greenply"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden cursor-pointer"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Quality Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as QualityTier)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden cursor-pointer"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as MeasurementUnit)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden cursor-pointer"
                  >
                    <option value="sq.ft.">sq.ft.</option>
                    <option value="R.ft.">R.ft.</option>
                    <option value="point">point</option>
                    <option value="job">job</option>
                    <option value="lot">lot</option>
                    <option value="piece">piece</option>
                    <option value="bag">bag</option>
                    <option value="brass">brass</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Technical Specification</label>
                  <input
                    type="text"
                    value={newSpecification}
                    onChange={(e) => setNewSpecification(e.target.value)}
                    placeholder="e.g. 19mm IS:710 Marine Grade with BWP adhesive"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Wastage %</label>
                  <input
                    type="number"
                    value={newWastage}
                    onChange={(e) => setNewWastage(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-medium text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono font-bold text-black focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-black uppercase tracking-wider mb-1.5">Selling Rate (₹)</label>
                  <input
                    type="number"
                    value={newSellingRate}
                    onChange={(e) => setNewSellingRate(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-2xl font-mono font-bold text-black bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-black outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-5 py-2.5 rounded-full text-black hover:bg-neutral-200 font-bold uppercase tracking-wider transition min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMaterial}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-[#EBA224] font-bold uppercase tracking-wider shadow-xs transition min-h-[44px] cursor-pointer"
              >
                Add to Master Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
