import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { DashboardLeads } from './components/dashboard/DashboardLeads';
import { DashboardLeadDetail } from './components/dashboard/DashboardLeadDetail';
import { DashboardPipeline } from './components/dashboard/DashboardPipeline';
import { DashboardProperties } from './components/dashboard/DashboardProperties';
import { DashboardVisits } from './components/dashboard/DashboardVisits';
import { DashboardTasks } from './components/dashboard/DashboardTasks';
import { DashboardFinance } from './components/dashboard/DashboardFinance';
import { DashboardWhatsApp } from './components/dashboard/DashboardWhatsApp';
import { DashboardReports } from './components/dashboard/DashboardReports';
import { DashboardSettings } from './components/dashboard/DashboardSettings';
import { DashboardPricing } from './components/dashboard/DashboardPricing';
import { SamruddhiAICompleteDashboard } from './components/dashboard/SamruddhiAICompleteDashboard';
import { PricingPage } from './components/pricing/PricingPage';
import { PublicCatalogue } from './components/PublicCatalogue';
import { CITIES_DATA } from './data/cities';
import { ToastProvider } from './components/dashboard/ui/Toast';

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
    </ToastProvider>
  );
}

