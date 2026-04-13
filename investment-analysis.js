import { z } from 'zod';
import { getQuoteFromTwelveData, getTimeSeriesFromTwelveData, getNewsFromNewsApi } from '../lib/providers.js';
import { detectTrend, findLevels, macd, rsi, sma } from '../lib/indicators.js';
import { json, methodNotAllowed, serverError } from '../lib/http.js';

const bodySchema = z.object({
  symbol: z.string().min(1),
  assetType: z.enum(['stock', 'crypto', 'forex', 'commodity', 'etf', 'index']).default('stock'),
  includeTechnical: z.boolean().default(true),
  includeFundamental: z.boolean().default(false),
  includeNews: z.boolean().default(true),
  includeMacro: z.boolean().default(false),
  timeframe: z.enum(['intraday', 'swing', 'position']).default('swing')
});

function buildSummary({ symbol, trend, rsiValue, newsCount }) {
  const momentum = rsiValue == null ? 'neutral momentum' : rsiValue > 60 ? 'positive momentum' : rsiValue < 40 ? 'weak momentum' : 'mixed momentum';
  return `${symbol} currently shows a ${trend} technical structure with ${momentum}. Recent headlines reviewed: ${newsCount}. This is a structured market snapshot, not financial advice.`;
}

function macdSignalLabel(macdValue) {
  if (!macdValue) return 'neutral';
  if (macdValue.histogram > 0) return 'bullish crossover bias';
  if (macdValue.histogram < 0) return 'bearish crossover bias';
  return 'neutral';
}

function scoreAnalysis({ trend, rsiValue, macdValue, newsCount }) {
  let score = 50;
  if (trend === 'bullish') score += 20;
  if (trend === 'bearish') score -= 20;
  if (rsiValue != null) {
    if (rsiValue > 55 && rsiValue < 75) score += 10;
    if (rsiValue < 45) score -= 5;
    if (rsiValue > 80) score -= 5;
  }
  if (macdValue?.histogram > 0) score += 10;
  if (macdValue?.histogram < 0) score -= 10;
  if (newsCount > 0) score += 5;
  return Math.max(0, Math.min(100, score));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const input = bodySchema.parse(req.body);

    const [quote, history, news] = await Promise.all([
      getQuoteFromTwelveData(input.symbol),
      input.includeTechnical ? getTimeSeriesFromTwelveData(input.symbol, input.timeframe === 'intraday' ? '1h' : '1day', input.timeframe === 'position' ? 250 : 200) : Promise.resolve(null),
      input.includeNews ? getNewsFromNewsApi(input.symbol, 5) : Promise.resolve({ query: input.symbol, articles: [] })
    ]);

    const closes = history?.candles?.map((c) => c.close) ?? [];
    const trend = closes.length ? detectTrend(closes) : 'neutral';
    const rsiValue = closes.length ? rsi(closes, 14) : null;
    const macdValue = closes.length ? macd(closes) : null;
    const levels = history?.candles?.length ? findLevels(history.candles.slice(-80)) : { support: [], resistance: [] };
    const ma50 = closes.length ? sma(closes, 50) : null;
    const ma200 = closes.length ? sma(closes, 200) : null;
    const score = scoreAnalysis({ trend, rsiValue, macdValue, newsCount: news.articles.length });

    return json(res, 200, {
      symbol: input.symbol,
      summary: buildSummary({ symbol: input.symbol, trend, rsiValue, newsCount: news.articles.length }),
      technical: {
        trend,
        support: levels.support,
        resistance: levels.resistance,
        rsi: rsiValue,
        macdSignal: macdSignalLabel(macdValue),
        movingAverages: {
          ma50,
          ma200
        },
        elliottWaveView: 'Not automatically derived. Use only as a qualitative overlay in the GPT response.'
      },
      fundamental: {
        valuation: 'Not included in V1 API',
        earningsView: 'Not included in V1 API',
        growthView: 'Not included in V1 API'
      },
      newsImpact: {
        overallSentiment: news.articles.length ? 'neutral' : 'no fresh headlines fetched',
        keyDrivers: news.articles.slice(0, 3).map((article) => article.title)
      },
      macroImpact: {
        bias: 'Not included in V1 API',
        factors: []
      },
      scenarios: {
        bullCase: levels.resistance[0] ? `Break and hold above ${levels.resistance[0].toFixed(2)} could support continuation.` : 'Need more price history for a bull case.',
        bearCase: levels.support[0] ? `Loss of ${levels.support[0].toFixed(2)} would weaken the structure.` : 'Need more price history for a bear case.',
        riskLevel: score >= 70 ? 'moderate' : score >= 50 ? 'balanced' : 'elevated'
      },
      score,
      liveQuote: {
        price: quote.price,
        changePercent: quote.changePercent,
        currency: quote.currency,
        volume: quote.volume
      }
    });
  } catch (error) {
    return serverError(res, error, 'Failed to generate analysis');
  }
}
