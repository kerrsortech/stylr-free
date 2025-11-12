# Google PageSpeed Insights API - Complete Metrics Reference

## Overview
The PageSpeed Insights API v5 returns comprehensive Lighthouse data with **hundreds of metrics, audits, and opportunities**. Currently, we're only using **5 metrics** out of the available data.

## Current Usage (What We're Using Now)
- ✅ Performance Score (0-100)
- ✅ First Contentful Paint (FCP)
- ✅ Largest Contentful Paint (LCP)
- ✅ Time to First Byte (TTFB)
- ✅ Load Time (approximated)

---

## Complete Available Metrics from PageSpeed Insights API

### 📊 **Core Web Vitals (Critical Metrics)**
These are the most important metrics for SEO and user experience:

1. **First Contentful Paint (FCP)** ✅ *Currently using*
   - Path: `audits['first-contentful-paint']`
   - Good: ≤ 1.8s, Needs Improvement: 1.8-3.0s, Poor: > 3.0s

2. **Largest Contentful Paint (LCP)** ✅ *Currently using*
   - Path: `audits['largest-contentful-paint']`
   - Good: ≤ 2.5s, Needs Improvement: 2.5-4.0s, Poor: > 4.0s

3. **Cumulative Layout Shift (CLS)** ❌ *NOT using*
   - Path: `audits['cumulative-layout-shift']`
   - Good: ≤ 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
   - **Why important**: Measures visual stability - prevents layout shifts that annoy users

4. **Total Blocking Time (TBT)** ❌ *NOT using*
   - Path: `audits['total-blocking-time']`
   - Good: ≤ 200ms, Needs Improvement: 200-600ms, Poor: > 600ms
   - **Why important**: Measures interactivity - how long page blocks user input

5. **Speed Index** ❌ *NOT using*
   - Path: `audits['speed-index']`
   - Good: ≤ 3.4s, Needs Improvement: 3.4-5.8s, Poor: > 5.8s
   - **Why important**: Measures how quickly content is visually displayed

6. **Time to Interactive (TTI)** ❌ *NOT using*
   - Path: `audits['interactive']`
   - Good: ≤ 3.8s, Needs Improvement: 3.8-7.3s, Poor: > 7.3s
   - **Why important**: When page becomes fully interactive

7. **First Input Delay (FID)** / **Interaction to Next Paint (INP)** ❌ *NOT using*
   - Path: `audits['max-potential-fid']` or `audits['experimental-interaction-to-next-paint']`
   - **Why important**: Measures responsiveness to user interactions

---

### ⚡ **Performance Metrics (Additional)**

8. **Time to First Byte (TTFB)** ✅ *Currently using*
   - Path: `audits['server-response-time']`
   - Good: ≤ 800ms, Needs Improvement: 800-1800ms, Poor: > 1800ms

9. **First Meaningful Paint (FMP)** ❌ *NOT using*
   - Path: `audits['first-meaningful-paint']`
   - **Why important**: When primary content appears

10. **Estimated Input Latency** ❌ *NOT using*
    - Path: `audits['estimated-input-latency']`
    - **Why important**: Predicts input responsiveness

11. **Main Thread Work Breakdown** ❌ *NOT using*
    - Path: `audits['mainthread-work-breakdown']`
    - **Why important**: Shows what's blocking the main thread

12. **DOM Content Loaded** ❌ *NOT using*
    - Path: `audits['dom-size']` (DOM node count)
    - **Why important**: Large DOM affects performance

---

### 🖼️ **Image Optimization Metrics**

13. **Image Optimization Opportunities** ❌ *NOT using (currently estimated)*
    - Path: `audits['uses-optimized-images']`
    - Details: `audits['uses-optimized-images'].details.items[]`
    - **Available data**:
      - Image URL
      - Current size (bytes)
      - Potential savings (bytes)
      - Format recommendations (WebP, AVIF)
      - Dimensions
    - **Why important**: Real image data instead of estimates

14. **Properly Sized Images** ❌ *NOT using*
    - Path: `audits['uses-responsive-images']`
    - Shows images that could be resized

15. **Image Format Optimization** ❌ *NOT using*
    - Path: `audits['modern-image-formats']`
    - Recommends WebP, AVIF formats

