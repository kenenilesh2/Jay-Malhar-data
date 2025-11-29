
import React, { useState, useEffect } from 'react';
import { SupplierPayment } from '../types';
import { SUPPLIERS_LIST } from '../constants';

interface PaymentFormProps {
  currentUser: string;
  initialData?: SupplierPayment;
  onSubmit: (payment: any) => Promise<void>;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ currentUser, initialData, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    amount: '',
    paymentMode: 'Bank Transfer',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      const isPredefined = SUPPLIERS_LIST.includes(initialData.supplierName);
      setFormData({
        date: initialData.date,
        supplierName: initialData.supplierName,
        amount: String(initialData.amount),
        paymentMode: initialData.paymentMode,
        notes: initialData.notes || '',
      });
      setIsCustomSupplier(!isPredefined && !!initialData.supplierName);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsCustomSupplier(true);
      setFormData(prev => ({ ...prev, supplierName: '' }));
    } else {
      setIsCustomSupplier(false);
      setFormData(prev => ({ ...prev, supplierName: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        id: initialData?.id,
        date: formData.date,
        supplierName: formData.supplierName,
        amount: parseFloat(formData.amount),
        paymentMode: formData.paymentMode,
        notes: formData.notes,
        createdBy: initialData ? initialData.createdBy : currentUser
      });
    } catch (err) {
      console.error("Payment Save Error:", JSON.stringify(err, null, 2));
      alert('Failed to save payment. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">
          {initialData ? 'Edit Payment' : 'Record Payment'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
            {!isCustomSupplier ? (
              <select
                name="supplierNameSelect"
                required
                value={formData.supplierName && !isCustomSupplier ? formData.supplierName : (formData.supplierName ? '' : '')}
                onChange={handleSupplierSelect}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              >
                <option value="">-- Select Supplier --</option>
                {SUPPLIERS_LIST.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="OTHER">Other / New Supplier</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="supplierName"
                  required
                  placeholder="Enter supplier name"
                  value={formData.supplierName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => { setIsCustomSupplier(false); setFormData(p => ({...p, supplierName: ''})); }}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                  title="Back to list"
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              step="1"
              min="0"
              required
              placeholder="0"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Additional details..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
            />
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
            {initialData ? 'Update Payment' : 'Save Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
