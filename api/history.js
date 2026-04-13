import { z } from 'zod';
import { getTimeSeriesFromTwelveData } from '../lib/providers.js';
import { json, methodNotAllowed, serverError } from '../lib/http.js';

const querySchema = z.object({
  symbol: z.string().min(1),
  interval: z.enum(['1min', '5min', '15min', '1h', '4h', '1day', '1week']).default('1day'),
  outputsize: z.coerce.number().int().min(20).max(1000).default(200)
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { symbol, interval, outputsize } = querySchema.parse(req.query);
    const data = await getTimeSeriesFromTwelveData(symbol, interval, outputsize);
    return json(res, 200, data);
  } catch (error) {
    return serverError(res, error, 'Failed to get history');
  }
}
