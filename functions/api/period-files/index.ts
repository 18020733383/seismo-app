interface Env {
  DB: D1Database;
}

type PeriodFileStatus = 'not_started' | 'in_progress' | 'done' | 'archived';

const isStatus = (v: unknown): v is PeriodFileStatus =>
  v === 'not_started' || v === 'in_progress' || v === 'done' || v === 'archived';

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const rowToPeriodFile = (row: any) => {
  const entries = safeJsonParse<any[]>(row.entries, []);
  return {
    id: String(row.id),
    title: String(row.title),
    startTs: Number(row.startTs),
    endTs: row.endTs === null || row.endTs === undefined ? null : Number(row.endTs),
    status: isStatus(row.status) ? row.status : 'not_started',
    description: row.description ? String(row.description) : '',
    entries: Array.isArray(entries) ? entries : [],
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const includeArchived = url.searchParams.get('includeArchived') === '1';

  try {
    const where = includeArchived ? '' : "WHERE status != 'archived'";
    const { results } = await DB.prepare(
      `SELECT * FROM period_files ${where} ORDER BY startTs DESC, createdAt DESC`
    ).all();

    return new Response(JSON.stringify(results.map(rowToPeriodFile)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;

  try {
    const body: any = await context.request.json();
    const now = Date.now();

    const id = String(body.id || '');
    const title = String(body.title || '').trim();
    const startTs = Number(body.startTs);
    const endTs = body.endTs === null || body.endTs === undefined || body.endTs === '' ? null : Number(body.endTs);
    const status: PeriodFileStatus = isStatus(body.status) ? body.status : 'not_started';
    const description = String(body.description || '');
    const entries = JSON.stringify(Array.isArray(body.entries) ? body.entries : []);

    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!Number.isFinite(startTs) || startTs <= 0) {
      return new Response(JSON.stringify({ error: 'startTs is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await DB.prepare(
      'INSERT INTO period_files (id, title, startTs, endTs, status, description, entries, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(id, title, startTs, endTs, status, description, entries, now, now)
      .run();

    const created = await DB.prepare('SELECT * FROM period_files WHERE id = ?').bind(id).first();

    return new Response(JSON.stringify(created ? rowToPeriodFile(created) : null), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
