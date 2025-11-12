# Main Website Setup Instructions

This document contains the steps needed to configure your main website (stylr.tech) to forward requests to this tool.

## Step 1: Tool Configuration (Already Done)

✅ The tool has been configured with `basePath: '/product-analyser'` in `next.config.js`
✅ The tool is deployed at: `stylr-free.vercel.app`

## Step 2: Configure Main Website (stylr.tech)

In your **main website's repository** (stylr.tech), create or update `vercel.json` in the root directory:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/product-analyser",
      "destination": "https://stylr-free.vercel.app/product-analyser"
    },
    {
      "source": "/product-analyser/:path*",
      "destination": "https://stylr-free.vercel.app/product-analyser/:path*"
    }
  ]
}
```

### Important Notes:

1. **The `:path*` wildcard** ensures all sub-routes and assets (CSS, JS, images, API calls) are properly forwarded
2. **Both rules are needed**:
   - First rule handles the base path `/product-analyser`
   - Second rule handles all sub-paths like `/product-analyser/api/analyze`, `/product-analyser/_next/static/...`, etc.

## Step 3: Deploy Main Website

1. Commit the `vercel.json` file to your main website's repository
2. Push to your repository
3. Vercel will automatically redeploy your main website with the new rewrite rules

## Step 4: Test the Configuration

After deployment, test by visiting:
- `https://stylr.tech/product-analyser` - Should load the tool seamlessly
- All assets (CSS, JS, images) should load correctly
- API calls should work properly
- The URL should remain as `stylr.tech/product-analyser` (not redirect to stylr-free.vercel.app)

## Troubleshooting

If assets don't load:
- Verify the `basePath` in the tool's `next.config.js` matches the rewrite path
- Check that both rewrite rules are present in `vercel.json`
- Ensure the tool has been redeployed after adding `basePath`

If you see 404 errors:
- Check Vercel deployment logs for the main website
- Verify the destination URL is correct: `https://stylr-free.vercel.app/product-analyser`
- Make sure the tool is accessible at its direct URL first

## Current Configuration

- **Tool URL**: `stylr-free.vercel.app`
- **Base Path**: `/product-analyser`
- **Target URL on Main Site**: `stylr.tech/product-analyser`

