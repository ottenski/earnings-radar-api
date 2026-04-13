# Earnings Radar API (V1)

Fertige Minimal-API für deinen Custom GPT mit Vercel Functions.

## Enthaltene Endpunkte

- `GET /api/quote`
- `GET /api/history`
- `GET /api/news`
- `GET /api/fx`
- `POST /api/investment-analysis`

## Benötigte API-Keys

- Twelve Data
- NewsAPI
- ExchangeRate API

## 1) Lokal vorbereiten

```bash
npm install
cp .env.example .env.local
```

Dann in `.env.local` deine echten Keys eintragen.

## 2) Lokal testen

```bash
npx vercel dev
```

## 3) Zu Vercel deployen

```bash
npm i -g vercel
vercel
```

Beim ersten Mal:
- bei Vercel einloggen
- Projekt anlegen
- Deployment bestätigen

## 4) Umgebungsvariablen in Vercel setzen

Im Vercel-Dashboard unter Projekt → Settings → Environment Variables:

- `TWELVEDATA_API_KEY`
- `NEWSAPI_KEY`
- `EXCHANGERATE_API_KEY`

Danach neu deployen.

## 5) OpenAPI-Schema für GPT Actions

Die Datei `openapi.yaml` im Projekt öffnen und hier ersetzen:

```yaml
servers:
  - url: https://YOUR-VERCEL-PROJECT.vercel.app
```

mit deiner echten Vercel-URL.

Danach den Inhalt von `openapi.yaml` in deinem GPT unter **Aktionen → Neue Aktion erstellen → Schema** einfügen.

## 6) Auth im GPT Builder

Im GPT Builder bei der Action:
- Authentifizierung: **Keine**

Warum? Weil die Fremd-API-Keys serverseitig in Vercel liegen und dein GPT nur deine eigene API aufruft.

## 7) Testaufrufe

### Quote
```bash
curl "https://YOUR-VERCEL-PROJECT.vercel.app/api/quote?symbol=AAPL&assetType=stock"
```

### History
```bash
curl "https://YOUR-VERCEL-PROJECT.vercel.app/api/history?symbol=AAPL&interval=1day&outputsize=120"
```

### News
```bash
curl "https://YOUR-VERCEL-PROJECT.vercel.app/api/news?query=Nvidia&limit=5"
```

### FX
```bash
curl "https://YOUR-VERCEL-PROJECT.vercel.app/api/fx?base=USD&quote=EUR"
```

### Investment Analysis
```bash
curl -X POST "https://YOUR-VERCEL-PROJECT.vercel.app/api/investment-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "assetType": "stock",
    "includeTechnical": true,
    "includeNews": true,
    "timeframe": "swing"
  }'
```

## 8) Wichtig für deinen GPT

Ergänze in den Hinweise deines GPT zusätzlich:

- Nutze `getQuote` für aktuelle Kurse
- Nutze `getHistory` für Trend, RSI, MACD, gleitende Durchschnitte, Unterstützungen und Widerstände
- Nutze `getNews` für aktuelle unternehmens- und marktbezogene Nachrichten
- Nutze `getFxRate` für USD/EUR-Umrechnungen
- Nutze `getInvestmentAnalysis` für eine vollständige strukturierte Analyse
- Wenn Action-Daten vorhanden sind, priorisiere diese gegenüber allgemeinem Wissen
- Kennzeichne fehlende Live-Daten klar

## 9) Grenzen dieser V1

Diese erste Version enthält noch nicht:

- echte Fundamentals / Earnings-Parsing
- Makrodaten
- Watchlist-Speicherung
- Alerts
- automatisches Elliott-Wellen-Mapping

Das kann in V2 ergänzt werden.
