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

### GitHub Pages deployment

This repo includes `.github/workflows/deploy-pages.yml` to build and deploy on pushes to `main`.

1. Go to `Settings` -> `Pages` in the GitHub repo.
2. Set `Build and deployment` -> `Source` to `GitHub Actions`.
3. Go to `Settings` -> `Secrets and variables` -> `Actions`.
4. Add repository secret:
   - `CONTENTFUL_PREVIEW_ACCESS_TOKEN` (required)
5. Add repository variables (optional, defaults are used if omitted):
   - `CONTENTFUL_SPACE_ID`
   - `CONTENTFUL_ENVIRONMENT`
   - `CONTENTFUL_CONTENT_TYPE_ID`
6. Push to `main` (or run the `Deploy to GitHub Pages` workflow manually from `Actions`).

Important: GitHub Pages is static hosting. Content is fetched at build time, so updates in Contentful appear after a new deployment.

### Routes

- `/`: landing list with search/filter/sort + 50-item pagination
- `/:id`: entry detail with English/Arabic side-by-side metadata in model order
- `/preview` and `/preview/:id`: compatibility redirects/routes