16. **Image Aspect Ratio** ❌ *NOT using*
    - Path: `audits['image-aspect-ratio']`
    - Prevents layout shifts

---

### 📦 **Resource Loading Metrics**

17. **Render-Blocking Resources** ❌ *NOT using*
    - Path: `audits['render-blocking-resources']`
    - Details: Lists CSS/JS files blocking render
    - **Available data**:
      - Resource URL
      - Resource type
      - Potential savings (ms)
      - Size (bytes)

18. **Unused JavaScript** ❌ *NOT using*
    - Path: `audits['unused-javascript']`
    - Details: `audits['unused-javascript'].details.items[]`
    - **Available data**:
      - Script URL
      - Unused bytes
      - Total bytes
      - Wasted percentage

19. **Unused CSS** ❌ *NOT using*
    - Path: `audits['unused-css-rules']`
    - Details: `audits['unused-css-rules'].details.items[]`
    - **Available data**:
      - Stylesheet URL
      - Unused bytes
      - Potential savings

20. **JavaScript Execution Time** ❌ *NOT using*
    - Path: `audits['bootup-time']`
    - Details: `audits['bootup-time'].details.items[]`
    - **Available data**:
      - Script URL
      - Execution time (ms)
      - Script evaluation time

21. **Preload Key Requests** ❌ *NOT using*
    - Path: `audits['uses-rel-preload']`
    - Shows resources that should be preloaded

22. **Preconnect to Required Origins** ❌ *NOT using*
    - Path: `audits['uses-rel-preconnect']`
    - Shows origins that should be preconnected

23. **Critical Request Chains** ❌ *NOT using*
    - Path: `audits['critical-request-chains']`
    - Shows resource loading dependencies

24. **Resource Hints** ❌ *NOT using*
    - Path: `audits['uses-text-compression']`, `audits['uses-long-cache-ttl']`
    - Various resource optimization hints

---

### 🎨 **Rendering & Layout Metrics**

25. **Avoid Large Layout Shifts** ❌ *NOT using*
    - Path: `audits['layout-shift-elements']`
    - Details: `audits['layout-shift-elements'].details.items[]`
    - **Available data**:
      - Element selector
      - Layout shift score
      - Element dimensions

26. **Avoid Non-Composited Animations** ❌ *NOT using*
    - Path: `audits['non-composited-animations']`
    - Shows animations that could be optimized

27. **Minimize Main Thread Work** ❌ *NOT using*
    - Path: `audits['mainthread-work-breakdown']`
    - Breakdown of main thread activity

28. **Third-Party Usage** ❌ *NOT using*
    - Path: `audits['third-party-summary']`
    - Details: `audits['third-party-summary'].details.items[]`
    - **Available data**:
      - Third-party domain
      - Main thread time
      - Transfer size
      - Blocking time

---

### 🔍 **Network & Caching Metrics**

29. **Efficiently Encode Images** ❌ *NOT using*
    - Path: `audits['uses-optimized-images']` (already mentioned)

30. **Enable Text Compression** ❌ *NOT using*
    - Path: `audits['uses-text-compression']`
    - Details: Lists resources that could be compressed
    - **Available data**:
      - Resource URL
      - Current size
      - Potential savings

31. **Serve Static Assets with Efficient Cache Policy** ❌ *NOT using*
    - Path: `audits['uses-long-cache-ttl']`
    - Details: Lists resources with short cache TTL
    - **Available data**:
      - Resource URL
      - Cache TTL
      - Size

32. **Avoid Chaining Critical Requests** ❌ *NOT using*
    - Path: `audits['critical-request-chains']`

33. **Reduce Initial Server Response Time** ❌ *NOT using*
    - Path: `audits['server-response-time']` (already mentioned)

34. **Minimize Third-Party Impact** ❌ *NOT using*
    - Path: `audits['third-party-facades']`, `audits['third-party-summary']`

---

### 📱 **Mobile-Specific Metrics**

35. **Viewport Configuration** ❌ *NOT using*
    - Path: `audits['viewport']`
    - Checks if viewport meta tag is properly configured

