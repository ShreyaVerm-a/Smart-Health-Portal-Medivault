import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientEmail, patientPhone, medicineName, dosage, scheduledTime } = await req.json();

    // Send email reminder using SendGrid API
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: patientEmail }],
          subject: "Medicine Reminder - Time to take your medication"
        }],
        from: { 
          email: "noreply@medtracker.com",
          name: "MedTracker"
        },
        content: [{
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Medicine Reminder</h2>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">It's time to take your medication!</h3>
                <p><strong>Medicine:</strong> ${medicineName}</p>
                <p><strong>Dosage:</strong> ${dosage}</p>
                <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
              </div>
              <p style="color: #64748b;">Remember to take your medication as prescribed by your doctor.</p>
              <p style="color: #64748b; font-size: 12px;">This is an automated reminder from your MedTracker app.</p>
            </div>
          `
        }]
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("SendGrid API error:", emailResponse.status, errorText);
      throw new Error(`SendGrid error: ${errorText}`);
    }

    console.log("Medicine reminder sent successfully via SendGrid");

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent: true,
      smsSent: false 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending medicine reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
