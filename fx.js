import { z } from 'zod';
import { getFxRate } from '../lib/providers.js';
import { json, methodNotAllowed, serverError } from '../lib/http.js';

const querySchema = z.object({
  base: z.string().length(3).default('USD'),
  quote: z.string().length(3).default('EUR')
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { base, quote } = querySchema.parse(req.query);
    const data = await getFxRate(base.toUpperCase(), quote.toUpperCase());
    return json(res, 200, data);
  } catch (error) {
    return serverError(res, error, 'Failed to get FX rate');
  }
}
