import React, { useState, useMemo } from 'react';
import { CLIENT_LEDGER_DATA } from '../services/clientLedgerData';
import { formatCurrency } from '../services/utils';
import { generateLedgerPDF } from '../services/pdfService';

const ClientLedger: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredData = useMemo(() => {
    return CLIENT_LEDGER_DATA.filter(item => {
      // 1. Search Filter
      const matchesSearch = item.particulars.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.vchNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Month Filter
      let matchesMonth = true;
      if (filterMonth) {
        const parts = item.date.split('-');
        if (parts.length === 3) {
            const [day, monthStr, yearStr] = parts;
            const year = '20' + yearStr;
            const monthIndex = new Date(Date.parse(monthStr + " 1, 2012")).getMonth() + 1;
            const itemMonth = `${year}-${String(monthIndex).padStart(2, '0')}`;
            matchesMonth = itemMonth === filterMonth;
        }
      }

      // 3. Type Filter
      let matchesType = true;
      if (filterType !== 'All') {
        matchesType = item.vchType === filterType;
      }

      return matchesSearch && matchesMonth && matchesType;
    });
  }, [searchTerm, filterMonth, filterType]);

  const totalDebit = filteredData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = filteredData.reduce((sum, item) => sum + item.credit, 0);
  const closingBalance = totalCredit - totalDebit;

  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      alert("No data to export based on current filters.");
      return;
    }
    const periodLabel = filterMonth ? filterMonth : "All Time";
    generateLedgerPDF(filteredData, periodLabel);
  };

  // Get unique voucher types for dropdown
  const voucherTypes = useMemo(() => {
    const types = new Set(CLIENT_LEDGER_DATA.map(i => i.vchType));
    return ['All', ...Array.from(types)];
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Arihant Superstructures Ledger</h2>
          <p className="text-sm text-slate-500">Transaction History</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          {/* Column/Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {voucherTypes.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
            ))}
          </select>

          {/* Month Filter */}
          <input 
            type="month"
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />

          {/* Search */}
          <div className="relative flex-grow xl:flex-grow-0">
             <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
             <input 
              type="text" 
              placeholder="Search particulars..." 
              className="pl-8 px-3 py-2 border rounded-lg text-sm w-full xl:w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export Button */}
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
          >
            <i className="fas fa-file-pdf mr-2"></i> Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3">Particulars</th>
              <th className="px-4 py-3 whitespace-nowrap">Vch Type</th>
              <th className="px-4 py-3 whitespace-nowrap">Vch No.</th>
              <th className="px-4 py-3 text-right text-emerald-600 whitespace-nowrap">Debit (Received)</th>
              <th className="px-4 py-3 text-right text-red-600 whitespace-nowrap">Credit (Billed)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-2 whitespace-nowrap text-slate-500">{item.date}</td>
                <td className="px-4 py-2 font-medium text-slate-700">{item.particulars}</td>
                <td className="px-4 py-2 text-slate-500 text-xs uppercase tracking-wide">{item.vchType}</td>
                <td className="px-4 py-2 text-slate-500 font-mono text-xs">{item.vchNo}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {item.debit > 0 ? formatCurrency(item.debit) : <span className="text-slate-300">-</span>}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {item.credit > 0 ? formatCurrency(item.credit) : <span className="text-slate-300">-</span>}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">No records found matching your filters</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-50 border-t border-slate-300 p-4">
        <div className="flex flex-col md:flex-row justify-end items-center gap-4 md:gap-8 text-sm">
            <div className="flex justify-between w-full md:w-auto md:block">
              <span className="text-slate-500 mr-2">Total Received:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(totalDebit)}</span>
            </div>
            <div className="flex justify-between w-full md:w-auto md:block">
              <span className="text-slate-500 mr-2">Total Billed:</span>
              <span className="font-bold text-red-700">{formatCurrency(totalCredit)}</span>
            </div>
            <div className="flex justify-between w-full md:w-auto md:block bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-slate-800 font-semibold mr-2">Balance (Receivable):</span>
              <span className={`font-bold text-lg ${closingBalance >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                {formatCurrency(closingBalance)}
              </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLedger;