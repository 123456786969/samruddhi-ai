import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Lead, Deal } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const DashboardReports: React.FC = () => {
  const { user } = useOutletContext<any>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      const leadQ = query(collection(db, 'leads'), where('agent_id', '==', uid));
      const dealQ = query(collection(db, 'deals'), where('agent_id', '==', uid));
      
      const [leadSnap, dealSnap] = await Promise.all([getDocs(leadQ), getDocs(dealQ)]);
      
      setLeads(leadSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[]);
      setDeals(dealSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading reports...</div>;

  // Funnel Data
  const stages = ['New', 'Contacted', 'Qualified', 'Site Visit', 'Negotiation', 'Won'];
  const funnelData = stages.map(stage => {
      let count = leads.filter(l => l.stage === stage).length;
      if (stage === 'Won') {
          count += leads.filter(l => l.stage === 'Won').length; // Ensure accurate count
      }
      return { stage, count };
  });
  
  // Calculate cumulative funnel dropoff
  let runningTotal = leads.length - leads.filter(l => l.stage === 'Lost').length; // only count non-lost
  const cumulativeFunnel = stages.map((stage, idx) => {
     // A proper CRM funnel tracks how many made it TO or PAST this stage, but for simplicity we'll just show current standing.
     return { stage, count: leads.filter(l => l.stage === stage).length };
  });

  // Source Data
  const sourceMap: Record<string, number> = {};
  leads.forEach(l => {
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#f59e0b', '#0d9488', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Avg time to close
  const wonDeals = deals.filter(d => d.stage === 'Won' && d.closed_at);
  let avgDaysToClose = 0;
  if (wonDeals.length > 0) {
      const totalDays = wonDeals.reduce((sum, d) => sum + ((d.closed_at! - d.created_at) / (1000 * 60 * 60 * 24)), 0);
      avgDaysToClose = Math.round(totalDays / wonDeals.length);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 mt-1">Real-time insights into your pipeline health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Leads</p>
              <p className="text-4xl font-black text-white">{leads.length}</p>
          </div>
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Won Deals</p>
              <p className="text-4xl font-black text-amber-400">{wonDeals.length}</p>
          </div>
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Avg. Time to Close</p>
              <p className="text-4xl font-black text-teal-400">{avgDaysToClose} <span className="text-xl">days</span></p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Pipeline Stages */}
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Current Pipeline Standing</h2>
              <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cumulativeFunnel} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.2} horizontal={false} />
                          <XAxis type="number" stroke="#9ca3af" />
                          <YAxis dataKey="stage" type="category" stroke="#9ca3af" width={100} />
                          <RechartsTooltip cursor={{fill: 'rgba(13, 148, 136, 0.1)'}} contentStyle={{ backgroundColor: '#020b08', borderColor: '#0f766e', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Lead Sources */}
          <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Lead Sources</h2>
              {sourceData.length > 0 ? (
                  <div className="h-80 flex flex-col items-center">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={sourceData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={80}
                                  outerRadius={110}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {sourceData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{ backgroundColor: '#020b08', borderColor: '#0f766e', borderRadius: '8px' }} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                          {sourceData.map((entry, index) => (
                              <div key={entry.name} className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                  <span className="text-sm text-gray-300">{entry.name} ({entry.value})</span>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <p className="text-gray-500 text-center py-20">No source data available.</p>
              )}
          </div>
      </div>
    </div>
  );
};
