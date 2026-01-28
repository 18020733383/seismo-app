interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  try {
    const config = await DB.prepare(
      "SELECT apiKey, model FROM gemini_config WHERE id = 'default'"
    ).first();

    if (!config) {
      return new Response(JSON.stringify({ apiKey: '', model: '' }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mask the API key for security when sending to frontend
    const maskedKey = config.apiKey ? 
      `${(config.apiKey as string).slice(0, 4)}...${(config.apiKey as string).slice(-4)}` : 
      '';

    return new Response(JSON.stringify({ 
      apiKey: maskedKey, 
      model: config.model,
      hasKey: !!config.apiKey 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  try {
    const { apiKey, model } = await context.request.json() as { apiKey: string, model: string };
    
    if (!model) {
      return new Response(JSON.stringify({ error: "Model is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (apiKey === 'KEEP_EXISTING') {
      await DB.prepare(
        "UPDATE gemini_config SET model = ?, updatedAt = ? WHERE id = 'default'"
      )
        .bind(model, Date.now())
        .run();
    } else {
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await DB.prepare(
        "INSERT INTO gemini_config (id, apiKey, model, updatedAt) VALUES ('default', ?, ?, ?) " +
        "ON CONFLICT(id) DO UPDATE SET apiKey=excluded.apiKey, model=excluded.model, updatedAt=excluded.updatedAt"
      )
        .bind(apiKey, model, Date.now())
        .run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
