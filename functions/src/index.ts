import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configure your SMTP credentials in Firebase environment variables:
// firebase functions:config:set smtp.email="your-email@gmail.com" smtp.password="your-app-password"
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().smtp?.email || 'test@example.com',
    pass: functions.config().smtp?.password || 'testpassword',
  },
});

export const sendSiteVisitNotification = functions.firestore
  .document('visits/{visitId}')
  .onCreate(async (snap, context) => {
    const visitData = snap.data();
    
    try {
      // Get the agent details to know where to send the email
      const agentId = visitData.agent_id;
      if (!agentId) {
        console.log('No agent_id found on the visit.');
        return null;
      }

      const agentDoc = await admin.firestore().collection('users').doc(agentId).get();
      if (!agentDoc.exists) {
        console.log(`Agent with ID ${agentId} not found.`);
        return null;
      }

      const agentData = agentDoc.data();
      const agentEmail = agentData?.email;

      if (!agentEmail) {
        console.log(`Agent ${agentId} does not have an email address.`);
        return null;
      }

      // Try to get lead details
      let leadName = 'A lead';
      let leadPhone = 'Not provided';
      if (visitData.lead_id) {
          const leadDoc = await admin.firestore().collection('leads').doc(visitData.lead_id).get();
          if (leadDoc.exists) {
              const leadData = leadDoc.data();
              leadName = leadData?.name || leadName;
              leadPhone = leadData?.phone || leadPhone;
          }
      }

      const mailOptions = {
        from: '"Samruddhi AI" <noreply@samruddhiai.com>',
        to: agentEmail,
        subject: `New Site Visit Request from ${leadName}`,
        text: `Hello ${agentData?.name || 'Agent'},\n\nYou have a new site visit request!\n\nLead Name: ${leadName}\nPhone: ${leadPhone}\nProperty: ${visitData.property_title || 'Not specified'}\nRequested Time: ${visitData.requested_time || 'TBD'}\n\nPlease check your dashboard for more details.\n\nBest,\nSamruddhi AI System`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">New Site Visit Request!</h2>
            <p>Hello ${agentData?.name || 'Agent'},</p>
            <p>You have a new site visit request.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Lead Name:</strong> ${leadName}</p>
              <p style="margin: 4px 0;"><strong>Phone:</strong> ${leadPhone}</p>
              <p style="margin: 4px 0;"><strong>Property:</strong> ${visitData.property_title || 'Not specified'}</p>
              <p style="margin: 4px 0;"><strong>Requested Time:</strong> ${visitData.requested_time || 'TBD'}</p>
            </div>
            <p>Please check your dashboard to confirm the exact time and property details with the lead.</p>
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Samruddhi AI System</p>
          </div>
        `
      };

      await mailTransport.sendMail(mailOptions);
      console.log(`Email notification sent to agent ${agentEmail} for visit ${context.params.visitId}`);
      
      return null;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return null;
    }
  });
