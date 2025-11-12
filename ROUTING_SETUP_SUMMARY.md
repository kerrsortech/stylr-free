# Routing Setup Summary: stylr.tech/analyser → stylr-free.vercel.app

## ✅ Current Status

**Tool (stylr-free):**
- ✅ Deployed at: `https://stylr-free.vercel.app`
- ✅ Configured at root path (no basePath needed)
- ✅ Working correctly - verified at https://stylr-free.vercel.app/

**Main Website (stylr.tech):**
- ⚠️ Needs configuration in `vercel.json`

## 📋 What You Need to Do

### Step 1: Add Rewrites to Main Website

In your **main website's repository** (the one deployed at `stylr.tech`), add or update `vercel.json`:

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

### Step 2: Deploy Main Website

1. Commit the `vercel.json` file
2. Push to your repository
3. Vercel will automatically redeploy

### Step 3: Test

Visit `https://stylr.tech/analyser` - it should load the tool seamlessly.

## 🔍 How It Works

According to [Vercel's documentation](https://vercel.com/docs/edge-network/rewrites), rewrites allow you to:

1. **Proxy requests** from one path to another URL
2. **Keep the original URL** in the browser (unlike redirects)
3. **Forward all sub-paths** including assets and API calls

When a user visits `stylr.tech/analyser`:
- Vercel receives the request on your main website project
- The rewrite rule matches `/analyser`
- Vercel proxies the request to `https://stylr-free.vercel.app`
- The response is served, but the URL stays as `stylr.tech/analyser`
- All assets (`/analyser/_next/static/...`) and API calls (`/analyser/api/analyze`) are also proxied

## ⚙️ Vercel Dashboard Settings

**No changes needed in the Vercel dashboard!** The `vercel.json` file handles everything.

## ✅ Tool Configuration (Already Done)

The tool itself needs **no changes**:
- ✅ No `basePath` needed
- ✅ Works at root path
- ✅ All routes accessible normally
- ✅ API endpoints work at `/api/analyze`

## 🐛 Troubleshooting

### If you see 404 errors:
1. Verify `vercel.json` syntax is correct (valid JSON)
2. Check that both rewrite rules are present
3. Ensure the tool is accessible at `https://stylr-free.vercel.app`
4. Check Vercel deployment logs for the main website

### If assets don't load:
- The `:path*` wildcard should handle all sub-paths
- Verify both rewrite rules are in `vercel.json`
- Check browser console for specific asset loading errors

### If URL redirects to stylr-free.vercel.app:
- You might have used `redirects` instead of `rewrites`
- Use `rewrites` to keep the URL, `redirects` change it

## 📚 References

- [Vercel Rewrites Documentation](https://vercel.com/docs/edge-network/rewrites)
- [Vercel vercel.json Configuration](https://vercel.com/docs/projects/project-configuration)

