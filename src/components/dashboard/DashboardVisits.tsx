import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { safeFormatDate } from '../../utils';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { Calendar, Check, X, Clock, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { Visit, Task, Lead } from '../../types';

export const DashboardVisits: React.FC = () => {
  const { user } = useOutletContext<any>();
  const navigate = useNavigate();
  
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchSchedule();
  }, [user]);

  const fetchSchedule = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      
      const visitsQ = query(collection(db, 'visits'), where('agent_id', '==', uid));
      const tasksQ = query(collection(db, 'tasks'), where('agent_id', '==', uid));
      
      const [visitsSnap, tasksSnap] = await Promise.all([getDocs(visitsQ), getDocs(tasksQ)]);
      
      const visitsData = await Promise.all(visitsSnap.docs.map(async (docSnap) => {
          const v = { id: docSnap.id, type: 'visit', ...docSnap.data() } as any;
          if (v.lead_id) {
              const leadSnap = await getDoc(doc(db, 'leads', v.lead_id));
              if (leadSnap.exists()) v.lead = leadSnap.data();
          }
          v.sortTime = v.requested_time;
          return v;
      }));

      const tasksData = await Promise.all(tasksSnap.docs.map(async (docSnap) => {
          const t = { id: docSnap.id, type: 'task', ...docSnap.data() } as any;
          if (t.lead_id) {
              const leadSnap = await getDoc(doc(db, 'leads', t.lead_id));
              if (leadSnap.exists()) t.lead = leadSnap.data();
          }
          t.sortTime = t.due_date;
          return t;
      }));

      const combined = [...visitsData, ...tasksData];
      combined.sort((a, b) => a.sortTime - b.sortTime);
      
      setScheduleItems(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisitStatus = async (id: string, newStatus: string, leadId?: string) => {
    try {
      await updateDoc(doc(db, 'visits', id), { status: newStatus });
      setScheduleItems(prev => prev.map(v => v.id === id && v.type === 'visit' ? { ...v, status: newStatus } : v));
      
      if (leadId && newStatus === 'done') {
        await updateDoc(doc(db, 'leads', leadId), { stage: 'Site Visit' }); // Update to Site Visit stage
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (item: any) => {
      try {
        const newStatus = item.status === 'pending' ? 'done' : 'pending';
        await updateDoc(doc(db, 'tasks', item.id), { status: newStatus });
        setScheduleItems(prev => prev.map(t => t.id === item.id && t.type === 'task' ? { ...t, status: newStatus } : t));
      } catch (err) { console.error(err); }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-400/20 text-amber-400 border-amber-400/30';
      case 'confirmed': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'done': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

  const now = Date.now();
  const upcoming = scheduleItems.filter(i => 
      (i.type === 'visit' && i.status !== 'done' && i.status !== 'declined') ||
      (i.type === 'task' && i.status !== 'done')
  );
  
  const past = scheduleItems.filter(i => 
      (i.type === 'visit' && (i.status === 'done' || i.status === 'declined')) ||
      (i.type === 'task' && i.status === 'done')
  ).sort((a,b) => b.sortTime - a.sortTime); // newest past first

  const renderItem = (item: any) => {
      const isPast = item.sortTime < now && (item.status === 'pending' || item.status === 'confirmed');
      const timeStr = safeFormatDate(item.sortTime, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      if (item.type === 'visit') {
          return (
              <div key={`visit-${item.id}`} className="bg-[#051611] border border-teal-900/50 rounded-xl p-5 hover:border-teal-700/80 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="bg-teal-900/40 p-1.5 rounded-lg text-teal-400"><Calendar className="w-4 h-4"/></div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              Site Visit: {item.lead?.name || 'Unknown Lead'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                              {item.status}
                          </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400 ml-10">
                          <span className={`flex items-center gap-1 ${isPast && item.status !== 'done' ? 'text-red-400' : ''}`}><Clock className="w-3.5 h-3.5" /> {timeStr}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {item.lead?.phone || 'No phone'}</span>
                          {item.property_title && (
                              <span className="flex items-center gap-1 text-teal-300"><MapPin className="w-3.5 h-3.5" /> {item.property_title}</span>
                          )}
                      </div>
                  </div>
                  
                  <div className="flex gap-2">
                      {item.status === 'pending' && (
                          <>
                              <button onClick={() => handleUpdateVisitStatus(item.id, 'confirmed', item.lead_id)} className="px-4 py-2 bg-teal-900/40 hover:bg-teal-900/60 text-teal-300 border border-teal-800/50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                                  <Check className="w-4 h-4" /> Confirm
                              </button>
                              <button onClick={() => handleUpdateVisitStatus(item.id, 'declined', item.lead_id)} className="px-4 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                                  <X className="w-4 h-4" /> Decline
                              </button>
                          </>
                      )}
                      {item.status === 'confirmed' && (
                          <button onClick={() => handleUpdateVisitStatus(item.id, 'done', item.lead_id)} className="px-4 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                              <Check className="w-4 h-4" /> Mark as Done
                          </button>
                      )}
                      <button onClick={() => navigate(`/dashboard/leads/${item.lead_id}`)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors">Open Lead</button>
                  </div>
              </div>
          );
      } else {
          // Task
          return (
              <div key={`task-${item.id}`} className={`bg-[#051611] border border-teal-900/50 rounded-xl p-5 hover:border-teal-700/80 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6 ${item.status === 'done' ? 'opacity-60' : ''}`}>
                  <div className="flex-1 flex gap-4 items-start">
                      <button onClick={() => handleToggleTask(item)} className="mt-1 shrink-0 text-white">
                          {item.status === 'done' ? (
                              <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center"><Check className="w-4 h-4" /></div>
                          ) : (
                              <div className="w-6 h-6 rounded border border-teal-700 hover:border-amber-400 flex items-center justify-center"></div>
                          )}
                      </button>
                      <div>
                          <div className={`flex items-center gap-3 mb-2 ${item.status === 'done' ? 'line-through' : ''}`}>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                  Task: {item.title}
                              </h3>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <span className={`flex items-center gap-1 ${isPast && item.status !== 'done' ? 'text-red-400 font-bold' : ''}`}><Clock className="w-3.5 h-3.5" /> Due: {timeStr}</span>
                              {item.lead && (
                                  <>
                                      <span className="flex items-center gap-1 text-teal-300">For: {item.lead.name}</span>
                                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {item.lead.phone}</span>
                                  </>
                              )}
                          </div>
                      </div>
                  </div>
                  {item.lead_id && (
                      <button onClick={() => navigate(`/dashboard/leads/${item.lead_id}`)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors shrink-0">Open Lead</button>
                  )}
              </div>
          );
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Calendar & Visits</h1>
        <p className="text-gray-400 mt-1">Combined view of your upcoming site visits and follow-up tasks.</p>
      </div>

      {loading ? (
        <div className="text-gray-400 py-8">Loading schedule...</div>
      ) : (
        <>
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-teal-400 border-b border-teal-900/50 pb-2">Upcoming Schedule</h2>
                {upcoming.length === 0 ? (
                    <div className="text-gray-500 py-4 italic">No upcoming visits or pending tasks.</div>
                ) : (
                    <div className="grid gap-4">
                        {upcoming.map(renderItem)}
                    </div>
                )}
            </div>

            <div className="space-y-4 pt-8">
                <h2 className="text-xl font-bold text-gray-500 border-b border-gray-800 pb-2">Past & Completed</h2>
                {past.length === 0 ? (
                    <div className="text-gray-600 py-4 italic">No past history found.</div>
                ) : (
                    <div className="grid gap-4">
                        {past.map(renderItem)}
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
};
