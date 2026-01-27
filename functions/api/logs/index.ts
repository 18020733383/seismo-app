interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  try {
    const { results } = await DB.prepare(
      "SELECT * FROM logs ORDER BY timestamp DESC"
    ).all();
    
    // Convert isAftershock from 0/1 to boolean and parse tags
    // Support both 'tags' and 'tag' column names just in case
    const logs = results.map(row => {
      const tagsStr = (row.tags || row.tag) as string | undefined;
      return {
        ...row,
        isAftershock: !!row.isAftershock,
        tags: tagsStr ? JSON.parse(tagsStr) : [],
        type: row.type || 'negative'
      };
    });

    return new Response(JSON.stringify(logs), {
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
    const log = await context.request.json() as any;
    
    await DB.prepare(
      "INSERT INTO logs (id, intensity, content, isAftershock, timestamp, tags, type) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(
        log.id, 
        log.intensity, 
        log.content, 
        log.isAftershock ? 1 : 0, 
        log.timestamp, 
        JSON.stringify(log.tags || []),
        log.type || 'negative'
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
