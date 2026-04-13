export function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(data));
}

export function methodNotAllowed(res, allowed = ['GET']) {
  res.setHeader('Allow', allowed.join(', '));
  return json(res, 405, { error: `Method not allowed. Allowed: ${allowed.join(', ')}` });
}

export function serverError(res, error, fallback = 'Internal server error') {
  console.error(error);
  return json(res, 500, { error: fallback, details: error?.message ?? String(error) });
}
