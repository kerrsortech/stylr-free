# Vercel Deployment Guide

This document outlines the required environment variables and configuration for deploying Stylr Free to Vercel.

## Required Environment Variables

You **must** configure these environment variables in your Vercel project settings for the application to work properly:

### 1. `REPLICATE_API_TOKEN` (Required)
- **Purpose**: Authentication token for Replicate API to use GPT-5 for product extraction and content enhancement
- **Where to get it**: 
  1. Sign up at [replicate.com](https://replicate.com)
  2. Go to Account Settings → API Tokens
  3. Create a new token or copy your existing token
- **Format**: A string token (e.g., `r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- **Note**: Without this, you'll see "Service authentication not configured" errors

### 2. `PAGESPEED_API_KEY` (Recommended)
- **Purpose**: Google PageSpeed Insights API key for performance analysis
- **Where to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create a new project or select an existing one
  3. Enable the "PageSpeed Insights API"
  4. Go to APIs & Services → Credentials
  5. Create a new API key
  6. Restrict the key to "PageSpeed Insights API" for security
- **Format**: A string starting with `AIza` (e.g., `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- **Note**: Without this, the app will use fallback performance metrics (less accurate)

### 3. `REPLICATE_MODEL` (Optional)
- **Purpose**: Specify which Replicate model to use
- **Default**: `openai/gpt-5`
- **Other options**: You can use other models like `meta/llama-3-70b` or `anthropic/claude-3-opus`
- **Note**: Only set this if you want to use a different model than the default

## How to Add Environment Variables in Vercel

1. **Go to your Vercel project dashboard**
2. **Navigate to**: Settings → Environment Variables
3. **Add each variable**:
   - Click "Add New"
   - Enter the variable name (e.g., `REPLICATE_API_TOKEN`)
   - Enter the variable value
   - Select the environments where it applies (Production, Preview, Development)
   - Click "Save"
4. **Redeploy** your application after adding variables

## Verification

After deploying with environment variables:

1. **Check the logs** in Vercel dashboard → Deployments → [Your Deployment] → Functions → [Function Name] → Logs
2. **Look for**:
   - ✅ `[API] Analyze request received` - API is working
   - ✅ `[GPT-5 Extract] Starting product extraction` - Replicate API is configured
   - ✅ `[Performance] Starting parallel PageSpeed API requests` - PageSpeed API is configured
3. **If you see errors**:
   - ❌ `Service authentication not configured` → `REPLICATE_API_TOKEN` is missing or invalid
   - ❌ `Performance analysis service not configured` → `PAGESPEED_API_KEY` is missing or invalid
   - ❌ `Invalid PageSpeed API key format` → `PAGESPEED_API_KEY` doesn't start with `AIza`

## Common Issues

### Issue: "Service authentication not configured"
**Solution**: 
- Verify `REPLICATE_API_TOKEN` is set in Vercel environment variables
- Check that the token is correct (no extra spaces, complete token)
- Ensure the token is added to the correct environment (Production/Preview/Development)
- Redeploy after adding the variable

### Issue: "Performance analysis service not configured"
**Solution**:
- Verify `PAGESPEED_API_KEY` is set in Vercel environment variables
- Check that the API key starts with `AIza`
- Ensure PageSpeed Insights API is enabled in Google Cloud Console
- Verify the API key has proper permissions

### Issue: "Cannot read properties of undefined (reading 'length')"
**Solution**: 
- This has been fixed in the latest code
- Make sure you've deployed the latest version with the null safety fixes
- Redeploy if you're still seeing this error

## Testing Your Deployment

1. **Deploy to Vercel** with all environment variables configured
2. **Test with a product URL** (e.g., `https://vakkalhome.com/products/portable-iron`)
3. **Check the response**:
   - Should return analysis results
   - Should include SEO analysis
   - Should include performance metrics (real or fallback)
   - Should include content enhancements (if Replicate API is working)

## Security Best Practices

1. **Never commit** environment variables to Git
2. **Use Vercel's environment variables** feature (not `.env` files in production)
3. **Restrict API keys** in Google Cloud Console to specific APIs
4. **Rotate keys** periodically for security
5. **Use different keys** for production and preview environments if possible

## Cost Considerations

- **Replicate API**: Pay-per-use pricing. Check [replicate.com/pricing](https://replicate.com/pricing) for current rates
- **PageSpeed Insights API**: Free tier includes 25,000 requests per day
- **Vercel**: Free tier includes generous limits for hobby projects

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test API keys independently (outside of Vercel)
4. Review the error messages in the logs for specific guidance

