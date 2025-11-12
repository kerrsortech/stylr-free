# Image Counting Fix - Summary

## Problem Identified

The Image Alt Texts check was showing incorrect counts (e.g., "66% of images have alt text (23/35)") when the user reported only 5 product images on the page.

### Root Cause

1. **HTML Scraper was counting ALL images**: The scraper was using `$('img').each()` which captures every `<img>` tag on the page, including:
   - Product images (5 as user reported)
   - Icons (favicons, social icons, etc.)
   - Logos
   - Decorative images
   - Background images
   - Spacer/pixel images
   - Navigation elements
   - **Total: 35 images** (as shown in the error)

2. **No filtering logic**: There was no distinction between product images and decorative/UI images.

3. **SEO Analyzer used all images**: The SEO analyzer counted all 35 images, not just the 5 product images.

## Solution Implemented

### 1. Smart Image Filtering (`html-scraper.ts`)

Added `isLikelyProductImage()` function that uses multiple heuristics to identify product images:

**Exclusion Patterns** (filters out):
- Icons, logos, favicons, sprites
- Buttons, badges, flags, social icons
- Navigation elements (arrows, menus, hamburgers)
- Advertisements and banners
- Very small images (< 100x100px)
- Data URIs and base64 images
- Small SVG files (< 200x200px)

**Inclusion Patterns** (includes):
- Images in product-related URL paths (`/product/`, `/media/`, `/images/`)
- Images in product containers (`.product-image`, `.gallery`, `.carousel`)
- Images with meaningful alt text (> 10 chars, not matching exclude patterns)
- Large images (≥ 200x200px) when size info is available

**Result**: Only product images are now counted for SEO analysis.

### 2. Enhanced Logging

Added detailed logging to track:
- Total images found on page
- Product images (after filtering)
- Non-product images (filtered out)
- Alt text coverage statistics

### 3. Updated SEO Analyzer Messages

Updated messages to clarify:
- "X% of **product images** have alt text (Y/Z **product images**)"
- Makes it clear we're only counting product images, not all page images

## URL Verification

✅ **URL is passed correctly** to all functions:
- `scrapeProductPage(url)` → uses same URL
- `scrapeTechnicalSEO(url)` → uses same URL  
- `fetchPerformanceMetrics(url)` → uses same URL
- `extractProductDataWithLLM(url, ...)` → uses same URL

All APIs receive the same URL, so there's no URL mismatch issue.

## Expected Results

After this fix:
- **Before**: "66% of images have alt text (23/35)" ❌
- **After**: "X% of product images have alt text (Y/5 product images)" ✅

The count should now match the actual number of product images on the page (5 in the user's case).

## Testing Recommendations

1. **Test with a product page** that has:
   - 5 product images
   - Multiple icons/logos
   - Navigation elements with images
   - Social media icons

2. **Verify the count** matches only product images

3. **Check console logs** for:
   - `[HTML Scraper] Total images found: X`
   - `[HTML Scraper] Product images (filtered): Y`
   - `[HTML Scraper] Non-product images (filtered out): Z`

4. **Verify SEO message** shows "product images" not just "images"

## Future Improvements

1. **Use PageSpeed API image data** as cross-reference
2. **Machine learning** to better identify product images
3. **User feedback** to improve filtering heuristics
4. **Configurable thresholds** for image size filtering