36. **Tap Targets Size** ❌ *NOT using*
    - Path: `audits['tap-targets']`
    - Details: `audits['tap-targets'].details.items[]`
    - **Available data**:
      - Element selector
      - Size
      - Overlapping elements

37. **Content Width** ❌ *NOT using*
    - Path: `audits['content-width']`
    - Checks if content fits viewport

---

### 🎯 **Opportunities (Actionable Recommendations)**

All opportunities include:
- **Title**: What to fix
- **Description**: Why it matters
- **Numeric Value**: Potential savings (ms, bytes, etc.)
- **Details**: Specific resources/elements to fix

Key Opportunities:
- `audits['render-blocking-resources']` - Remove render-blocking resources
- `audits['uses-optimized-images']` - Optimize images
- `audits['unused-javascript']` - Remove unused JavaScript
- `audits['unused-css-rules']` - Remove unused CSS
- `audits['modern-image-formats']` - Use modern image formats
- `audits['uses-text-compression']` - Enable text compression
- `audits['uses-long-cache-ttl']` - Serve static assets with efficient cache policy
- `audits['offscreen-images']` - Defer offscreen images
- `audits['unminified-css']` - Minify CSS
- `audits['unminified-javascript']` - Minify JavaScript
- `audits['efficient-animated-content']` - Use efficient animated content
- `audits['legacy-javascript']` - Avoid legacy JavaScript
- `audits['preload-lcp-image']` - Preload Largest Contentful Paint image
- `audits['redirects']` - Avoid multiple page redirects
- `audits['uses-http2']` - Use HTTP/2
- `audits['dom-size']` - Avoid an excessive DOM size

---

### 📈 **Category Scores (Beyond Performance)**

38. **Accessibility Score** ❌ *NOT using*
    - Path: `lighthouseResult.categories.accessibility.score`
    - 0-1 scale (multiply by 100 for percentage)

39. **Best Practices Score** ❌ *NOT using*
    - Path: `lighthouseResult.categories['best-practices'].score`

40. **SEO Score** ❌ *NOT using*
    - Path: `lighthouseResult.categories.seo.score`
    - **Note**: We have separate SEO analysis, but this could complement it

41. **PWA Score** ❌ *NOT using*
    - Path: `lighthouseResult.categories.pwa.score`

---

### 🔧 **Technical Details Available**

42. **Runtime Settings** ❌ *NOT using*
    - Path: `lighthouseResult.runtimeSettings`
    - **Available data**:
      - User agent
      - Network throttling
      - CPU throttling
      - Device type

43. **Environment** ❌ *NOT using*
    - Path: `lighthouseResult.environment`
    - **Available data**:
      - Network user agent
      - Host user agent
      - Benchmark index

44. **Timing** ❌ *NOT using*
    - Path: `lighthouseResult.timing`
    - **Available data**:
      - Total audit time
      - Individual audit timings

45. **Requested URL** ❌ *NOT using*
    - Path: `lighthouseResult.requestedUrl`
    - Final URL after redirects

46. **Final URL** ❌ *NOT using*
    - Path: `lighthouseResult.finalUrl`

---

### 📋 **Structured Data & Meta Information**

47. **All Audits List** ❌ *NOT using*
    - Path: `lighthouseResult.audits` (object with 100+ audits)
    - Each audit has:
      - `id`: Audit identifier
      - `title`: Human-readable title
      - `description`: Explanation
      - `score`: 0-1 (null if not applicable)
      - `scoreDisplayMode`: 'numeric', 'binary', 'informative', etc.
      - `numericValue`: Numeric metric value
      - `numericUnit`: Unit (ms, bytes, etc.)
      - `displayValue`: Formatted display value
      - `details`: Detailed breakdown (items, headings, etc.)
      - `warnings`: Any warnings
      - `explanation`: Why audit passed/failed

---

## 📊 **Field Data (Real User Metrics)**

The API also provides **field data** from Chrome User Experience Report (CrUX):

48. **Field Data - FCP** ❌ *NOT using*
    - Path: `loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS`
    - Real user data (percentiles: p50, p75, p90)

49. **Field Data - LCP** ❌ *NOT using*
    - Path: `loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS`

