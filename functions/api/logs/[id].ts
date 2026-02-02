export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request, env, params } = context;
  const logId = params.id;

  if (request.method === "PUT") {
    try {
      const payload = (await request.json()) as any;
      const intensity = Number(payload.intensity);
      const type = payload.type === "positive" ? "positive" : "negative";
      const content = typeof payload.content === "string" ? payload.content : "";

      if (!Number.isFinite(intensity) || intensity < 1 || intensity > 6) {
        return new Response(JSON.stringify({ error: "Invalid intensity" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await env.DB.prepare(
        "UPDATE logs SET intensity = ?, type = ?, content = ? WHERE id = ?"
      )
        .bind(intensity, type, content, logId)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 1. 明确处理 DELETE 请求
  if (request.method === "DELETE") {
    try {
      await env.DB.prepare("DELETE FROM logs WHERE id = ?").bind(logId).run();
      return new Response(null, { status: 204 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // 2. 如果误入此地的其他请求，给个提示
  return new Response(`Method ${request.method} not allowed on this endpoint`, { status: 405 });
};
