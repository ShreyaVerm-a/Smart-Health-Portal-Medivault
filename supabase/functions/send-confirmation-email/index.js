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
    const { patientEmail, patientName, medicineName, dosage, takenAt } = await req.json();

    console.log(`Sending confirmation email to ${patientEmail}`);

    // Send confirmation email using SendGrid API
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: patientEmail }],
          subject: "Medicine Taken Confirmation"
        }],
        from: { 
          email: "noreply@medtracker.com",
          name: "MediVault"
        },
        content: [{
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">✓ Medicine Taken Successfully</h2>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>Hello ${patientName || 'there'},</p>
                <p>This is a confirmation that you have successfully recorded taking your medication.</p>
                <div style="margin: 20px 0; padding: 15px; background-color: white; border-left: 4px solid #10b981; border-radius: 4px;">
                  <p style="margin: 5px 0;"><strong>Medicine:</strong> ${medicineName}</p>
                  <p style="margin: 5px 0;"><strong>Dosage:</strong> ${dosage}</p>
                  <p style="margin: 5px 0;"><strong>Taken at:</strong> ${new Date(takenAt).toLocaleString()}</p>
                </div>
                <p style="color: #64748b;">Keep up the good work following your medication schedule!</p>
              </div>
              <p style="color: #64748b; font-size: 12px;">This is an automated confirmation from your MediVault app.</p>
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

    console.log("Confirmation email sent successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
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
