import React, { useState } from 'react';

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
}

const DataTable = <T extends { id: string }>({ 
  title, 
  data, 
  columns, 
  onAddClick,
  filterValue,
  onClearFilter
}: DataTableProps<T>) => {
  const [search, setSearch] = useState('');

  // Simple client-side search across all stringified values
  const filteredData = data.filter(item => {
    // If external filter provided (e.g. from Dashboard click)
    if (filterValue) {
       // Assuming 'material' is the key we filter on for entries. 
       // This is a bit specific, but works for the use case.
       const mat = (item as any).material; 
       if (mat && mat !== filterValue) return false;
    }

    const rowString = Object.values(item).join(' ').toLowerCase();
    return rowString.includes(search.toLowerCase());
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
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
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <i className="fas fa-search absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <button 
            onClick={onAddClick}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center"
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
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
