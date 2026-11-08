export function getInitialDemoData(collectionName: string, agentId: string): any[] {
  const now = Date.now();
  switch (collectionName) {
    case 'leads':
      return [
        {
          id: 'demo_lead_1',
          agent_id: agentId,
          name: 'Rahul Sharma',
          phone: '+91 98450 12345',
          email: 'rahul.sharma@techcorp.in',
          budget: '₹1.4 Cr - ₹1.6 Cr',
          property_type: 'Apartment',
          location_preference: 'Thanisandra / North Bangalore',
          status: 'qualified',
          lead_score: 94,
          source: 'Google Ads',
          notes: 'Looking for ready-to-move 3 BHK in Nikoo Homes IV. Pre-approved loan with HDFC.',
          created_at: now - 3600000 * 4,
          updated_at: now - 3600000 * 2,
        },
        {
          id: 'demo_lead_2',
          agent_id: agentId,
          name: 'Priya Nair',
          phone: '+91 98860 67890',
          email: 'priya.nair@synopsys.com',
          budget: '₹2.4 Cr - ₹2.8 Cr',
          property_type: 'Apartment',
          location_preference: 'Whitefield',
          status: 'visit_scheduled',
          lead_score: 89,
          source: 'WhatsApp AI Bot',
          notes: 'High intent IT professional in Whitefield. Requested video tour and price break-up.',
          created_at: now - 3600000 * 18,
          updated_at: now - 3600000 * 6,
        },
        {
          id: 'demo_lead_3',
          agent_id: agentId,
          name: 'Vikram Reddy',
          phone: '+91 97400 45678',
          email: 'vikram.reddy@biocon.com',
          budget: '₹1.7 Cr - ₹2.0 Cr',
          property_type: 'Villa Plot',
          location_preference: 'Devanahalli Airport Road',
          status: 'negotiation',
          lead_score: 96,
          source: 'Portal Enquiries',
          notes: 'Interested in 2400 sqft corner plot in Embassy Springs. Ready for token advance.',
          created_at: now - 3600000 * 36,
          updated_at: now - 3600000 * 12,
        },
        {
          id: 'demo_lead_4',
          agent_id: agentId,
          name: 'Ananya Rao',
          phone: '+91 99000 89012',
          email: 'ananya.rao@flipkart.com',
          budget: '₹3.8 Cr - ₹4.5 Cr',
          property_type: 'Luxury Duplex',
          location_preference: 'Hoodi / ITPL',
          status: 'contacted',
          lead_score: 82,
          source: 'Meta Ads',
          notes: 'Spoke with AI Voice Assistant for 3m 40s. Requested floor plan PDF on WhatsApp.',
          created_at: now - 3600000 * 48,
          updated_at: now - 3600000 * 24,
        },
      ];

    case 'properties':
      return [
        {
          id: 'demo_prop_1',
          agent_id: agentId,
          title: 'Bhartiya City Nikoo Homes IV',
          price: 14500000,
          price_display: '₹1.45 Cr',
          location: 'Thanisandra Main Road, Bangalore',
          bhk: '3 BHK',
          area_sqft: 1580,
          status: 'Available',
          is_active: true,
          image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          created_at: now - 86400000 * 10,
        },
        {
          id: 'demo_prop_2',
          agent_id: agentId,
          title: 'Prestige Shantiniketan',
          price: 26500000,
          price_display: '₹2.65 Cr',
          location: 'ITPL Main Road, Whitefield, Bangalore',
          bhk: '3.5 BHK',
          area_sqft: 2215,
          status: 'Available',
          is_active: true,
          image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          created_at: now - 86400000 * 8,
        },
        {
          id: 'demo_prop_3',
          agent_id: agentId,
          title: 'Embassy Springs Master Plots',
          price: 18000000,
          price_display: '₹1.80 Cr',
          location: 'Devanahalli, Airport Corridor, Bangalore',
          bhk: 'Villa Plot',
          area_sqft: 2400,
          status: 'Available',
          is_active: true,
          image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          created_at: now - 86400000 * 5,
        },
      ];

    case 'tasks':
      return [
        {
          id: 'demo_task_1',
          agent_id: agentId,
          title: 'Host Site Visit with Priya Nair at Prestige Shantiniketan',
          due_date: now + 86400000,
          priority: 'high',
          status: 'pending',
          lead_id: 'demo_lead_2',
          lead_name: 'Priya Nair',
          created_at: now - 3600000 * 10,
        },
        {
          id: 'demo_task_2',
          agent_id: agentId,
          title: 'WhatsApp Brochure & Cost Sheet to Rahul Sharma',
          due_date: now + 3600000 * 3,
          priority: 'medium',
          status: 'pending',
          lead_id: 'demo_lead_1',
          lead_name: 'Rahul Sharma',
          created_at: now - 3600000 * 5,
        },
        {
          id: 'demo_task_3',
          agent_id: agentId,
          title: 'Finalize Token Agreement for Vikram Reddy (Embassy Springs)',
          due_date: now + 86400000 * 2,
          priority: 'high',
          status: 'pending',
          lead_id: 'demo_lead_3',
          lead_name: 'Vikram Reddy',
          created_at: now - 3600000 * 20,
        },
      ];

    case 'visits':
      return [
        {
          id: 'demo_visit_1',
          agent_id: agentId,
          lead_name: 'Priya Nair',
          property_title: 'Prestige Shantiniketan',
          visit_date: now + 86400000,
          status: 'scheduled',
          notes: 'Client arriving by Namma Metro to Whitefield station. Pick up from Gate 2.',
          created_at: now - 3600000 * 14,
        },
        {
          id: 'demo_visit_2',
          agent_id: agentId,
          lead_name: 'Rahul Sharma',
          property_title: 'Nikoo Homes IV',
          visit_date: now + 86400000 * 3,
          status: 'confirmed',
          notes: 'Family accompanying to view 3 BHK model unit in Tower 3.',
          created_at: now - 3600000 * 8,
        },
      ];

    case 'deals':
      return [
        {
          id: 'demo_deal_1',
          agent_id: agentId,
          title: 'Nikoo Homes IV - Tower 3 Unit 1402',
          value: 14500000,
          stage: 'negotiation',
          expected_close: now + 86400000 * 14,
          lead_id: 'demo_lead_1',
          created_at: now - 3600000 * 48,
        },
        {
          id: 'demo_deal_2',
          agent_id: agentId,
          title: 'Prestige Shantiniketan - 3.5 BHK',
          value: 26500000,
          stage: 'proposal',
          expected_close: now + 86400000 * 21,
          lead_id: 'demo_lead_2',
          created_at: now - 3600000 * 30,
        },
      ];

    case 'activities':
      return [
        {
          id: 'demo_act_1',
          agent_id: agentId,
          title: 'AI Voice Call Completed',
          description: 'Samruddhi Voice AI qualified Rahul Sharma (94% intent). Pre-approved buyer.',
          created_at: now - 3600000 * 2,
        },
        {
          id: 'demo_act_2',
          agent_id: agentId,
          title: 'WhatsApp Automation Dispatched',
          description: 'Sent interactive brochure and floor plan to Priya Nair.',
          created_at: now - 3600000 * 6,
        },
        {
          id: 'demo_act_3',
          agent_id: agentId,
          title: 'Site Visit Scheduled',
          description: 'Prestige Shantiniketan visit confirmed for tomorrow 11:30 AM.',
          created_at: now - 3600000 * 12,
        },
      ];

    default:
      return [];
  }
}

export function seedDemoDataIfEmpty(agentId: string) {
  const collections = ['leads', 'properties', 'tasks', 'visits', 'deals', 'activities'];
  for (const col of collections) {
    const key = `demo_${col}`;
    const existing = localStorage.getItem(key);
    if (!existing || existing === '[]') {
      const items = getInitialDemoData(col, agentId);
      localStorage.setItem(key, JSON.stringify(items));
    }
  }
}
