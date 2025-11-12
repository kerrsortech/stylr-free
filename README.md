# Stylr Free - E-Commerce Product Page Analyzer

A free, lightweight web application that analyzes e-commerce product pages and provides actionable SEO and optimization insights. Works with **any product** from any e-commerce platform.

## Features

- 🚀 **Instant Analysis**: Get comprehensive analysis in seconds
- 🤖 **AI-Powered Enhancements**: See before/after content improvements with detailed reasoning
- 📊 **Comprehensive Scoring**: Overall score with breakdowns (Content 35%, SEO 30%, Performance 20%, Mobile 15%)
- 🎯 **Actionable Insights**: Specific recommendations with estimated impact
- 💯 **Zero Friction**: No signup, no database, completely free
- 🌐 **Universal Compatibility**: Works with any product page from any e-commerce platform

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **APIs**: 
  - Replicate API / OpenAI GPT-4 for product extraction and content enhancement
  - Google PageSpeed Insights for performance metrics
  - Custom SEO analyzer

## Getting Started

### Prerequisites

- Node.js 18+ installed
- API keys for:
  - Replicate API (or OpenAI API key as fallback)
  - Google PageSpeed Insights API

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Add your API keys to `.env.local`:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
PAGESPEED_API_KEY=your_pagespeed_key_here
```

**Getting API Keys:**
- **Replicate API**: Sign up at [replicate.com](https://replicate.com) and get your token from the account settings
- **PageSpeed Insights**: Get your key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Product Extraction**: Uses AI (ChatGPT via Replicate) to intelligently extract product data from any URL
2. **SEO Analysis**: Comprehensive checks for meta tags, schema markup, alt texts, and more
3. **Performance Metrics**: Analyzes page speed, load times, and image optimization
4. **Content Enhancement**: AI-powered suggestions for title, description, and features with detailed reasoning
5. **Scoring**: Weighted composite score with actionable recommendations

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPLICATE_API_TOKEN` | Yes* | Your Replicate API token |
| `OPENAI_API_KEY` | Yes* | Alternative to Replicate (use one or the other) |
| `PAGESPEED_API_KEY` | Recommended | Google PageSpeed Insights API key |
| `REPLICATE_MODEL` | No | Model name (default: `gpt-4`) |
| `USE_REPLICATE` | No | Set to `false` to use OpenAI directly |

*Either `REPLICATE_API_TOKEN` or `OPENAI_API_KEY` is required.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy!

The `vercel.json` file is already configured with:
- 60-second timeout for API routes
- CORS headers for API endpoints
- Optimized function settings

## Project Structure

```
stylr-free/
├── app/
│   ├── api/
│   │   └── analyze/          # Main analysis API endpoint
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── InputSection.tsx   # Landing page input
│   │   ├── LoadingState.tsx  # Loading progress
│   │   ├── ResultsDashboard.tsx # Main results view
│   │   └── ...                # Other components
│   ├── lib/
│   │   ├── scraper.ts         # Product extraction (LLM-based)
│   │   ├── replicate.ts       # LLM API integration
│   │   ├── seo-analyzer.ts    # SEO analysis
│   │   ├── performance.ts     # Performance metrics
│   │   └── scoring.ts         # Score calculation
│   └── page.tsx               # Main page
├── public/                     # Static assets
└── vercel.json                 # Vercel configuration
```

## Key Features Explained

### AI-Powered Product Understanding
The tool uses advanced LLM to understand any product type and provide contextual enhancements. It:
- Identifies product category and type
- Understands product context and target audience
- Provides relevant, actionable improvements

### Comprehensive Scoring
- **Content Quality (35%)**: Based on AI analysis of description quality, features, and engagement potential
- **SEO Health (30%)**: Technical SEO checks (meta tags, schema, alt texts, etc.)
- **Performance (20%)**: Page speed, load times, and optimization
- **Mobile Optimization (15%)**: Mobile-specific performance and usability

### Detailed Reasoning
Every AI enhancement includes:
- **Why it works**: Explanation of the improvement
- **Impact metrics**: Estimated improvement percentages
- **Best practices**: Industry-standard recommendations

## Troubleshooting

### API Errors
- **Replicate API**: Ensure your token is valid and you have sufficient credits
- **PageSpeed API**: Verify your API key has PageSpeed Insights API enabled
- **Rate Limits**: Both APIs have rate limits; implement retry logic if needed

### Extraction Issues
- If product extraction fails, the tool will show partial results
- Some pages may require JavaScript rendering (not currently supported)
- Ensure the URL is publicly accessible

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

