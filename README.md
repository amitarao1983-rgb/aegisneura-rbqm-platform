# AegisNeura RBQM Platform

Risk-based quality management (RBQM) for **remote clinical trial monitoring**. AegisNeura runs **automated statistical review** on trial data—site-level **Key Risk Indicators (KRIs)** and study-level **Quality Tolerance Limits (QTLs)**—without a manual review queue.

## Features

- **Multiple trial placeholders** with sample oncology, CNS, and Phase I studies
- **KRIs (site-specific):** adverse event rate, SAE rate, missed visit rate, off-schedule visit rate (±2 day window), missed IP administration rate, protocol deviation rate
- **QTLs (study-specific):** missed assessment rate, missed IP rate, SAE rate
- **Analytics:** relative risk (observed ÷ expected) and absolute QTL breach detection
- **Dark UI** optimized for monitoring workflows
- **EDC connectors** (Medidata Rave, Oracle Clinical One, Veeva CDMS placeholders) with one-click automated sync
- **Document intake:** PDF, CSV, PNG, Excel uploads
- **Site oversight:** 4–5 hospital sites per trial; functional leads raise queries / risk signals to sites from AI findings

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production (HTTPS)

Deploy to [Vercel](https://vercel.com) for a free `https://` URL:

```bash
npx vercel --prod
```

Or build and run anywhere Node 20+ is available:

```bash
npm run build
npm start
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/trials` | List trials with automated summary |
| `GET /api/trials/[id]` | Trial detail + full analysis |
| `POST /api/trials/[id]/analyze` | Re-run automated statistical review |
| `GET /api/edc/connectors` | List EDC connectors |
| `POST /api/edc/sync` | Pull EDC data (body: `{ "connectorId": "..." }`) |
| `POST /api/uploads` | Multipart upload (`file`, optional `trialId`) |
| `GET /api/oversight/findings` | AI-flagged KRI/QTL inbox (optional `trialId`) |
| `GET/POST/PATCH /api/risk-signals` | List, create, send draft risk signals to sites |

## License

Proprietary — AegisNeura Therapeutics (demo scaffold).
