export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request, env, params } = context;
  const logId = params.id;

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