import React, { useState, useMemo } from 'react';
import { MaterialEntry, SummaryReportEntry, InvoiceCategory } from '../types';
import { MATERIAL_CATEGORIES, PHASES_LIST, DEFAULT_RATES, CATEGORY_SUBCATEGORIES } from '../constants';
import { generateSummaryPDF } from '../services/pdfService';
import { formatCurrency } from '../services/utils';

interface InvoiceSummaryProps {
  entries: MaterialEntry[];
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ entries }) => {
  const [selectedCategory, setSelectedCategory] = useState<InvoiceCategory>('Building Material');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [selectedPhase, setSelectedPhase] = useState<string>('Phase - 1');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [customRates, setCustomRates] = useState<Record<string, number>>(DEFAULT_RATES);

  // Available Sub-Categories
  const availableSubCategories = useMemo(() => {
    return CATEGORY_SUBCATEGORIES[selectedCategory] || [];
  }, [selectedCategory]);

  // Handle Category Change
  const handleCategoryChange = (val: InvoiceCategory) => {
    setSelectedCategory(val);
    setSelectedSubCategory('All');
  };

  // Handle Rate Change
  const handleRateChange = (material: string, val: string) => {
    setCustomRates(prev => ({
      ...prev,
      [material]: parseFloat(val) || 0
    }));
  };

  // Filter Data
  const filteredData = useMemo(() => {
    return entries.filter(e => {
      const entryMonth = e.date.slice(0, 7);
      const category = MATERIAL_CATEGORIES[e.material];
      
      const matchMonth = entryMonth === selectedMonth;
      const matchCategory = category === selectedCategory;
      const matchPhase = e.phase === selectedPhase;
      
      let matchSubCategory = true;
      if (selectedSubCategory !== 'All') {
        matchSubCategory = e.material === selectedSubCategory;
      }

      return matchMonth && matchCategory && matchPhase && matchSubCategory;
    });
  }, [entries, selectedMonth, selectedCategory, selectedSubCategory, selectedPhase]);

  // Map to Report Entries
  const reportEntries: SummaryReportEntry[] = useMemo(() => {
    return filteredData.map((e, idx) => {
      const rate = customRates[e.material] || 0;
      return {
        srNo: idx + 1,
        date: new Date(e.date).toLocaleDateString(),
        challanNumber: e.challanNumber,
        vehicleNumber: e.vehicleNumber || '-',
        material: e.material,
        quantity: e.quantity,
        rate: rate,
        amount: e.quantity * rate
      };
    });
  }, [filteredData, customRates]);

  // Calculations
  const totalQty = reportEntries.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = reportEntries.reduce((sum, item) => sum + item.amount, 0);

  // Export
  const handleExport = () => {
    if (reportEntries.length === 0) {
      alert("No data to export");
      return;
    }
    
    // Construct dynamic title
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
    const yearShort = year.slice(2);
    
    let title = `${selectedCategory}`;
    if (selectedSubCategory !== 'All') title = selectedSubCategory;
    
    const phaseShort = selectedPhase.replace('Phase - ', 'Ph');
    
    const docTitle = `${title} ${phaseShort} ${monthName} ${yearShort}`;
    
    // PASS SELECTED CATEGORY AND SUB-CATEGORY TO SERVICE
    generateSummaryPDF(reportEntries, docTitle, selectedCategory, selectedSubCategory);
  };

  // Materials for Rate Config (in current view)
  const uniqueMaterials = Array.from(new Set(filteredData.map(e => e.material)));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Invoice Summary Report</h2>
          <button 
            onClick={handleExport}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm flex items-center transition-colors"
          >
            <i className="fas fa-file-pdf mr-2"></i> Export PDF
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Month</label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phase</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
            >
              {PHASES_LIST.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value as InvoiceCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
            >
              <option value="Building Material">Building Material</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Machinery">Machinery</option>
            </select>
          </div>
           <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sub-Category</label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 text-sm"
              disabled={availableSubCategories.length === 0}
            >
              <option value="All">All</option>
              {availableSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Rate Adjuster */}
        {uniqueMaterials.length > 0 && (
          <div className="mb-6">
             <h3 className="text-sm font-semibold text-slate-700 mb-2">Adjust Rates</h3>
             <div className="flex flex-wrap gap-4">
               {uniqueMaterials.map(mat => (
                 <div key={mat} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                   <span className="text-xs text-slate-600 font-medium">{mat}:</span>
                   <input 
                      type="number" 
                      className="w-20 px-2 py-1 text-xs border rounded"
                      value={customRates[mat] || 0}
                      onChange={(e) => handleRateChange(mat, e.target.value)}
                   />
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Sr.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Challan</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportEntries.map((row) => (
                <tr key={row.srNo} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-center text-slate-500">{row.srNo}</td>
                  <td className="px-4 py-2">{row.date}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{row.challanNumber}</td>
                  <td className="px-4 py-2">{row.vehicleNumber}</td>
                  <td className="px-4 py-2">{row.material}</td>
                  <td className="px-4 py-2 text-right font-medium">{row.quantity}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{row.rate}</td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-700">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
              {reportEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                    No entries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
            {reportEntries.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-slate-800">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right">Grand Total:</td>
                  <td className="px-4 py-3 text-right">{totalQty.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">-</td>
                  <td className="px-4 py-3 text-right text-brand-600">{formatCurrency(totalAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;