import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Plus, X, Image as ImageIcon, MapPin, Bed, Maximize, CheckCircle2, Trash2, Link as LinkIcon, Building, Users, TrendingUp } from 'lucide-react';
import { PropertyGrowthRoiVisualizer } from './PropertyGrowthRoiVisualizer';

export const DashboardProperties: React.FC = () => {
  const { user, userData } = useOutletContext<any>();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [analyzingProperty, setAnalyzingProperty] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [area, setArea] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [unitsSold, setUnitsSold] = useState('');
  const [unitsReserved, setUnitsReserved] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    fetchPropertiesAndLeads();
  }, [user]);

  const fetchPropertiesAndLeads = async () => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      const propsQ = query(collection(db, 'properties'), where('agent_id', '==', uid));
      const leadsQ = query(collection(db, 'leads'), where('agent_id', '==', uid));
      
      const [propsSnap, leadsSnap] = await Promise.all([getDocs(propsQ), getDocs(leadsQ)]);
      
      const data = propsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by created_at desc manually if we don't have index
      data.sort((a: any, b: any) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
      setProperties(data);
      
      setLeads(leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;
    
    setSubmitting(true);
    try {
      const newProp = {
        agent_id: user.uid,
        title,
        location,
        price: Number(price),
        bedrooms: Number(bedrooms),
        area_sqft: Number(area),
        short_description: shortDesc,
        total_units: Number(totalUnits) || 0,
        units_sold: Number(unitsSold) || 0,
        units_reserved: Number(unitsReserved) || 0,
        photos: photoDataUrl ? [photoDataUrl] : [],
        is_active: true,
        created_at: serverTimestamp()
      };
      
      await addDoc(collection(db, 'properties'), newProp);
      setShowAddForm(false);
      resetForm();
      fetchPropertiesAndLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setLocation(''); setPrice(''); setBedrooms(''); setArea('');
    setShortDesc(''); setTotalUnits(''); setUnitsSold(''); setUnitsReserved('');
    setPhotoDataUrl('');
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'properties', id), { is_active: !currentStatus });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    setPropertyToDelete(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'properties', id));
      setProperties(prev => prev.filter(p => p.id !== id));
      setPropertyToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);
  };

  // Helper to find matching leads for a property
  const getMatchingLeadsCount = (prop: any) => {
      let matches = 0;
      for (const lead of leads) {
          if (lead.stage === 'Won' || lead.stage === 'Lost') continue;
          
          let locationMatch = true;
          if (lead.preferred_location && prop.location) {
              locationMatch = prop.location.toLowerCase().includes(lead.preferred_location.toLowerCase()) || 
                              lead.preferred_location.toLowerCase().includes(prop.location.toLowerCase());
          }
          
          let budgetMatch = true;
          if (lead.budget_max && prop.price > lead.budget_max) budgetMatch = false;
          if (lead.budget_min && prop.price < lead.budget_min) budgetMatch = false;
          
          if (locationMatch && budgetMatch) {
              matches++;
          }
      }
      return matches;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Properties</h1>
          <p className="text-gray-400 mt-1">Manage listings and monitor inventory availability.</p>
        </div>
        <div className="flex gap-3">
          {userData?.slug && (
            <a 
              href={`/properties/${userData.slug}`} 
              target="_blank"
              rel="noreferrer"
              className="bg-[#051611] border border-teal-900/50 hover:bg-teal-900/40 text-teal-300 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              View Catalogue
            </a>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-8 bg-[#051611] border border-teal-900/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">New Property Listing</h2>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddProperty} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Project / Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bedrooms (BHK)</label>
                <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Area (Sq.Ft)</label>
                <input type="number" value={area} onChange={e => setArea(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Short Description</label>
              <textarea required value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Total Units</label>
                <input type="number" value={totalUnits} onChange={e => setTotalUnits(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Units Sold</label>
                <input type="number" value={unitsSold} onChange={e => setUnitsSold(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Units Reserved</label>
                <input type="number" value={unitsReserved} onChange={e => setUnitsReserved(e.target.value)} className="w-full bg-black/40 border border-teal-900/50 rounded-xl px-4 py-2.5 text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Primary Photo</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-teal-900/40 border border-teal-700/50 hover:bg-teal-900/60 text-white px-4 py-2 rounded-xl transition-colors text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Select Image
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {photoDataUrl && (
                  <div className="h-12 w-16 rounded overflow-hidden bg-black/50 border border-teal-900/50">
                    <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {submitting ? 'Publishing...' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 py-8">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="bg-[#051611] border border-teal-900/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No properties listed</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            List your properties here. Active properties will automatically appear in your public catalogue.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
          >
            Create your first listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map(prop => {
            const availableUnits = (prop.total_units || 0) - (prop.units_sold || 0) - (prop.units_reserved || 0);
            const matchesCount = getMatchingLeadsCount(prop);
            
            return (
            <div key={prop.id} className={`bg-[#051611] border ${prop.is_active ? 'border-teal-900/50' : 'border-gray-800'} rounded-2xl overflow-hidden transition-all flex flex-col relative`}>
              {matchesCount > 0 && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-amber-400 text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg cursor-pointer hover:bg-amber-300 transition-colors" onClick={() => navigate('/dashboard/leads')}>
                      <Users className="w-3.5 h-3.5" />
                      {matchesCount} Matching Lead{matchesCount !== 1 ? 's' : ''}
                  </div>
              )}
              <div className="h-48 relative bg-black/40">
                {prop.photos && prop.photos.length > 0 ? (
                  <img src={prop.photos[0]} alt={prop.title} className={`w-full h-full object-cover ${!prop.is_active && 'opacity-40 grayscale'}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-teal-900">
                    <ImageIcon className="w-12 h-12 opacity-50" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${prop.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-800/80 text-gray-400 border border-gray-700'}`}>
                    {prop.is_active ? 'Public' : 'Hidden'}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className={`text-xl font-bold ${prop.is_active ? 'text-white' : 'text-gray-500'}`}>{prop.title}</h3>
                  <div className={`font-black whitespace-nowrap ${prop.is_active ? 'text-amber-400' : 'text-gray-600'}`}>
                    {formatCurrency(prop.price)}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {prop.location}</span>
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {prop.bedrooms} BHK</span>
                  <span className="flex items-center gap-1"><Maximize className="w-4 h-4" /> {prop.area_sqft} sqft</span>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
                  {prop.short_description}
                </p>

                {prop.total_units > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
                      <span>{availableUnits} Available</span>
                      <span>{prop.units_sold} Sold</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                      <div className="bg-teal-600 h-full" style={{ width: `${(prop.units_sold / prop.total_units) * 100}%` }}></div>
                      <div className="bg-amber-500/50 h-full" style={{ width: `${(prop.units_reserved / prop.total_units) * 100}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-teal-900/30">
                  <button
                    onClick={() => setAnalyzingProperty(prop)}
                    className="flex-1 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    title="Calculate long-term investment returns and property appreciation"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Analyze ROI</span>
                  </button>
                  <button 
                    onClick={() => toggleActive(prop.id, prop.is_active)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      prop.is_active 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                        : 'bg-teal-900/40 hover:bg-teal-900/60 text-teal-300 border border-teal-800/50'
                    }`}
                  >
                    {prop.is_active ? 'Hide' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDelete(prop.id)}
                    className="p-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-xl transition-colors border border-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Property ROI & Growth Analysis Modal */}
      {analyzingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#051611] border border-teal-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto relative my-8">
            <div className="sticky top-0 z-20 flex justify-between items-center p-4 bg-[#03150f]/95 border-b border-teal-900/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-base">
                  Investment ROI Analysis: {analyzingProperty.title}
                </span>
              </div>
              <button
                onClick={() => setAnalyzingProperty(null)}
                className="p-2 bg-black/40 hover:bg-black/70 text-gray-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <PropertyGrowthRoiVisualizer
                initialPrice={Number(analyzingProperty.price) || 10000000}
                propertyTitle={analyzingProperty.title}
                propertyLocation={analyzingProperty.location}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#051611] border border-red-900/50 shadow-2xl rounded-2xl overflow-hidden p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-2">Delete Property?</h3>
            <p className="text-gray-400 mb-6">This action cannot be undone. The property will be permanently removed from your list and the public catalogue.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPropertyToDelete(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDelete(propertyToDelete)}
                className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

