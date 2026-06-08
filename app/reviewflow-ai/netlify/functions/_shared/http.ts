export function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(body),
  };
}
export function bad(msg: string, status = 400) { return json(status, { error: msg }); }
export function ok(body: unknown) { return json(200, body); }

export function parseBody<T = any>(event: { body?: string | null }): T {
  try { return event.body ? (JSON.parse(event.body) as T) : ({} as T); }
  catch { return {} as T; }
}
