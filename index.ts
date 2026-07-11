// Supabase Edge Function: buddy
// Deploy with:  supabase functions deploy buddy
// Set secret:   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// This keeps your Anthropic API key on the server — NEVER put it in frontend code.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Require a signed-in Supabase user (the client sends its JWT automatically)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context } = await req.json();

    const system = `You are Waypoint's Guidance Buddy: a warm, direct mentor for students applying to study abroad and adjusting to life once they get there. Give specific, practical, encouraging advice — applications, ED/EA/RD strategy, visas, packing, homesickness, budgeting, making friends. Keep replies conversational and under 150 words unless the student clearly wants depth. No filler.\n\n${context || ""}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();
    const reply = (data.content || [])
      .map((b: { text?: string }) => b.text || "")
      .join("\n")
      .trim();

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
