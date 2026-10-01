import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { Lead, LeadStage } from '../../types';
import { Clock, Phone } from 'lucide-react';

const STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Site Visit', 'Negotiation', 'Won', 'Lost'];

export const DashboardPipeline: React.FC = () => {
  const { user } = useOutletContext<any>();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, 'leads'), 
        where('agent_id', '==', auth.currentUser.uid),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;
    
    // Update local state immediately for snappy UI
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: targetStage } : l));
    
    try {
      await updateDoc(doc(db, 'leads', leadId), { stage: targetStage });
    } catch(err) {
      console.error(err);
      fetchLeads(); // revert on fail
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  };

  const daysSince = (timestamp: number) => {
      const diff = Date.now() - timestamp;
      return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="text-gray-400 p-8">Loading pipeline...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Pipeline</h1>
        <p className="text-gray-400 mt-1">Drag and drop leads to update their stage.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 snap-x">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage);
          const stageValue = stageLeads.reduce((acc, curr) => acc + (curr.budget_min || 0), 0);
          
          return (
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 bg-[#051611] border border-teal-900/50 rounded-xl flex flex-col snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="p-4 border-b border-teal-900/50 flex justify-between items-center sticky top-0 bg-[#051611] rounded-t-xl z-10">
                <div className="font-bold text-gray-200">{stage} <span className="ml-2 text-xs font-semibold bg-teal-900/40 text-teal-300 px-2 py-0.5 rounded-full">{stageLeads.length}</span></div>
                {stageValue > 0 && <div className="text-xs text-amber-400 font-bold">{formatCurrency(stageValue)}</div>}
              </div>
              
              <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[150px]">
                {stageLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                    className="bg-black/40 border border-teal-800/40 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-amber-400/50 transition-colors shadow-lg"
                  >
                    <div className="font-bold text-white mb-1">{lead.name}</div>
                    <div className="text-xs text-gray-400 mb-3 flex items-center gap-1"><Phone className="w-3 h-3"/> {lead.phone}</div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-xs font-semibold text-teal-300 bg-teal-900/30 px-2 py-1 rounded">
                        Score: {lead.score || 0}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {daysSince(lead.last_contacted_at || lead.created_at)}d ago
                      </div>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                   <div className="h-full flex items-center justify-center text-gray-500 text-sm italic opacity-50 pointer-events-none">
                       Drop here
                   </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
