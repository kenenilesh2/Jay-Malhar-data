import React, { useState } from 'react';
import { generateChallanPDF } from '../services/pdfService';
import { MaterialEntry } from '../types';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onAddClick: () => void;
  filterValue?: string;
  onClearFilter?: () => void;
  enableExport?: boolean;
  enableDateFilter?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

const DataTable = <T extends { id: string }>({ 
  title, 
  data, 
  columns, 
  onAddClick,
  filterValue,
  onClearFilter,
  enableExport,
  enableDateFilter,
  onEdit,
  onDelete
}: DataTableProps<T>) => {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Search and Filter Logic
  const filteredData = data.filter(item => {
    // 1. Month Filter
    if (selectedMonth) {
       // Assume item has a 'date' property string
       const dateVal = (item as any).date;
       if (typeof dateVal === 'string' && !dateVal.startsWith(selectedMonth)) {
         return false;
       }
    }

    // 2. External Filter (from Dashboard)
    if (filterValue) {
       const mat = (item as any).material; 
       if (mat && mat !== filterValue) return false;
    }

    // 3. Search
    const rowString = Object.values(item).join(' ').toLowerCase();
    return rowString.includes(search.toLowerCase());
  });

  const handleExport = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    // Extract headers from keys of the first item
    const firstItem = filteredData[0];
    const keys = Object.keys(firstItem).filter(k => k !== 'id' && k !== 'timestamp');

    // Build CSV content
    const headerRow = keys.join(',');
    const rows = filteredData.map(item => {
      return keys.map(key => {
        const val = (item as any)[key];
        // Escape quotes and wrap in quotes
        const escaped = String(val ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${selectedMonth || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (item: T) => {
    // Check if it's a material entry by looking for challanNumber
    if ((item as any).challanNumber) {
      generateChallanPDF(item as unknown as MaterialEntry);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            {title}
            {filterValue && (
              <span className="ml-2 px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded-full flex items-center">
                Filtered: {filterValue}
                <button onClick={onClearFilter} className="ml-2 hover:text-brand-900"><i className="fas fa-times"></i></button>
              </span>
            )}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Month Filter */}
          {enableDateFilter && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              title="Filter by Month"
            />
          )}

          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <i className="fas fa-search absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          
          {/* Export Button */}
          {enableExport && (
             <button 
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center whitespace-nowrap"
              title="Download Excel/CSV"
            >
              <i className="fas fa-file-csv mr-2"></i> Export
            </button>
          )}

          {/* Add Button */}
          <button 
            onClick={onAddClick}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center whitespace-nowrap"
          >
            <i className="fas fa-plus mr-2"></i> Add New
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4">{col.header}</th>
              ))}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                      {col.accessor(item)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                       {/* Print Button if item looks like an entry */}
                       {(item as any).challanNumber && (
                        <button 
                          onClick={() => handlePrint(item)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          title="Print Challan"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                       )}

                      {onEdit && (
                        <button 
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <i className="far fa-folder-open text-3xl mb-3 opacity-50"></i>
                    <p>No records found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-end">
        Showing {filteredData.length} records
      </div>
    </div>
  );
};

export default DataTable;
