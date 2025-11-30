import React, { useState, useMemo, useEffect } from 'react';
import { ClientLedgerEntry } from '../types';
import { getClientLedgerEntries, bulkAddClientLedgerEntries } from '../services/dataService';
import { formatCurrency, parseLedgerDate } from '../services/utils';
import { generateLedgerPDF } from '../services/pdfService';
import * as XLSX from 'xlsx';

const ClientLedger: React.FC = () => {
  const [data, setData] = useState<ClientLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<ClientLedgerEntry[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const entries = await getClientLedgerEntries();
      setData(entries);
    } catch (e) {
      console.error("Failed to load ledger", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to process row data based on user requirements
  const processRow = (item: ClientLedgerEntry) => {
    const part = (item.particulars || '').trim();
    let derivedType = 'NA';
    let derivedBankName = 'NA';

    if (part.toLowerCase().startsWith('dr ') || part.toLowerCase().startsWith('dr.')) {
      // If Dr, Put rest in Type, Bank is NA
      derivedType = part.substring(2).trim().replace(/^\./, '').trim();
      derivedBankName = 'NA';
    } else if (part.toLowerCase().startsWith('cr ') || part.toLowerCase().startsWith('cr.')) {
      // If Cr, Put rest in Bank Name, Type is NA
      derivedBankName = part.substring(2).trim().replace(/^\./, '').trim();
      derivedType = 'NA';
    } else {
      // Fallback if neither prefix exists (though data usually has it)
      // Treating as Dr by default or just putting in Type? 
      // User asked specific logic for Dr and Cr. Let's keep original in Type if unclear.
      derivedType = part; 
    }

    return { ...item, derivedType, derivedBankName };
  };

  const processedData = useMemo(() => {
    return data.map(processRow);
  }, [data]);

  const filteredData = useMemo(() => {
    return processedData.filter(item => {
      // 1. Search Filter
      const matchesSearch = 
        (item.particulars || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.vchNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.derivedType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.derivedBankName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Month Filter
      let matchesMonth = true;
      if (filterMonth) {
        matchesMonth = item.date.startsWith(filterMonth);
      }

      // 3. Type Filter
      let matchesType = true;
      if (filterType !== 'All') {
        matchesType = item.vchType === filterType;
      }

      return matchesSearch && matchesMonth && matchesType;
    });
  }, [processedData, searchTerm, filterMonth, filterType]);

  const totalDebit = filteredData.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = filteredData.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const closingBalance = totalCredit - totalDebit;

  // --- FILE UPLOAD LOGIC ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadPreview([]);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result;
      parseFile(arrayBuffer);
      e.target.value = ''; // Reset
    };
    reader.readAsArrayBuffer(file);
  };

  const parseFile = (arrayBuffer: any) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (jsonData.length === 0) throw new Error("File is empty");

      const cleanNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const clean = String(val).replace(/,/g, '').trim();
        return parseFloat(clean) || 0;
      };

      const parsedEntries: ClientLedgerEntry[] = jsonData.map((row: any): ClientLedgerEntry | null => {
        const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date')) || 'Date';
        const particularsKey = Object.keys(row).find(k => k.toLowerCase() === 'particulars') || 'Particulars';
        // We still parse other columns for storage, even if we don't display them all
        const vchTypeKey = Object.keys(row).find(k => k.toLowerCase().includes('vch type')) || 'Vch Type';
        const vchNoKey = Object.keys(row).find(k => k.toLowerCase().includes('vch no') || k.toLowerCase().includes('vch.')) || 'Vch No.';
        const debitKey = Object.keys(row).find(k => k.toLowerCase().includes('debit')) || 'Debit';
        const creditKey = Object.keys(row).find(k => k.toLowerCase().includes('credit')) || 'Credit';
        const descKey = Object.keys(row).find(k => k.toLowerCase().includes('description')) || 'Description';

        const pVal = String(row[particularsKey] || '').toLowerCase();
        if (pVal.includes('total') || pVal === 'particulars') return null;

        const rawDate = row[dateKey];
        if (!rawDate) return null;
        
        const stdDate = parseLedgerDate(rawDate);
        
        return {
          date: stdDate,
          particulars: row[particularsKey] ? String(row[particularsKey]).trim() : '',
          drCr: '', // Can be derived or stored empty
          accountName: '', // Can be derived or stored empty
          vchType: row[vchTypeKey] ? String(row[vchTypeKey]).trim() : '',
          vchNo: row[vchNoKey] ? String(row[vchNoKey]).trim() : '',
          debit: cleanNumber(row[debitKey]),
          credit: cleanNumber(row[creditKey]),
          description: row[descKey] ? String(row[descKey]).trim() : ''
        };
      }).filter((item): item is ClientLedgerEntry => item !== null && item.date !== '');

      if (parsedEntries.length === 0) throw new Error("No valid records found.");
      setUploadPreview(parsedEntries);
      setShowUpload(true);

    } catch (err: any) {
      console.error(err);
      setUploadError("Failed to parse file. " + err.message);
    }
  };

  const confirmUpload = async () => {
    setIsProcessing(true);
    try {
      await bulkAddClientLedgerEntries(uploadPreview);
      alert("Client Ledger uploaded successfully! Old data replaced.");
      setShowUpload(false);
      setUploadPreview([]);
      await fetchData();
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No data to export");
    const periodLabel = filterMonth ? filterMonth : "All Time";
    generateLedgerPDF(filteredData, periodLabel);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert("No data to export");
    
    // CSV Headers based on new requirement
    const headers = ['Date', 'Type(DR/CR)', 'Bank Name', 'Vch Type', 'Vch No.', 'Debit', 'Credit', 'Description'];
    
    const rows = filteredData.map(item => [
      item.date,
      `"${item.derivedType.replace(/"/g, '""')}"`,
      `"${item.derivedBankName.replace(/"/g, '""')}"`,
      item.vchType,
      item.vchNo,
      item.debit,
      item.credit,
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ledger_Export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const voucherTypes = useMemo(() => {
    const types = new Set(data.map(i => i.vchType));
    return ['All', ...Array.from(types).filter(Boolean)];
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-100 bg-slate-50">
        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Received (Debit)</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Billed (Credit)</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCredit)}</p>
        </div>
        <div className="p-6 bg-white">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Net Receivable Balance</p>
            <p className={`text-2xl font-bold ${closingBalance >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                {formatCurrency(closingBalance)}
            </p>
        </div>
      </div>

      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <i className="fas fa-book-open mr-2 text-brand-500"></i>
            Arihant Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">Full Transaction History</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
           <label className="cursor-pointer px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-sm font-medium transition-colors flex items-center border border-brand-200 shadow-sm">
              <i className="fas fa-cloud-upload-alt mr-2"></i> Upload File
              <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} />
           </label>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {voucherTypes.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
            ))}
          </select>

          <input 
            type="month"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />

          <div className="relative flex-grow xl:flex-grow-0">
             <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
             <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 px-3 py-2 border border-slate-200 rounded-lg text-sm w-32 xl:w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            <button onClick={handleExportPDF} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200" title="Export PDF">
                <i className="fas fa-file-pdf"></i>
            </button>
            <button onClick={handleExportCSV} className="p-2 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-200" title="Export CSV">
                <i className="fas fa-file-csv"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
           <div className="flex justify-center items-center h-32">
             <i className="fas fa-spinner fa-spin text-brand-500 text-2xl"></i>
           </div>
        ) : (
          <table className="w-full text-left text-sm relative border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 w-28 whitespace-nowrap">Date</th>
                <th className="px-6 py-3 whitespace-nowrap">Type (DR/CR)</th>
                <th className="px-6 py-3 whitespace-nowrap">Bank Name</th>
                <th className="px-6 py-3 w-24 whitespace-nowrap">Vch Type</th>
                <th className="px-6 py-3 w-24 whitespace-nowrap">Vch No.</th>
                <th className="px-6 py-3 text-right w-32 text-emerald-600 whitespace-nowrap">Debit</th>
                <th className="px-6 py-3 text-right w-32 text-red-600 whitespace-nowrap">Credit</th>
                <th className="px-6 py-3 w-64 whitespace-nowrap">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{item.date}</td>
                  
                  {/* Type (DR/CR) */}
                  <td className="px-6 py-3 font-medium text-slate-700">
                    {item.derivedType !== 'NA' ? item.derivedType : <span className="text-slate-300">NA</span>}
                  </td>
                  
                  {/* Bank Name */}
                  <td className="px-6 py-3 font-medium text-slate-700">
                     {item.derivedBankName !== 'NA' ? item.derivedBankName : <span className="text-slate-300">NA</span>}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          item.vchType?.toLowerCase().includes('payment') ? 'bg-emerald-100 text-emerald-700' :
                          item.vchType?.toLowerCase().includes('receipt') ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                      }`}>
                          {item.vchType}
                      </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400 font-mono text-xs group-hover:text-slate-600">{item.vchNo}</td>
                  <td className="px-6 py-3 text-right font-medium">
                    {item.debit > 0 ? <span className="text-emerald-700">{formatCurrency(item.debit)}</span> : <span className="text-slate-200">-</span>}
                  </td>
                  <td className="px-6 py-3 text-right font-medium">
                    {item.credit > 0 ? <span className="text-red-700">{formatCurrency(item.credit)}</span> : <span className="text-slate-200">-</span>}
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500 truncate max-w-xs" title={item.description}>
                      {item.description}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Preview Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">Confirm Import</h3>
                  <p className="text-sm text-slate-500">
                    This will <span className="text-red-600 font-bold">REPLACE</span> all existing ledger data with {uploadPreview.length} new records.
                  </p>
              </div>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {uploadError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border border-red-200 flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2 text-xl"></i> {uploadError}
                </div>
              )}
              <table className="w-full text-xs bg-white rounded border border-slate-200">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-3 text-left w-24">Date</th>
                    <th className="p-3 text-left">Particulars (Original)</th>
                    <th className="p-3 text-left w-20">Type</th>
                    <th className="p-3 text-right w-24">Debit</th>
                    <th className="p-3 text-right w-24">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadPreview.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-3 font-mono">{row.date}</td>
                      <td className="p-3 truncate max-w-xs" title={row.particulars}>{row.particulars}</td>
                      <td className="p-3">{row.vchType}</td>
                      <td className="p-3 text-right text-emerald-600">{row.debit || '-'}</td>
                      <td className="p-3 text-right text-red-600">{row.credit || '-'}</td>
                    </tr>
                  ))}
                  {uploadPreview.length > 100 && (
                      <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500 bg-slate-50 font-medium">
                              ... and {uploadPreview.length - 100} more records
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setShowUpload(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpload}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-lg shadow-brand-500/30 flex items-center font-semibold disabled:opacity-50 transition-all transform active:scale-95"
              >
                {isProcessing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check-circle mr-2"></i>}
                Confirm & Replace Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientLedger;