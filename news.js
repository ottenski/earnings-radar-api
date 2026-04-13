import { z } from 'zod';
import { getNewsFromNewsApi } from '../lib/providers.js';
import { json, methodNotAllowed, serverError } from '../lib/http.js';

const querySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { query, limit } = querySchema.parse(req.query);
    const data = await getNewsFromNewsApi(query, limit);
    return json(res, 200, data);
  } catch (error) {
    return serverError(res, error, 'Failed to get news');
  }
}
