/**
 * Property Pulse AI Agent - Edge Function
 * 
 * Analyzes property search criteria and suggests improvements using OpenAI
 * 
 * Triggered: When user adds/edits search criteria
 * Or: On-demand via API call
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize OpenAI (will use env var when deployed)
const getOpenAI = (env) => {
  const { OpenAI } = require('https://esm.sh/openai@4.28.0');
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }
  return new OpenAI({ apiKey });
};

// Analyze property criteria and suggest improvements
const analyzeCriteria = async (criteria, openai) => {
  const prompt = `You are a real estate expert AI assistant for Property Pulse. Analyze the following property search criteria and provide suggestions to improve lead quality.

Current criteria:
${JSON.stringify(criteria, null, 2)}

Provide a JSON response with the following structure:
{
  "suggestions": [
    {
      "type": "keyword_addition|keyword_removal|price_adjustment|location_expansion|property_type",
      "priority": "high|medium|low",
      "description": "Explain why this suggestion would help",
      "suggested_value": "The suggested value"
    }
  ],
  "estimated_match_rate": "low|medium|high",
  "reasoning": "Brief explanation of the analysis"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are a helpful real estate expert AI. Respond only with valid JSON, no markdown formatting.' 
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(completion.choices[0].message.content);
};

// Generate property insights based on market data
const generateInsights = async (criteria, marketData, openai) => {
  const prompt = `You are a real estate market analyst. Given the following search criteria and current market context, provide actionable insights.

Criteria:
${JSON.stringify(criteria, null, 2)}

Market Context:
${JSON.stringify(marketData || {}, null, 2)}

Provide insights in JSON format:
{
  "insights": [
    {
      "category": "timing|pricing|location|competition",
      "title": "Brief insight title",
      "description": "Detailed explanation",
      "actionable": true
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are a real estate market analyst. Respond only with valid JSON, no markdown formatting.' 
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  return JSON.parse(completion.choices[0].message.content);
};

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, criteria, marketData } = await req.json();

    // Initialize OpenAI
    let openAI;
    try {
      openAI = getOpenAI(Deno.env);
    } catch (e) {
      // If no API key, return mock data for development
      console.warn('OpenAI not configured, returning mock data');
      return new Response(
        JSON.stringify({
          mock: true,
          message: 'OpenAI not configured - set OPENAI_API_KEY in Supabase secrets',
          action,
          criteria
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'analyze':
        result = await analyzeCriteria(criteria, openAI);
        break;
      
      case 'insights':
        result = await generateInsights(criteria, marketData, openAI);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use "analyze" or "insights".' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
