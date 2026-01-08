import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    console.log("=== SendGrid OTP Email Function ===");
    console.log("SendGrid API Key configured:", !!SENDGRID_API_KEY);

    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { patient_email, patient_name, doctor_name, otp_code } = await req.json();
    
    console.log("Sending OTP to:", patient_email);
    console.log("Doctor:", doctor_name);

    // SendGrid API request
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: patient_email }],
            subject: "Doctor Access Request - OTP Verification",
          },
        ],
        from: {
          email: Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@medivault.com",
          name: "MediVault",
        },
        content: [
          {
            type: "text/html",
            value: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">MediVault</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Secure Medical Records Access</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                  <h2 style="color: #667eea; margin-top: 0;">Doctor Access Request</h2>
                  
                  <p>Hello <strong>${patient_name}</strong>,</p>
                  
                  <p><strong>Dr. ${doctor_name}</strong> has requested access to your medical records. To authorize this access, please share the following One-Time Password (OTP) with the doctor:</p>
                  
                  <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your OTP Code</p>
                    <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp_code}</p>
                  </div>
                  
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes. Only share this code if you authorize Dr. ${doctor_name} to access your medical records.
                    </p>
                  </div>
                  
                  <p style="margin-top: 25px;">You can also verify this request by logging into your MediVault dashboard.</p>
                  
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                  
                  <p style="color: #666; font-size: 13px; margin: 0;">
                    If you did not request this access or have concerns, please contact our support team immediately.
                  </p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    This is an automated message from MediVault. Please do not reply to this email.
                  </p>
                  <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
                    © 2025 MediVault. All rights reserved.
                  </p>
                </div>
              </body>
              </html>
            `,
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid error:", sendGridResponse.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send email",
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully via SendGrid");

    return new Response(
      JSON.stringify({ success: true, message: "OTP email sent via SendGrid" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