50. **Field Data - FID** ❌ *NOT using*
    - Path: `loadingExperience.metrics.FIRST_INPUT_DELAY_MS`

51. **Field Data - CLS** ❌ *NOT using*
    - Path: `loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE`

52. **Field Data - TTFB** ❌ *NOT using*
    - Path: `loadingExperience.metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE`

53. **Field Data - Overall Category** ❌ *NOT using*
    - Path: `loadingExperience.overall_category`
    - "FAST", "AVERAGE", or "SLOW"

54. **Field Data - Origin Category** ❌ *NOT using*
    - Path: `loadingExperience.origin_fallback`

---

## 🎯 **Recommended Implementation Priority**

### **High Priority (Core Web Vitals + Critical Metrics)**
1. ✅ Cumulative Layout Shift (CLS) - **MUST ADD**
2. ✅ Total Blocking Time (TBT) - **MUST ADD**
3. ✅ Speed Index - **MUST ADD**
4. ✅ Time to Interactive (TTI) - **MUST ADD**
5. ✅ Interaction to Next Paint (INP) - **MUST ADD**

### **Medium Priority (Actionable Opportunities)**
6. ✅ Image Optimization (real data from audits)
7. ✅ Render-Blocking Resources
8. ✅ Unused JavaScript
9. ✅ Unused CSS
10. ✅ Text Compression opportunities

### **Low Priority (Nice to Have)**
11. ✅ Third-Party Usage breakdown
12. ✅ Field Data (real user metrics)
13. ✅ Accessibility Score
14. ✅ Best Practices Score
15. ✅ Additional category scores

---

## 💡 **Implementation Suggestions**

### **1. Enhanced Performance Metrics Component**
Add tabs or sections for:
- Core Web Vitals (FCP, LCP, CLS, TBT, INP)
- Loading Metrics (Speed Index, TTI)
- Resource Optimization (Images, JS, CSS)
- Network Metrics (TTFB, Compression, Caching)

### **2. Opportunities Dashboard**
Create a dedicated section showing:
- List of all opportunities with savings
- Prioritized by impact (time/bytes saved)
- Direct links to resources that need fixing
- Implementation difficulty indicators

### **3. Field Data vs Lab Data Comparison**
Show both:
- Lab data (simulated, consistent)
- Field data (real users, varies)
- Explain the difference

### **4. Detailed Resource Breakdown**
For each opportunity, show:
- Resource URL
- Current size/performance
- Potential savings
- Specific recommendations

### **5. Category Scores Overview**
Display all Lighthouse categories:
- Performance (current)
- Accessibility
- Best Practices
- SEO
- PWA

---

## 📝 **API Response Structure**

```typescript
{
  lighthouseResult: {
    categories: {
      performance: { score: 0.98, ... },
      accessibility: { score: 0.95, ... },
      'best-practices': { score: 0.92, ... },
      seo: { score: 0.88, ... },
      pwa: { score: 0.5, ... }
    },
    audits: {
      'first-contentful-paint': { ... },
      'largest-contentful-paint': { ... },
      'cumulative-layout-shift': { ... },
      'total-blocking-time': { ... },
      'uses-optimized-images': {
        details: {
          items: [
            {
              url: 'https://example.com/image.jpg',
              totalBytes: 500000,
              wastedBytes: 300000,
              ...
            }
          ]
        }
      },
      // ... 100+ more audits
    },
    timing: { ... },
    environment: { ... },
    runtimeSettings: { ... }
  },
  loadingExperience: {
    metrics: {
      FIRST_CONTENTFUL_PAINT_MS: { ... },
      LARGEST_CONTENTFUL_PAINT_MS: { ... },
      // ... more field metrics
    },
    overall_category: 'FAST'
  }
}
```

---

## 🚀 **Next Steps**

1. **Expand PerformanceMetrics interface** to include all Core Web Vitals
2. **Extract real image data** from `uses-optimized-images` audit
3. **Add Opportunities section** showing actionable recommendations
4. **Display Field Data** alongside Lab Data
5. **Show all category scores** (Performance, Accessibility, Best Practices, SEO)
6. **Create detailed resource breakdown** for each opportunity

This will transform your tool from showing basic metrics to providing comprehensive, actionable performance insights! 🎯

