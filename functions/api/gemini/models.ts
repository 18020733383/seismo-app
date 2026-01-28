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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json() as any;
      return new Response(JSON.stringify({ error: errorData.error?.message || "Failed to fetch models" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json() as any;
    // Filter for models that support content generation
    const models = data.models
      .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => ({
        name: m.name.replace("models/", ""),
        displayName: m.displayName,
      }));

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
