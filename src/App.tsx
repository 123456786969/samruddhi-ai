import React, { lazy, Suspense } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { CITIES_DATA } from './data/cities';
import { ToastProvider } from './components/dashboard/ui/Toast';

const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const DashboardHome = lazy(() => import('./components/dashboard/DashboardHome').then((m) => ({ default: m.DashboardHome })));
const DashboardLeads = lazy(() => import('./components/dashboard/DashboardLeads').then((m) => ({ default: m.DashboardLeads })));
const DashboardLeadDetail = lazy(() => import('./components/dashboard/DashboardLeadDetail').then((m) => ({ default: m.DashboardLeadDetail })));
const DashboardPipeline = lazy(() => import('./components/dashboard/DashboardPipeline').then((m) => ({ default: m.DashboardPipeline })));
const DashboardProperties = lazy(() => import('./components/dashboard/DashboardProperties').then((m) => ({ default: m.DashboardProperties })));
const DashboardVisits = lazy(() => import('./components/dashboard/DashboardVisits').then((m) => ({ default: m.DashboardVisits })));
const DashboardTasks = lazy(() => import('./components/dashboard/DashboardTasks').then((m) => ({ default: m.DashboardTasks })));
const DashboardFinance = lazy(() => import('./components/dashboard/DashboardFinance').then((m) => ({ default: m.DashboardFinance })));
const DashboardWhatsApp = lazy(() => import('./components/dashboard/DashboardWhatsApp').then((m) => ({ default: m.DashboardWhatsApp })));
const DashboardReports = lazy(() => import('./components/dashboard/DashboardReports').then((m) => ({ default: m.DashboardReports })));
const DashboardSettings = lazy(() => import('./components/dashboard/DashboardSettings').then((m) => ({ default: m.DashboardSettings })));
const DashboardPricing = lazy(() => import('./components/dashboard/DashboardPricing').then((m) => ({ default: m.DashboardPricing })));
const SamruddhiAICompleteDashboard = lazy(() => import('./components/dashboard/SamruddhiAICompleteDashboard').then((m) => ({ default: m.SamruddhiAICompleteDashboard })));
const PricingPage = lazy(() => import('./components/pricing/PricingPage').then((m) => ({ default: m.PricingPage })));
const PublicCatalogue = lazy(() => import('./components/PublicCatalogue').then((m) => ({ default: m.PublicCatalogue })));

function CityRoute() {
  const { citySlug } = useParams();
  const cleanSlug = (citySlug || '').toLowerCase().trim();
  
  if (CITIES_DATA[cleanSlug]) {
    // We pass down to LandingPage to handle city rendering
    return <LandingPage citySlug={cleanSlug} />;
  }
  
  // Not a city, might be 404
  return (
    <div className="min-h-screen bg-[#020b08] flex flex-col items-center justify-center text-white">
      <h1 className="text-3xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
      <a href="/" className="text-amber-400 hover:underline">Return Home</a>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#04100c]" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/properties/:slug" element={<PublicCatalogue />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="leads" element={<DashboardLeads />} />
          <Route path="leads/:id" element={<DashboardLeadDetail />} />
          <Route path="pipeline" element={<DashboardPipeline />} />
          <Route path="whatsapp" element={<DashboardWhatsApp />} />
          <Route path="ai-studio" element={<SamruddhiAICompleteDashboard />} />
          <Route path="voice-studio" element={<SamruddhiAICompleteDashboard />} />
          <Route path="properties" element={<DashboardProperties />} />
          <Route path="visits" element={<DashboardVisits />} />
          <Route path="tasks" element={<DashboardTasks />} />
          <Route path="finance" element={<DashboardFinance />} />
          <Route path="pricing" element={<DashboardPricing />} />
          <Route path="reports" element={<DashboardReports />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>
        <Route path="/:citySlug" element={<CityRoute />} />
      </Routes>
      </Suspense>
    </ToastProvider>
  );
}

