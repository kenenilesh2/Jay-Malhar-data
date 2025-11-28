import React, { useState, useMemo } from 'react';
import { MaterialEntry, InvoiceCategory, InvoiceItem } from '../types';
import { MATERIAL_CATEGORIES, DEFAULT_RATES, GST_RATES } from '../constants';
import { generateMonthlyInvoicePDF } from '../services/pdfService';
import { formatCurrency } from '../services/utils';

interface InvoiceGeneratorProps {
  entries: MaterialEntry[];
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ entries }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedCategory, setSelectedCategory] = useState<InvoiceCategory>('Building Material');
  const [customRates, setCustomRates] = useState<Record<string, number>>(DEFAULT_RATES);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const entryMonth = e.date.slice(0, 7);
      const category = MATERIAL_CATEGORIES[e.material];
      return entryMonth === selectedMonth && category === selectedCategory;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, selectedMonth, selectedCategory]);

  // Calculate items
  const invoiceItems: InvoiceItem[] = useMemo(() => {
    return filteredEntries.map(e => {
      const rate = customRates[e.material] || 0;
      return {
        id: e.id,
        date: new Date(e.date).toLocaleDateString(),
        challanNumber: e.challanNumber,
        vehicleNumber: e.vehicleNumber || '-',
        description: e.material,
        quantity: e.quantity,
        rate: rate,
        amount: e.quantity * rate
      };
    });
  }, [filteredEntries, customRates]);

  // Totals
  const totalBase = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const taxConfig = GST_RATES[selectedCategory];
  const cgstAmt = totalBase * (taxConfig.cgst / 100);
  const sgstAmt = totalBase * (taxConfig.sgst / 100);
  const grandTotal = totalBase + cgstAmt + sgstAmt;

  const handleRateChange = (material: string, val: string) => {
    setCustomRates(prev => ({
      ...prev,
      [material]: parseFloat(val) || 0
    }));
  };

  const handleDownload = () => {
    if (invoiceItems.length === 0) {
      alert("No entries found for this month/category.");
      return;
    }
    generateMonthlyInvoicePDF(selectedMonth, selectedCategory, invoiceItems, totalBase, cgstAmt + sgstAmt, grandTotal);
  };

  // Get unique materials in this selection to show rate inputs
  const uniqueMaterials = Array.from(new Set(filteredEntries.map(e => e.material)));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Monthly Invoice Generator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Month</label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as InvoiceCategory)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="Building Material">Building Material</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Machinery">Machinery</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleDownload}
              className="w-full px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow transition-colors flex items-center justify-center"
            >
              <i className="fas fa-file-pdf mr-2"></i> Generate Invoice PDF
            </button>
          </div>
        </div>

        {/* Rate Configuration */}
        {uniqueMaterials.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Rate Configuration (Per Unit)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uniqueMaterials.map(mat => (
                <div key={mat}>
                  <label className="block text-xs text-slate-500 mb-1">{mat}</label>
                  <input 
                    type="number" 
                    value={customRates[mat]} 
                    onChange={(e) => handleRateChange(mat, e.target.value)}
                    className="w-full px-3 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Challan</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceItems.length > 0 ? (
                invoiceItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2">{item.date}</td>
                    <td className="px-4 py-2">{item.challanNumber}</td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.rate)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No entries found</td>
                </tr>
              )}
            </tbody>
            {invoiceItems.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-slate-800">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Sub Total</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(totalBase)}</td>
                </tr>
                {selectedCategory !== 'Water Supply' && (
                  <>
                     <tr>
                      <td colSpan={5} className="px-4 py-2 text-right text-xs font-normal">CGST ({taxConfig.cgst}%)</td>
                      <td className="px-4 py-2 text-right text-xs font-normal">{formatCurrency(cgstAmt)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-right text-xs font-normal">SGST ({taxConfig.sgst}%)</td>
                      <td className="px-4 py-2 text-right text-xs font-normal">{formatCurrency(sgstAmt)}</td>
                    </tr>
                  </>
                )}
                <tr className="bg-slate-200">
                  <td colSpan={5} className="px-4 py-3 text-right text-base">Grand Total</td>
                  <td className="px-4 py-3 text-right text-base text-brand-700">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
