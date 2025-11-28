import React, { useState, useMemo } from 'react';
import { MaterialEntry, SupplierPayment, MaterialType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyzeBusinessData } from '../services/geminiService';

interface DashboardProps {
  entries: MaterialEntry[];
  payments: SupplierPayment[];
  onFilterRequest: (material?: MaterialType) => void;
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ entries, payments, onFilterRequest }) => {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // --- Metrics Calculation ---
  const totalEntries = entries.length;
  
  const totalPayments = useMemo(() => {
    return payments.reduce((acc, curr) => acc + curr.amount, 0);
  }, [payments]);

  // Group by material for Pie Chart
  const materialData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.material] = (counts[e.material] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value);
  }, [entries]);

  // Group payments by Month for Bar Chart
  const paymentsByMonth = useMemo(() => {
    const data: Record<string, number> = {};
    payments.forEach(p => {
      const date = new Date(p.date);
      const key = date.toLocaleString('default', { month: 'short' }); // e.g., "Oct"
      data[key] = (data[key] || 0) + p.amount;
    });
    // Create array and maybe sort by month index if needed, simplistic here
    return Object.keys(data).map(key => ({
      name: key,
      amount: data[key]
    }));
  }, [payments]);


  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setIsThinking(true);
    setAiResponse(null);
    try {
      const result = await analyzeBusinessData(entries, payments, aiQuery);
      setAiResponse(result);
    } catch (e) {
      setAiResponse("Error connecting to AI service.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Overview of site supply and financials</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm">
          <span className="text-slate-500">Site:</span> <span className="font-semibold text-brand-600">Arihant Aaradhya</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => onFilterRequest()}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Entries</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalEntries}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
              <i className="fas fa-file-invoice"></i>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">All material challans</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₹ {totalPayments.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <i className="fas fa-rupee-sign"></i>
            </div>
          </div>
           <p className="text-xs text-slate-400 mt-3">To all suppliers</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Top Material</p>
              <p className="text-lg font-bold text-slate-800 mt-1 truncate max-w-[120px]">
                {materialData[0]?.name || 'N/A'}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
              <i className="fas fa-cubes"></i>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{materialData[0]?.value || 0} Entries</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Recent Activity</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {entries.length > 0 ? new Date(entries[0].date).toLocaleDateString() : 'None'}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Last entry date</p>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <i className="fas fa-robot text-brand-400 text-xl"></i>
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Ask a question (e.g., 'How much washsand did we supply last month?' or 'Total payments to suppliers?')"
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
          />
          <button 
            onClick={handleAiAsk}
            disabled={isThinking || !aiQuery}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isThinking ? <i className="fas fa-spinner fa-spin"></i> : 'Analyze'}
          </button>
        </div>
        {aiResponse && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/10 text-slate-200 text-sm leading-relaxed animate-fade-in">
            {aiResponse}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Payments */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Payments Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Material Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Material Distribution</h3>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(_, index) => onFilterRequest(materialData[index].name as MaterialType)}
                  cursor="pointer"
                >
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
