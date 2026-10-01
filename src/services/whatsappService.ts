import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { WhatsAppTemplate, WhatsAppLog, WhatsAppAutomationConfig } from '../types';

export const DEFAULT_WHATSAPP_TEMPLATES: Array<Omit<WhatsAppTemplate, 'id' | 'agent_id' | 'created_at'>> = [
  {
    title: '⚡ Instant Welcome & Digital Brochure',
    trigger_event: 'new_lead_instant',
    delay_minutes: 0,
    language: 'en',
    is_active: true,
    body: `Namaste {{lead_name}}! 🙏 Thank you for your interest in {{property_type}} in {{preferred_location}}.

I am {{agent_name}} from {{business_name}}. Here is our exclusive portfolio and verified project brochures:
👉 {{catalogue_url}}

Would you like me to share pricing sheets and available floor plans? Reply *YES* and I will send them immediately!`,
  },
  {
    title: '🏛️ Guided Site Visit Invitation (2-Hour Follow-up)',
    trigger_event: 'site_visit_prompt',
    delay_minutes: 120,
    language: 'en',
    is_active: true,
    body: `Hi {{lead_name}}, we have exclusive weekend slots open for a private site tour at our premium {{preferred_location}} projects.

We provide free cab pickup, dedicated sample flat tour, and on-spot builder inventory discounts.

Would Saturday or Sunday 11:00 AM work best for you? Let me know and I will reserve your VIP pass! 🚗🔑`,
  },
  {
    title: '💰 Special 10:90 Payment Plan & Festive Offers',
    trigger_event: 'price_drop_offer',
    delay_minutes: 4320, // 3 days
    language: 'en',
    is_active: true,
    body: `Hello {{lead_name}}! ✨ Exclusive update: The developer just unlocked a limited-period *10:90 Developer Subvention Scheme* with zero pre-EMI on {{property_type}} in {{preferred_location}}.

Starting budget matches your preference: {{budget}}.

Can I send you the detailed payment schedule and unit availability chart?`,
  },
  {
    title: '🔄 7-Day Re-engagement & Requirement Check',
    trigger_event: 'reengagement_day_7',
    delay_minutes: 10080, // 7 days
    language: 'en',
    is_active: true,
    body: `Namaste {{lead_name}}, {{agent_name}} here from {{business_name}}.

Checking in to see if you are still actively exploring properties around {{preferred_location}}, or if your budget / possession timeline has changed?

We just added 3 new RERA-approved gated communities matching your requirement. Check them here:
👉 {{catalogue_url}}`,
  },
  {
    title: '🇮🇳 Hindi: त्वरित स्वागत और ब्रोशर (Instant Welcome)',
    trigger_event: 'new_lead_instant',
    delay_minutes: 0,
    language: 'hi',
    is_active: false,
    body: `नमस्ते {{lead_name}} जी! 🙏 {{preferred_location}} में {{property_type}} में रुचि दिखाने के लिए धन्यवाद।

मैं {{business_name}} से {{agent_name}} बात कर रहा हूँ। हमारी सभी सत्यापित संपत्तियों और ब्रोशर देखने के लिए नीचे दिए गए लिंक पर क्लिक करें:
👉 {{catalogue_url}}

क्या आप साइट विजिट या फ्लोर प्लान की जानकारी चाहते हैं? कृपया 'हाँ' लिखकर उत्तर दें!`,
  },
  {
    title: '🌿 Kannada: ತ್ವರಿತ ಸ್ವಾಗತ ಮತ್ತು ಕ್ಯಾಟಲಾಗ್',
    trigger_event: 'new_lead_instant',
    delay_minutes: 0,
    language: 'kn',
    is_active: false,
    body: `ನಮಸ್ಕಾರ {{lead_name}} ಅವರೇ! 🙏 {{preferred_location}} ನಲ್ಲಿ {{property_type}} ಬಗ್ಗೆ ವಿಚಾರಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು.

ನಾನು {{business_name}} ಸಂಸ್ಥೆಯ {{agent_name}}. ನಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಪ್ರಾಪರ್ಟಿಗಳು ಮತ್ತು ಬ್ರೋಷರ್‌ಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಿ:
👉 {{catalogue_url}}

ನಿಮಗೆ ಸೈಟ್ ವಿಸಿಟ್ ಅಥವಾ ಬೆಲೆಯ ವಿವರಗಳು ಬೇಕಿದ್ದರೆ ದಯವಿಟ್ಟು ಉತ್ತರಿಸಿ!`,
  }
];

