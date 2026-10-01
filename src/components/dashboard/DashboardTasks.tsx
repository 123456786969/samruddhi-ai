import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { safeFormatDate } from '../../utils';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Task, Lead } from '../../types';
import { Check, Clock, Plus, X, User } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

export const DashboardTasks: React.FC = () => {
  const { user } = useOutletContext<any>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(searchParams.get('new') === 'true');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [leadId, setLeadId] = useState(searchParams.get('leadId') || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchTasksAndLeads();
  }, [user]);

  const fetchTasksAndLeads = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      // Fetch Tasks
      const q = query(
        collection(db, 'tasks'), 
        where('agent_id', '==', uid)
      );
      const snap = await getDocs(q);
      const tasksList = (snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[])
        .sort((a, b) => (Number(a.due_date) || 0) - (Number(b.due_date) || 0));
      setTasks(tasksList);

      // Fetch Leads (for dropdown)
      const leadQ = query(collection(db, 'leads'), where('agent_id', '==', uid));
      const leadSnap = await getDocs(leadQ);
      setLeads(leadSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    setSubmitting(true);
    try {
      const newTask = {
        agent_id: user.uid,
        title,
        due_date: new Date(dueDate).getTime(),
        lead_id: leadId || null,
        status: 'pending',
        created_at: Date.now()
      };
      await addDoc(collection(db, 'tasks'), newTask);
      setShowAddForm(false);
      setTitle(''); setDueDate(''); setLeadId('');
      fetchTasksAndLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 mt-1">Stay on top of your follow-ups.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">New Task</h2>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">What needs to be done?</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Follow up on site visit" className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Related Lead (Optional)</label>
                <select value={leadId} onChange={e => setLeadId(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white">
                  <option value="">No specific lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
          {loading ? (
              <p className="text-gray-500 text-center py-8">Loading tasks...</p>
          ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                  <Check className="w-12 h-12 text-teal-900 mx-auto mb-4" />
                  <p className="text-gray-400">You have no tasks.</p>
              </div>
          ) : (
              <div className="space-y-2">
                  {tasks.map(task => (
                      <div key={task.id} className="flex gap-4 items-center bg-black/30 p-4 rounded-xl border border-teal-900/30 hover:border-teal-700/50 transition-colors">
                          <button onClick={() => handleToggleTask(task)} className="shrink-0 text-white">
                                {task.status === 'done' ? (
                                    <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center"><Check className="w-4 h-4" /></div>
                                ) : (
                                    <div className="w-6 h-6 rounded border border-teal-700 hover:border-amber-400 flex items-center justify-center"></div>
                                )}
                          </button>
                          <div className={`flex-1 ${task.status === 'done' ? 'opacity-50 line-through' : ''}`}>
                              <p className="font-semibold text-white">{task.title}</p>
                              <div className="flex gap-4 mt-1 text-xs font-medium">
                                  <span className={`flex items-center gap-1 ${task.due_date < Date.now() && task.status !== 'done' ? 'text-red-400' : 'text-amber-400'}`}>
                                      <Clock className="w-3.5 h-3.5" /> 
                                      {safeFormatDate(task.due_date)}
                                  </span>
                                  {task.lead_id && (
                                      <button onClick={() => navigate(`/dashboard/leads/${task.lead_id}`)} className="text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer">
                                          <User className="w-3.5 h-3.5" /> View Lead
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
