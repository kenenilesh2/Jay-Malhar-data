
import React, { useState, useEffect, useMemo } from 'react';
import { MaterialType, MaterialEntry } from '../types';
import { MATERIALS_LIST, UNITS, SITE_NAME, PREDEFINED_VEHICLES, PHASES_LIST } from '../constants';
import { generateChallanNumber } from '../services/utils';
import { generateChallanPDF } from '../services/pdfService';

interface EntryFormProps {
  currentUser: string;
  initialData?: MaterialEntry;
  onSubmit: (entry: any) => Promise<void>;
  onCancel: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ currentUser, initialData, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [isCustomVehicle, setIsCustomVehicle] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    challanNumber: '',
    material: MATERIALS_LIST[0],
    quantity: '',
    vehicleNumber: '',
    phase: '', // Added Phase state
  });

  useEffect(() => {
    if (initialData) {
      const isPredefined = PREDEFINED_VEHICLES.some(v => v.number === initialData.vehicleNumber);
      setFormData({
        date: initialData.date,
        challanNumber: initialData.challanNumber,
        material: initialData.material,
        quantity: String(initialData.quantity),
        vehicleNumber: initialData.vehicleNumber || '',
        phase: initialData.phase || '', // Load Phase if editing
      });
      setIsCustomVehicle(!isPredefined && !!initialData.vehicleNumber);
    } else {
      generateChallanNumber().then(num => {
        setFormData(prev => ({ ...prev, challanNumber: num }));
      });
    }
  }, [initialData]);

  const availableVehicles = useMemo(() => {
    return PREDEFINED_VEHICLES.filter(v => v.materials.includes(formData.material as MaterialType));
  }, [formData.material]);

  useEffect(() => {
    if (!initialData && !isCustomVehicle && formData.vehicleNumber) {
        const isValid = availableVehicles.some(v => v.number === formData.vehicleNumber);
        if (!isValid) {
            setFormData(prev => ({ ...prev, vehicleNumber: '', quantity: '' }));
        }
    }
  }, [formData.material, availableVehicles, initialData, isCustomVehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsCustomVehicle(true);
      setFormData(prev => ({ ...prev, vehicleNumber: '' }));
    } else {
      setIsCustomVehicle(false);
      const vehicle = PREDEFINED_VEHICLES.find(v => v.number === val);
      const currentUnit = UNITS[formData.material];
      setFormData(prev => ({ 
        ...prev, 
        vehicleNumber: val,
        quantity: (vehicle && currentUnit === 'Brass') ? String(vehicle.capacity) : prev.quantity
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        id: initialData?.id,
        date: formData.date,
        challanNumber: formData.challanNumber,
        material: formData.material,
        quantity: parseFloat(formData.quantity),
        unit: UNITS[formData.material],
        vehicleNumber: formData.vehicleNumber,
        siteName: SITE_NAME,
        phase: formData.phase, // Pass phase
        createdBy: initialData ? initialData.createdBy : currentUser
      });
    } catch (err) {
      console.error("Entry Save Error:", JSON.stringify(err, null, 2));
      alert('Failed to save entry. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">
          {initialData ? 'Edit Material Entry' : 'New Material Entry'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Challan Number *</label>
            <input
              type="text"
              name="challanNumber"
              required
              placeholder="e.g. JME/2024/001"
              value={formData.challanNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Material *</label>
            <select
              name="material"
              required
              value={formData.material}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {MATERIALS_LIST.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phase (Optional)</label>
            <select
              name="phase"
              value={formData.phase}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">-- Select Phase --</option>
              {PHASES_LIST.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number *</label>
            {!isCustomVehicle ? (
              <select
                required
                value={formData.vehicleNumber}
                onChange={handleVehicleSelect}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="">-- Select Vehicle --</option>
                {availableVehicles.map(v => (
                  <option key={v.number} value={v.number}>
                    {v.number} {UNITS[formData.material] === 'Brass' ? `(${v.capacity} Brass)` : ''}
                  </option>
                ))}
                <option value="OTHER">Other / Manual Entry</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="vehicleNumber"
                  required
                  placeholder="Enter custom vehicle no."
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <button 
                  type="button"
                  onClick={() => { setIsCustomVehicle(false); setFormData(p => ({...p, vehicleNumber: ''})); }}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                  title="Back to list"
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantity ({UNITS[formData.material]}) *
            </label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
           {initialData && (
             <button
              type="button"
              onClick={() => generateChallanPDF(initialData)}
              className="mr-auto px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              <i className="fas fa-print mr-2"></i> Print Challan
            </button>
          )}
          
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
            {initialData ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryForm;
