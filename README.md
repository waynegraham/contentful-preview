## AlMadar Contentful Preview

Internal read-only preview UI for translation/editorial validation.

### Required environment variables

Create `.env.local`:

```bash
CONTENTFUL_SPACE_ID=t7x0vaz0zty0
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_CONTENT_TYPE_ID=alMadarCsv
# Use Preview API token for draft/changed visibility:
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_preview_api_token
# Optional fallback if you only want published content:
# CONTENTFUL_DELIVERY_ACCESS_TOKEN=your_delivery_api_token
```

### Run

```bash
pnpm dev
```

### Routes

- `/preview` and `/` : landing list with search/filter/sort + 50-item pagination
- `/preview/:id` : entry detail with English/Arabic side-by-side metadata in model order
