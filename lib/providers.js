const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const NEWSAPI_BASE = 'https://newsapi.org/v2';
const EXCHANGERATE_BASE = 'https://v6.exchangerate-api.com/v6';

export async function getQuoteFromTwelveData(symbol) {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error('Missing TWELVEDATA_API_KEY');

  const url = new URL(`${TWELVEDATA_BASE}/quote`);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', key);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || 'Failed to load quote data');
  }

  return {
    symbol: data.symbol,
    name: data.name,
    exchange: data.exchange,
    currency: data.currency,
    price: Number(data.close),
    previousClose: Number(data.previous_close),
    change: Number(data.change),
    changePercent: Number(data.percent_change),
    volume: Number(data.volume),
    timestamp: new Date().toISOString()
  };
}

export async function getTimeSeriesFromTwelveData(symbol, interval = '1day', outputsize = 200) {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error('Missing TWELVEDATA_API_KEY');

  const url = new URL(`${TWELVEDATA_BASE}/time_series`);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', String(outputsize));
  url.searchParams.set('apikey', key);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || 'Failed to load historical data');
  }

  return {
    symbol: data.meta?.symbol ?? symbol,
    interval: data.meta?.interval ?? interval,
    candles: (data.values ?? []).map((item) => ({
      time: new Date(item.datetime).toISOString(),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume ?? 0)
    })).reverse()
  };
}

export async function getNewsFromNewsApi(query, pageSize = 5) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) throw new Error('Missing NEWSAPI_KEY');

  const url = new URL(`${NEWSAPI_BASE}/everything`);
  url.searchParams.set('q', query);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('language', 'en');

  const response = await fetch(url, {
    headers: { 'X-Api-Key': key }
  });
  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || 'Failed to load news');
  }

  return {
    query,
    articles: (data.articles ?? []).map((article) => ({
      title: article.title,
      source: article.source?.name ?? 'Unknown',
      publishedAt: article.publishedAt,
      url: article.url,
      summary: article.description ?? article.content ?? '',
      sentiment: 'neutral'
    }))
  };
}

export async function getFxRate(base, quote) {
  const key = process.env.EXCHANGERATE_API_KEY;
  if (!key) throw new Error('Missing EXCHANGERATE_API_KEY');

  const response = await fetch(`${EXCHANGERATE_BASE}/${key}/pair/${base}/${quote}`);
  const data = await response.json();

  if (!response.ok || data.result !== 'success') {
    throw new Error(data['error-type'] || 'Failed to load FX rate');
  }

  return {
    base,
    quote,
    rate: Number(data.conversion_rate),
    timestamp: new Date().toISOString()
  };
}
