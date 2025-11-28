import React, { useState } from 'react';
import { ChequeEntry } from '../types';
import { uploadChequeFile } from '../services/dataService';
import DataTable from './DataTable';

interface ChequeManagerProps {
  currentUser: string;
  cheques: ChequeEntry[];
  onAddCheque: (cheque: any) => Promise<void>;
  onDeleteCheque: (id: string) => Promise<void>;
  isAdmin: boolean;
}

const ChequeManager: React.FC<ChequeManagerProps> = ({ currentUser, cheques, onAddCheque, onDeleteCheque, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    chequeNumber: '',
    bankName: '',
    amount: '',
    status: 'Pending' as const,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = '';
      if (selectedFile) {
        const url = await uploadChequeFile(selectedFile);
        if (url) fileUrl = url;
      }

      await onAddCheque({
        date: formData.date,
        partyName: formData.partyName,
        chequeNumber: formData.chequeNumber,
        bankName: formData.bankName,
        amount: parseFloat(formData.amount),
        status: formData.status,
        fileUrl: fileUrl,
        createdBy: currentUser
      });
      
      // Reset
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        partyName: '',
        chequeNumber: '',
        bankName: '',
        amount: '',
        status: 'Pending',
      });
      setSelectedFile(null);
    } catch (err: any) {
      alert(`Error saving cheque: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <DataTable<ChequeEntry>
          title="Cheque Details"
          data={cheques}
          columns={[
            { header: 'Date', accessor: (c) => new Date(c.date).toLocaleDateString() },
            { header: 'Party Name', accessor: (c) => c.partyName },
            { header: 'Cheque No', accessor: (c) => <span className="font-mono bg-slate-100 px-2 py-1 rounded">{c.chequeNumber}</span> },
            { header: 'Amount', accessor: (c) => <span className="font-bold">₹{c.amount.toLocaleString()}</span> },
            { header: 'Bank', accessor: (c) => c.bankName || '-' },
            { 
              header: 'Status', 
              accessor: (c) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  c.status === 'Cleared' ? 'bg-green-100 text-green-700' : 
                  c.status === 'Bounced' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {c.status}
                </span>
              ) 
            },
            {
              header: 'Attachment',
              accessor: (c) => c.fileUrl ? (
                <a 
                  href={c.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-800 underline text-sm"
                >
                  <i className="fas fa-paperclip mr-1"></i> View
                </a>
              ) : <span className="text-slate-400">-</span>
            }
          ]}
          onAddClick={() => setShowForm(true)}
          enableExport={true}
          enableDateFilter={true}
          onDelete={isAdmin ? (item) => onDeleteCheque(item.id) : undefined}
        />
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Add Cheque Details</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cheque Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter 6 digit no."
                  value={formData.chequeNumber}
                  onChange={e => setFormData({...formData, chequeNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Party / Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="Issued To / Received From"
                  value={formData.partyName}
                  onChange={e => setFormData({...formData, partyName: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC"
                  value={formData.bankName}
                  onChange={e => setFormData({...formData, bankName: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                 <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                 >
                   <option value="Pending">Pending</option>
                   <option value="Cleared">Cleared</option>
                   <option value="Bounced">Bounced</option>
                 </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Cheque Image / PDF
              </label>
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  {selectedFile ? selectedFile.name : 'Choose File'}
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png,.pdf" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
                {selectedFile && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Supported formats: JPG, PNG, PDF</p>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center"
              >
                {loading && <i className="fas fa-spinner fa-spin mr-2"></i>}
                Save Cheque
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChequeManager;