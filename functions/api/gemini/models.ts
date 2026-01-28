interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  let apiKey = url.searchParams.get("apiKey");

  try {
    // If no key provided in query, try to get from DB
    if (!apiKey) {
      const config = await DB.prepare(
        "SELECT apiKey FROM gemini_config WHERE id = 'default'"
      ).first();
      apiKey = config?.apiKey as string;
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Since we are using Cloudflare AI Gateway compatibility mode, 
    // we use a static list of common Gemini models supported by AI Gateway.
    // Dynamic fetching from Google's endpoint might be blocked in some regions.
    const models = [
      { name: "google-ai-studio/gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
      { name: "google-ai-studio/gemini-1.5-flash", displayName: "Gemini 1.5 Flash" },
      { name: "google-ai-studio/gemini-1.5-pro", displayName: "Gemini 1.5 Pro" },
      { name: "google-ai-studio/gemini-1.5-flash-8b", displayName: "Gemini 1.5 Flash-8B" },
      { name: "google-ai-studio/gemini-3-flash-preview", displayName: "Gemini 3 Flash Preview" },
    ];

    return new Response(JSON.stringify(models), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
