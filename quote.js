import { z } from 'zod';
import { getQuoteFromTwelveData } from '../lib/providers.js';
import { json, methodNotAllowed, serverError } from '../lib/http.js';

const querySchema = z.object({
  symbol: z.string().min(1),
  assetType: z.string().optional()
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { symbol, assetType } = querySchema.parse(req.query);
    const quote = await getQuoteFromTwelveData(symbol);
    return json(res, 200, {
      symbol: quote.symbol,
      assetType: assetType ?? 'stock',
      price: quote.price,
      changePercent: quote.changePercent,
      volume: quote.volume,
      currency: quote.currency,
      timestamp: quote.timestamp,
      name: quote.name,
      exchange: quote.exchange
    });
  } catch (error) {
    return serverError(res, error, 'Failed to get quote');
  }
}
