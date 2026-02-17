## AlMadar Contentful Preview

Internal read-only preview UI for translation/editorial validation.

### Required environment variables

Create `.env.local`:

```bash
CONTENTFUL_SPACE_ID=your_contenful_space_id
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_CONTENT_TYPE_ID=your_contenful_content_type_id
# Use Preview API token for draft/changed visibility:
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_preview_api_token
# Optional fallback if you only want published content:
# CONTENTFUL_DELIVERY_ACCESS_TOKEN=your_delivery_api_token
```

### Run locally

```bash
pnpm dev
```

### Deploy on Vercel

This project is a standard Next.js app and can be deployed directly to Vercel.

1. Import this GitHub repository in Vercel.
2. Keep defaults for a Next.js project:
   - Framework Preset: `Next.js`
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
3. Add environment variables in `Project Settings` -> `Environment Variables`:
   - `CONTENTFUL_PREVIEW_ACCESS_TOKEN` (required)
   - `CONTENTFUL_SPACE_ID` (optional, defaults are used if omitted)
   - `CONTENTFUL_ENVIRONMENT` (optional, defaults are used if omitted)
   - `CONTENTFUL_CONTENT_TYPE_ID` (optional, defaults are used if omitted)
4. Deploy.

For production use, set the same variables for each environment you use in Vercel (`Production`, `Preview`, and `Development`).

### Routes

- `/`: landing list with search/filter/sort + 50-item pagination
- `/:id`: entry detail with English/Arabic side-by-side metadata in model order
- `/preview` and `/preview/:id`: compatibility redirects/routes