export function formatWhatsAppMessage(
  templateBody: string,
  variables: {
    lead_name?: string;
    agent_name?: string;
    business_name?: string;
    property_type?: string;
    preferred_location?: string;
    budget?: string;
    catalogue_url?: string;
    time?: string;
  }
): string {
  let result = templateBody;
  result = result.replace(/{{lead_name}}/g, variables.lead_name || 'Valued Customer');
  result = result.replace(/{{agent_name}}/g, variables.agent_name || 'Your Property Consultant');
  result = result.replace(/{{business_name}}/g, variables.business_name || 'Samruddhi Realty');
  result = result.replace(/{{property_type}}/g, variables.property_type || 'Luxury Homes & Apartments');
  result = result.replace(/{{preferred_location}}/g, variables.preferred_location || 'prime locations');
  result = result.replace(/{{budget}}/g, variables.budget || 'Customizable Budget');
  result = result.replace(/{{catalogue_url}}/g, variables.catalogue_url || window.location.origin);
  result = result.replace(/{{time}}/g, variables.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  return result;
}

export function generateWhatsAppWebLink(phone: string, text: string): string {
  // Clean phone number: remove spaces, dashes, parentheses
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India country code
  }
  cleanPhone = cleanPhone.replace('+', '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface SendWhatsAppParams {
  phone_number: string;
  message: string;
  template_name?: string;
  lead_id?: string;
}

export interface SendWhatsAppResponse {
  success: boolean;
  message_id?: string;
  status: 'sent' | 'delivered' | 'failed';
  delivery_status?: string;
  recipient?: string;
  provider?: string;
  simulated?: boolean;
  timestamp?: number;
  error?: string;
  note?: string;
}

/**
 * Direct API caller to backend /api/whatsapp/send
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResponse> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
      headers['Authorization'] = `Bearer ${await auth.currentUser.getIdToken()}`;
    }
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone_number: params.phone_number,
        message: params.message,
        template_name: params.template_name,
        lead_id: params.lead_id,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        status: 'failed',
        error: data.error || `HTTP error ${response.status}: Failed to dispatch WhatsApp message`,
      };
    }

    return {
      success: true,
      message_id: data.message_id,
      status: data.status || 'sent',
      delivery_status: data.delivery_status || 'delivered',
      recipient: data.recipient || params.phone_number,
      provider: data.provider,
      simulated: data.simulated,
      timestamp: data.timestamp || Date.now(),
      note: data.note,
    };
  } catch (err: any) {
    console.error('sendWhatsAppMessage error:', err);
    return {
      success: false,
      status: 'failed',
      error: err.message || 'Network error connecting to WhatsApp API gateway.',
    };
  }
}

export async function dispatchAutomatedWhatsApp({
  agentId,
  leadId,
  leadName,
  leadPhone,
  agentName,
  businessName,
  agentSlug,
  propertyType,
  preferredLocation,
  budget,
  triggerType,
  customTemplate,
}: {
  agentId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  agentName?: string;
  businessName?: string;
  agentSlug?: string;
  propertyType?: string;
  preferredLocation?: string;
  budget?: string;
  triggerType: string;
  customTemplate?: string;
}): Promise<{ 
  success: boolean; 
  message: string; 
  waLink: string; 
  logId?: string; 
  messageId?: string;
  provider?: string;
  simulated?: boolean;
  error?: string;
}> {
  try {
    const origin = window.location.origin;
    const catalogueUrl = agentSlug ? `${origin}/properties/${agentSlug}` : origin;

    let bodyText = customTemplate || '';

    if (!bodyText) {
      // Find matching active template or use default
      const templatesQ = query(
        collection(db, 'whatsapp_templates'),
        where('agent_id', '==', agentId),
        where('trigger_event', '==', triggerType),
        where('is_active', '==', true)
      );
      const snap = await getDocs(templatesQ);
      if (!snap.empty) {
        bodyText = snap.docs[0].data().body;
      } else {
        const defaultMatch = DEFAULT_WHATSAPP_TEMPLATES.find(t => t.trigger_event === triggerType) || DEFAULT_WHATSAPP_TEMPLATES[0];
        bodyText = defaultMatch.body;
      }
    }

    const compiledMessage = formatWhatsAppMessage(bodyText, {
      lead_name: leadName,
      agent_name: agentName || 'Samruddhi AI Agent',
      business_name: businessName || 'Samruddhi Realty',
      property_type: propertyType || 'Premium Residential Properties',
      preferred_location: preferredLocation || 'Prime Metro Hubs',
      budget: budget || 'Best Market Value',
      catalogue_url: catalogueUrl,
    });

    // 1. Call Backend API /api/whatsapp/send
    const apiResult = await sendWhatsAppMessage({
      phone_number: leadPhone,
      message: compiledMessage,
      template_name: triggerType,
      lead_id: leadId,
    });

    const waLink = generateWhatsAppWebLink(leadPhone, compiledMessage);

    if (!apiResult.success) {
      // Record failed attempt in Firestore logs for auditability
      try {
        await addDoc(collection(db, 'whatsapp_logs'), {
          agent_id: agentId,
          lead_id: leadId,
          lead_name: leadName,
          recipient_phone: leadPhone,
          message: compiledMessage,
          trigger_type: triggerType,
          status: 'failed',
          error: apiResult.error,
          sent_at: Date.now(),
        });
      } catch (logErr) {
        console.warn('Could not record failed WhatsApp log in Firestore', logErr);
      }

      return {
        success: false,
        message: compiledMessage,
        waLink,
        error: apiResult.error,
      };
    }

    // 2. Save successful dispatch to Firestore whatsapp_logs
    const logDoc: Omit<WhatsAppLog, 'id'> = {
      agent_id: agentId,
      lead_id: leadId,
      lead_name: leadName,
      recipient_phone: apiResult.recipient || leadPhone,
      message: compiledMessage,
      trigger_type: triggerType,
      status: (apiResult.delivery_status as any) || 'delivered',
      sent_at: apiResult.timestamp || Date.now(),
    };

    const docRef = await addDoc(collection(db, 'whatsapp_logs'), logDoc);

    // 3. Also record an Activity on the Lead so it appears in CRM timeline
    try {
      await addDoc(collection(db, 'activities'), {
        agent_id: agentId,
        lead_id: leadId,
        type: 'whatsapp',
        content: `🤖 WhatsApp Message Sent (${apiResult.provider === 'meta_cloud_api' ? 'Meta Cloud API' : 'Auto-Pilot'}): "${compiledMessage.slice(0, 80)}..." [ID: ${apiResult.message_id}]`,
        created_at: Date.now(),
      });
    } catch (actErr) {
      console.warn('Could not add activity log', actErr);
    }

    return {
      success: true,
      message: compiledMessage,
      waLink,
      logId: docRef.id,
      messageId: apiResult.message_id,
      provider: apiResult.provider,
      simulated: apiResult.simulated,
    };
  } catch (error: any) {
    console.error('Failed to dispatch WhatsApp notification:', error);
    return {
      success: false,
      message: error?.message || 'Failed to dispatch WhatsApp notification',
      waLink: generateWhatsAppWebLink(leadPhone, 'Hello from Samruddhi AI'),
      error: error?.message,
    };
  }
}
