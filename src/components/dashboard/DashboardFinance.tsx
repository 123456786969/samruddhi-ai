import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { safeFormatDate } from '../../utils';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { Deal, Expense } from '../../types';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { PropertyGrowthRoiVisualizer } from './PropertyGrowthRoiVisualizer';

export const DashboardFinance: React.FC = () => {
  const { user } = useOutletContext<any>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Marketing');
  const [expenseDesc, setExpenseDesc] = useState('');

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchFinanceData();
  }, [user]);

  const fetchFinanceData = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      const dealsQ = query(collection(db, 'deals'), where('agent_id', '==', uid), where('stage', '==', 'Won'));
      const expensesQ = query(collection(db, 'expenses'), where('agent_id', '==', uid), orderBy('date', 'desc'));
      
      const [dealsSnap, expensesSnap] = await Promise.all([getDocs(dealsQ), getDocs(expensesQ)]);
      
      setDeals(dealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[]);
      setExpenses(expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseAmount || !expenseCategory) return;
      try {
          await addDoc(collection(db, 'expenses'), {
              agent_id: user.uid,
              amount: Number(expenseAmount),
              category: expenseCategory,
              description: expenseDesc,
              date: Date.now()
          });
          setShowExpenseForm(false);
          setExpenseAmount('');
          setExpenseDesc('');
          fetchFinanceData();
      } catch (err) {
          console.error(err);
      }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  };

  if (loading) return <div className="text-gray-400 p-8">Loading finance data...</div>;

  const totalRevenue = deals.reduce((sum, d) => sum + d.value, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const roi = totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : (totalRevenue > 0 ? 100 : 0);

  // Chart Data preparation (Simple month grouping)
  const chartDataMap: Record<string, { name: string, revenue: number, expenses: number }> = {};
  
  deals.forEach(d => {
      if (!d.closed_at) return;
      const date = new Date(d.closed_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!chartDataMap[key]) chartDataMap[key] = { name: key, revenue: 0, expenses: 0 };
      chartDataMap[key].revenue += d.value;
  });

  expenses.forEach(e => {
      const date = new Date(e.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!chartDataMap[key]) chartDataMap[key] = { name: key, revenue: 0, expenses: 0 };
      chartDataMap[key].expenses += e.amount;
  });

  const chartData = Object.values(chartDataMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">Finance & ROI</h1>
            <p className="text-gray-400 mt-1">Track your commissions and marketing spend.</p>
        </div>
        <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
        >
            <Plus className="w-5 h-5" />
            Add Expense
        </button>
      </div>

      {showExpenseForm && (
        <div className="mb-8 bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Log Expense</h2>
            <button onClick={() => setShowExpenseForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
                    <input type="number" required value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select required value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white">
                        <option>Marketing</option>
                        <option>Software</option>
                        <option>Travel</option>
                        <option>Office</option>
                        <option>Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <input type="text" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
                  </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
                  Save Expense
                </button>
              </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded-xl"><TrendingUp className="w-6 h-6"/></div>
              </div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-3xl font-black text-white">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-900/40 text-red-400 rounded-xl"><TrendingDown className="w-6 h-6"/></div>
              </div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Expenses</p>
              <p className="text-3xl font-black text-white">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-400/20 text-amber-400 rounded-xl"><DollarSign className="w-6 h-6"/></div>
              </div>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">ROI</p>
              <p className="text-3xl font-black text-amber-400">{roi.toFixed(1)}%</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Revenue vs Expenses</h2>
              <div className="h-80">
                  {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.2} vertical={false} />
                              <XAxis dataKey="name" stroke="#9ca3af" />
                              <YAxis stroke="#9ca3af" tickFormatter={(v) => `₹${v/1000}k`} />
                              <RechartsTooltip contentStyle={{ backgroundColor: '#020b08', borderColor: '#0f766e', borderRadius: '8px' }} />
                              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">No financial data available yet.</div>
                  )}
              </div>
          </div>

          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6">Recent Expenses</h2>
              <div className="flex-1 overflow-y-auto">
                  {expenses.length === 0 ? (
                      <div className="text-gray-500 text-sm italic">No expenses logged.</div>
                  ) : (
                      <div className="space-y-4">
                          {expenses.slice(0, 10).map(exp => (
                              <div key={exp.id} className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-teal-900/30">
                                  <div>
                                      <p className="font-semibold text-white">{exp.category}</p>
                                      <p className="text-xs text-gray-500">{safeFormatDate(exp.date)} - {exp.description}</p>
                                  </div>
                                  <span className="font-bold text-red-400">-{formatCurrency(exp.amount)}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Property Investment ROI & Long-term Growth Visualizer */}
      <div className="pt-4">
        <PropertyGrowthRoiVisualizer />
      </div>
    </div>
  );
};
