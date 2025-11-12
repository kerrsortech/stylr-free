# Main Website Setup Instructions

This document contains the steps needed to configure your main website (stylr.tech) to route `/analyser` to this tool.

## Overview

- **Tool URL**: `https://stylr-free.vercel.app`
- **Target Route on Main Site**: `stylr.tech/analyser`
- **Main Website**: Already deployed on Vercel at `stylr.tech`

## Step 1: Configure Main Website (stylr.tech)

In your **main website's repository** (the one deployed at stylr.tech), create or update `vercel.json` in the root directory:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/analyser",
      "destination": "https://stylr-free.vercel.app"
    },
    {
      "source": "/analyser/:path*",
      "destination": "https://stylr-free.vercel.app/:path*"
    }
  ]
}
```

### Important Notes:

1. **The `:path*` wildcard** ensures all sub-routes and assets (CSS, JS, images, API calls) are properly forwarded
2. **Both rules are needed**:
   - First rule handles the base path `/analyser`
   - Second rule handles all sub-paths like `/analyser/api/analyze`, `/analyser/_next/static/...`, etc.
3. **No basePath needed** - The tool stays at root, the main website handles the routing

## Step 2: Deploy Main Website

1. Commit the `vercel.json` file to your main website's repository
2. Push to your repository
3. Vercel will automatically redeploy your main website with the new rewrite rules

## Step 3: Test the Configuration

After deployment, test by visiting:
- `https://stylr.tech/analyser` - Should load the tool seamlessly
- All assets (CSS, JS, images) should load correctly
- API calls should work properly
- The URL should remain as `stylr.tech/analyser` (not redirect to stylr-free.vercel.app)

## How It Works

When a user visits `stylr.tech/analyser`:
1. Vercel receives the request on your main website project
2. The rewrite rule matches `/analyser`
3. Vercel proxies the request to `https://stylr-free.vercel.app`
4. The response is served to the user, but the URL stays as `stylr.tech/analyser`
5. All assets and API calls are also proxied through the rewrite rules

## Troubleshooting

### If assets don't load:
- Verify both rewrite rules are present in `vercel.json`
- Check that the tool is accessible at `https://stylr-free.vercel.app` directly
- Ensure the main website has been redeployed after adding `vercel.json`

### If you see 404 errors:
- Check Vercel deployment logs for the main website
- Verify the destination URL is correct: `https://stylr-free.vercel.app`
- Make sure the tool is accessible at its direct URL first
- Check that the rewrite rules are in the correct format (JSON syntax)

### If the URL redirects to stylr-free.vercel.app:
- This means the rewrite isn't working - check the `vercel.json` syntax
- Ensure you're using `rewrites` not `redirects` (redirects change the URL, rewrites keep it)

## Vercel Dashboard Settings

No additional settings needed in the Vercel dashboard. The `vercel.json` file handles everything.

## Current Configuration Summary

- **Tool Project**: `stylr-free` (deployed at `stylr-free.vercel.app`)
- **Main Website Project**: Your main website (deployed at `stylr.tech`)
- **Routing**: Main website rewrites `/analyser/*` to tool project
- **Tool Configuration**: No changes needed - tool stays at root path
