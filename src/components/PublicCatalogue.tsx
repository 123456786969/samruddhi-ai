import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { Building2, Sparkles, MapPin, Bed, Maximize, Phone, User, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dispatchAutomatedWhatsApp } from '../services/whatsappService';

export const PublicCatalogue: React.FC = () => {
  const { slug } = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterLocality, setFilterLocality] = useState('');
  const [filterBhk, setFilterBhk] = useState('');
  const [filterMaxBudget, setFilterMaxBudget] = useState('');

  // Visit Modal
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchAgentAndProperties();
  }, [slug]);

  const fetchAgentAndProperties = async () => {
    try {
      setLoading(true);
      setError('');
      const rawSlug = slug || '';
      // Decode in case of URL encoding, then trim and remove trailing slashes
      const cleanSlug = decodeURIComponent(rawSlug).trim().replace(/\/+$/, '');
      
      // 1. Find Agent by slug from public_profiles
      const profilesQ = query(collection(db, 'public_profiles'), where('slug', '==', cleanSlug), limit(1));
      const profilesSnap = await getDocs(profilesQ);
      
      if (profilesSnap.empty) {
        setError("Agent not found");
        setLoading(false);
        return;
      }
      
      const agentData = { id: profilesSnap.docs[0].id, ...profilesSnap.docs[0].data() };
      setAgent(agentData);

      // 2. Fetch properties for this agent
      const propsQ = query(
        collection(db, 'properties'), 
        where('agent_id', '==', agentData.id),
        where('is_active', '==', true)
      );
      const propsSnap = await getDocs(propsQ);
      const propsData = propsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propsData);

    } catch (err) {
      console.error(err);
      setError("Failed to load catalogue");
    } finally {
      setLoading(false);
    }
  };

  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !selectedProperty || !leadName || !leadPhone) return;

    try {
      // Call public endpoint to record lead and visit securely on server
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          name: leadName.trim(),
          phone: leadPhone.trim(),
          property_id: selectedProperty.id,
          property_title: selectedProperty.title,
          requested_time: visitTime,
        }),
      });

      const leadData = await res.json();
      const leadId = leadData?.leadId;

      // Dispatch automated WhatsApp confirmation & brochure only if automation not paused
      if (leadId && !leadData?.automation_paused) {
        try {
          await dispatchAutomatedWhatsApp({
            agentId: agent.id,
            leadId,
            leadName,
            leadPhone,
            agentName: agent.name || 'Property Advisor',
            businessName: agent.businessName || 'Samruddhi Realty',
            agentSlug: agent.slug || '',
            propertyType: selectedProperty.title || 'Luxury Residence',
            preferredLocation: selectedProperty.location || agent.primaryCity || 'Prime Metro Hubs',
            triggerType: 'new_lead_instant',
          });
        } catch (waErr) {
          console.warn('Could not dispatch automated WhatsApp on visit booking:', waErr);
        }
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowVisitModal(false);
        setBookingSuccess(false);
        setLeadName('');
        setLeadPhone('');
        setVisitTime('');
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  };

  const filteredProperties = properties.filter(p => {
    if (filterLocality && !p.location?.toLowerCase().includes(filterLocality.toLowerCase())) return false;
    if (filterBhk && p.bedrooms !== Number(filterBhk)) return false;
    if (filterMaxBudget && p.price > Number(filterMaxBudget)) return false;
    return true;
  });

  if (loading) {
    return <div className="min-h-screen bg-[#020b08] flex items-center justify-center text-teal-400">Loading catalogue...</div>;
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-[#020b08] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 bg-teal-900/30 rounded-full flex items-center justify-center mb-6">
          <Building2 className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Catalogue Not Found</h1>
        <p className="text-gray-400 mb-2">We couldn't find an agent matching this link.</p>
        <p className="text-gray-500 text-sm mb-8">Please check if the URL is typed correctly.</p>
        <Link to="/" className="bg-teal-900 text-teal-100 px-6 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020b08] text-gray-100 font-sans selection:bg-amber-400 selection:text-gray-950 relative">
      {/* Header */}
      <nav className="border-b border-teal-900/50 bg-[#051611]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
              <Building2 className="w-7 h-7 text-gray-950" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">{agent.businessName || agent.name}</h1>
              <p className="text-xs text-teal-400 font-bold tracking-widest uppercase">Property Catalogue</p>
            </div>
          </div>
          <a href={`tel:${agent.phone || ''}`} className="hidden sm:flex items-center gap-2 bg-teal-900/40 border border-teal-800/50 px-4 py-2 rounded-full text-sm font-bold text-teal-100 hover:text-white transition-colors">
            <Phone className="w-4 h-4" />
            Contact Agent
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filters */}
        <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-4 sm:p-6 mb-8 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Locality</label>
            <input 
              type="text" 
              placeholder="e.g. Bandra" 
              value={filterLocality}
              onChange={e => setFilterLocality(e.target.value)}
              className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">BHK</label>
            <select 
              value={filterBhk}
              onChange={e => setFilterBhk(e.target.value)}
              className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">Any</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Max Budget (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 15000000" 
              value={filterMaxBudget}
              onChange={e => setFilterMaxBudget(e.target.value)}
              className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400" 
            />
          </div>
        </div>

        {/* Results */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-20 bg-[#051611]/50 border border-teal-900/30 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-2">No properties found</h3>
            <p className="text-gray-400">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map(prop => (
              <div key={prop.id} className="bg-[#051611] border border-teal-900/50 rounded-2xl overflow-hidden group hover:border-teal-500/50 transition-all flex flex-col">
                <div className="h-56 relative bg-black/40 overflow-hidden">
                  {prop.photos && prop.photos.length > 0 ? (
                    <img src={prop.photos[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-900">
                      <Building2 className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{prop.title}</h3>
                    <p className="text-sm font-semibold text-teal-300 drop-shadow flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {prop.location}
                    </p>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-teal-900/30">
                    <div className="font-black text-2xl text-amber-400">
                      {formatCurrency(prop.price)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-300 mb-4 bg-black/20 p-3 rounded-xl border border-teal-900/30">
                    <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-teal-500" /> {prop.bedrooms} BHK</span>
                    <span className="w-px h-4 bg-teal-900/50"></span>
                    <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4 text-teal-500" /> {prop.area_sqft} sqft</span>
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                    {prop.short_description}
                  </p>

                  <button 
                    onClick={() => { setSelectedProperty(prop); setShowVisitModal(true); }}
                    className="w-full bg-white hover:bg-gray-100 text-gray-950 font-bold py-3 rounded-xl transition-colors shadow-lg"
                  >
                    Request Site Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Book Visit Modal */}
      <AnimatePresence>
        {showVisitModal && selectedProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowVisitModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#051611] border border-teal-900/50 shadow-2xl rounded-2xl overflow-hidden p-6 sm:p-8"
            >
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Request Sent!</h3>
                  <p className="text-gray-400">The agent has been notified and will contact you shortly to confirm the site visit.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-1">Book a Site Visit</h3>
                  <p className="text-sm text-amber-400 font-semibold mb-6">{selectedProperty.title}</p>
                  
                  <form onSubmit={handleBookVisit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" required value={leadName} onChange={e => setLeadName(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-amber-400 focus:outline-none" placeholder="John Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="tel" required value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-amber-400 focus:outline-none" placeholder="+91 99999 99999" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Preferred Time</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={visitTime} onChange={e => setVisitTime(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g. Tomorrow morning, Weekend" />
                      </div>
                    </div>
                    <button type="submit" className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold py-3 px-4 rounded-xl transition-colors">
                      Send Request
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
