import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for pending medicine reminders...");

    // Get current time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

    // Find pending reminders that are due (within the last 5 minutes)
    const { data: pendingReminders, error: fetchError } = await supabase
      .from('medicine_reminders')
      .select(`
        id,
        medicine_id,
        patient_id,
        reminder_date,
        reminder_time,
        medicine_tracker (
          medicine_name,
          dosage
        )
      `)
      .eq('status', 'pending')
      .eq('reminder_date', currentDate)
      .lte('reminder_time', currentTime);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingReminders?.length || 0} pending reminders`);

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No pending reminders found",
        count: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Process each reminder
    const results = [];
    for (const reminder of pendingReminders) {
      try {
        // Get patient profile for email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name, phone')
          .eq('user_id', reminder.patient_id)
          .single();

        if (profileError || !profile) {
          console.error(`Error fetching profile for patient ${reminder.patient_id}:`, profileError);
          continue;
        }

        // Call the send-medicine-reminder function
        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          'send-medicine-reminder',
          {
            body: {
              patientEmail: profile.email,
              patientPhone: profile.phone,
              medicineName: reminder.medicine_tracker.medicine_name,
              dosage: reminder.medicine_tracker.dosage,
              scheduledTime: reminder.reminder_time
            }
          }
        );

        if (sendError) {
          console.error(`Error sending reminder for ${reminder.id}:`, sendError);
          results.push({ id: reminder.id, success: false, error: sendError.message });
        } else {
          // Update reminder status to sent
          const { error: updateError } = await supabase
            .from('medicine_reminders')
            .update({ status: 'sent' })
            .eq('id', reminder.id);

          if (updateError) {
            console.error(`Error updating reminder status for ${reminder.id}:`, updateError);
          }

          console.log(`Successfully sent reminder for ${reminder.id}`);
          results.push({ id: reminder.id, success: true });
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        results.push({ id: reminder.id, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${results.length} reminders`,
      results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in check-medicine-reminders:", error);
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
