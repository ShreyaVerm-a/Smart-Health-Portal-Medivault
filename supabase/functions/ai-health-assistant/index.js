import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, include_recommendations = false, user_location = null } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key configured:', !!openAIApiKey);
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = `You are a helpful AI health assistant. Your role is to:

1. Analyze symptoms described by users
2. Provide preliminary health assessments (NOT medical diagnoses)
3. Recommend appropriate types of specialists
4. Suggest when to seek immediate medical attention
5. Provide general health advice and recommendations

IMPORTANT GUIDELINES:
- Always include a disclaimer that this is NOT a medical diagnosis
- For serious symptoms (chest pain, difficulty breathing, severe injuries), always recommend immediate emergency care
- Be empathetic and supportive
- Provide structured responses with clear sections
- Suggest appropriate specialists based on symptoms
- Include general care recommendations

Format your response with clear sections:
- **Symptom Analysis**
- **Preliminary Assessment** 
- **Recommended Specialist**
- **Immediate Care Recommendations**
- **When to Seek Emergency Care**
- **Disclaimer**`;

    if (include_recommendations && user_location && user_location.lat !== 0 && user_location.lng !== 0) {
      systemPrompt += `

HOSPITAL/SPECIALIST RECOMMENDATIONS:
Based on the user's location (lat: ${user_location.lat}, lng: ${user_location.lng}), also provide:
- General guidance on finding nearby healthcare facilities
- Types of medical facilities to look for (urgent care, hospital, specialty clinic)
- Suggest they can use online maps or hospital finder services
- For emergencies, recommend calling emergency services (911 in US, local emergency number elsewhere)
- Mention they can search for specific specialists in their area using online directories

Add a section:
- **Finding Healthcare Near You**`;
    }

    systemPrompt += `

Always end with: "⚠️ **Important**: This is not a medical diagnosis. Please consult with a licensed healthcare professional for proper evaluation and treatment."`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Please analyze these symptoms and provide health guidance: ${message}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        location_used: !!user_location && user_location.lat !== 0 && user_location.lng !== 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('AI Health Assistant error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred processing your request' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
