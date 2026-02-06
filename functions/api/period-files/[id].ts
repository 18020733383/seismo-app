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
  const id = context.params.id as string;

  try {
    const row = await DB.prepare('SELECT * FROM period_files WHERE id = ?').bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(rowToPeriodFile(row)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const id = context.params.id as string;

  try {
    const body: any = await context.request.json();
    const now = Date.now();

    const existing = await DB.prepare('SELECT * FROM period_files WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const title =
      body.title === undefined ? String(existing.title) : String(body.title || '').trim();
    const startTs =
      body.startTs === undefined ? Number(existing.startTs) : Number(body.startTs);
    const endTs =
      body.endTs === undefined
        ? (existing.endTs === null || existing.endTs === undefined ? null : Number(existing.endTs))
        : body.endTs === null || body.endTs === '' || body.endTs === undefined
        ? null
        : Number(body.endTs);
    const status: PeriodFileStatus =
      body.status === undefined ? (isStatus(existing.status) ? existing.status : 'not_started') : isStatus(body.status) ? body.status : 'not_started';
    const description =
      body.description === undefined ? String(existing.description || '') : String(body.description || '');
    const entries =
      body.entries === undefined ? String(existing.entries || '[]') : JSON.stringify(Array.isArray(body.entries) ? body.entries : []);

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
      'UPDATE period_files SET title = ?, startTs = ?, endTs = ?, status = ?, description = ?, entries = ?, updatedAt = ? WHERE id = ?'
    )
      .bind(title, startTs, endTs, status, description, entries, now, id)
      .run();

    const updated = await DB.prepare('SELECT * FROM period_files WHERE id = ?').bind(id).first();
    return new Response(JSON.stringify(updated ? rowToPeriodFile(updated) : null), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
