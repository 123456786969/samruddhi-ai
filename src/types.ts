export interface Agent {
  id: string;
  name: string;
  businessName?: string;
  photo?: string;
  phone?: string;
  slug?: string;
  email?: string;
}

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Site Visit' | 'Negotiation' | 'Won' | 'Lost';
export type LeadSource = 'Walk-in' | 'Website' | 'Referral' | 'Ad' | 'Other';

export interface Lead {
  id: string;
  agent_id: string;
  name: string;
  phone: string;
  email?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  property_type?: string;
  source: LeadSource | string;
  stage: LeadStage;
  score?: number;
  tags?: string[];
  automation_paused?: boolean;
  created_at: number;
  last_contacted_at?: number;
  notes?: string;
}

export interface Deal {
  id: string;
  agent_id: string;
  lead_id: string;
  property_id?: string;
  value: number;
  stage: LeadStage; // typically mirrors lead stage or simplified won/lost
  expected_close_date?: number;
  closed_at?: number;
  created_at: number;
}

export type ActivityType = 'call' | 'whatsapp' | 'email' | 'note' | 'site visit' | 'meeting';

export interface Activity {
  id: string;
  agent_id: string;
  lead_id: string;
  type: ActivityType;
  content: string;
  created_at: number;
}

export interface Task {
  id: string;
  agent_id: string;
  lead_id?: string;
  title: string;
  due_date: number;
  status: 'pending' | 'done';
  reminder?: boolean;
  created_at: number;
}

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  area_sqft: number;
  short_description: string;
  total_units: number;
  units_sold: number;
  units_reserved: number;
  photos: string[];
  is_active: boolean;
  created_at: number;
}

export interface Visit {
  id: string;
  agent_id: string;
  lead_id: string;
  requested_time: number;
  status: 'pending' | 'confirmed' | 'declined' | 'done';
  property_id?: string;
  created_at: number;
}

export type ExpenseType = 'ad_spend' | 'other';

export interface Expense {
  id: string;
  agent_id: string;
  type: ExpenseType;
  platform?: string; // For ad spend
  campaign?: string; // For ad spend
  category?: string; // For other
  amount: number;
  note?: string;
  description?: string;
  date: number;
  created_at: number;
}

// Keep existing mock data types for landing page
export interface VoiceSample {
  id: string;
  language: string;
  flag: string;
  speaker: string;
  audioDuration: string;
  transcript: string;
  translation: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  leadCapacity: string;
  popular?: boolean;
  features: string[];
  ctaText: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  quote: string;
  metrics: string;
  avatar: string;
}

export interface LeadMockData {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget: string;
  preferredLocation: string;
  status: 'Qualified' | 'Site Visit Scheduled' | 'In Follow-up' | 'Hot Lead';
  timeAgo: string;
  language: string;
  aiAction: string;
}

export interface DemoFormData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  monthlyLeads: string;
  preferredTime: string;
  role: 'Builder / Developer' | 'Channel Partner / Broker' | 'Marketing Agency' | 'Other';
}

export type WhatsAppTriggerEvent = 
  | 'new_lead_instant'
  | 'site_visit_prompt'
  | 'price_drop_offer'
  | 'reengagement_day_7'
  | 'custom';

export interface WhatsAppTemplate {
  id: string;
  agent_id: string;
  title: string;
  trigger_event: WhatsAppTriggerEvent;
  delay_minutes: number;
  language: string; // 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'mr'
  body: string;
  is_active: boolean;
  created_at: number;
}

export type WhatsAppLogStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppLog {
  id: string;
  agent_id: string;
  lead_id: string;
  lead_name: string;
  recipient_phone: string;
  template_id?: string;
  template_title?: string;
  message: string;
  trigger_type: string;
  status: WhatsAppLogStatus;
  sent_at: number;
  error_message?: string;
}

export interface WhatsAppAutomationConfig {
  agent_id: string;
  auto_send_on_new_lead: boolean;
  auto_send_site_visit_reminder: boolean;
  default_delay_seconds: number;
  preferred_language: string;
  business_phone_number?: string;
  api_provider: 'meta_cloud' | 'simulation';
  meta_phone_number_id?: string;
  webhook_status: 'connected' | 'idle' | 'disconnected';
  created_at?: number;
  updated_at?: number;
}

