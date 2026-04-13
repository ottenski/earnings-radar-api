export function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

export function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let emaValue = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i += 1) {
    emaValue = values[i] * k + emaValue * (1 - k);
  }
  return emaValue;
}

export function rsi(values, period = 14) {
  if (values.length <= period) return null;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < values.length; i += 1) {
    const delta = values[i] - values[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(values, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  if (values.length < longPeriod + signalPeriod) return null;

  const macdLineSeries = [];
  for (let i = longPeriod - 1; i < values.length; i += 1) {
    const shortSlice = values.slice(0, i + 1);
    const longSlice = values.slice(0, i + 1);
    const shortEma = ema(shortSlice, shortPeriod);
    const longEma = ema(longSlice, longPeriod);
    if (shortEma !== null && longEma !== null) {
      macdLineSeries.push(shortEma - longEma);
    }
  }

  const signal = ema(macdLineSeries, signalPeriod);
  const macdLine = macdLineSeries.at(-1);
  if (signal === null || macdLine === undefined) return null;

  return {
    macd: macdLine,
    signal,
    histogram: macdLine - signal
  };
}

export function detectTrend(closePrices) {
  const ma50 = sma(closePrices, 50);
  const ma200 = sma(closePrices, 200);
  const last = closePrices.at(-1);
  if (last == null || ma50 == null || ma200 == null) return 'neutral';
  if (last > ma50 && ma50 > ma200) return 'bullish';
  if (last < ma50 && ma50 < ma200) return 'bearish';
  return 'sideways';
}

export function findLevels(candles, count = 3) {
  const highs = candles.map((c) => c.high).sort((a, b) => b - a);
  const lows = candles.map((c) => c.low).sort((a, b) => a - b);
  return {
    resistance: dedupeLevels(highs).slice(0, count),
    support: dedupeLevels(lows).slice(0, count)
  };
}

function dedupeLevels(levels, tolerancePercent = 0.5) {
  const result = [];
  for (const level of levels) {
    const exists = result.some((existing) => Math.abs((existing - level) / existing) * 100 < tolerancePercent);
    if (!exists) result.push(level);
  }
  return result;
}
