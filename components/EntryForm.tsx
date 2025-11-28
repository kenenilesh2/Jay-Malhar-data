import React, { useState } from 'react';
import { MaterialType, MaterialEntry } from '../types';
import { MATERIALS_LIST, UNITS, SITE_NAME } from '../constants';

interface EntryFormProps {
  currentUser: string;
  onSubmit: (entry: Omit<MaterialEntry, 'id' | 'timestamp'>) => Promise<void>;
  onCancel: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ currentUser, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    challanNumber: '',
    material: MATERIALS_LIST[0],
    quantity: '',
    vehicleNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        date: formData.date,
        challanNumber: formData.challanNumber,
        material: formData.material,
        quantity: parseFloat(formData.quantity),
        unit: UNITS[formData.material],
        vehicleNumber: formData.vehicleNumber,
        siteName: SITE_NAME,
        createdBy: currentUser
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">New Material Entry</h3>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Challan Number</label>
            <input
              type="text"
              name="challanNumber"
              required
              placeholder="e.g. CH-1024"
              value={formData.challanNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          >
            {MATERIALS_LIST.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantity ({UNITS[formData.material]})
            </label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              required
              placeholder="0.00"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              placeholder="MH-XX-XXXX"
              value={formData.vehicleNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            />
          </div>
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
            className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
            Save Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryForm;
