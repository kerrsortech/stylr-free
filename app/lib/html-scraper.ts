import * as cheerio from 'cheerio';
import { fetchWithTimeout } from './utils';
import { logError } from './error-handler';

/**
 * Determine if an image is likely a product image vs decorative/icon
 * Uses heuristics based on:
 * - Image dimensions (product images are typically larger)
 * - Image source URL patterns (product, media, image directories)
 * - Image context (parent elements, classes, IDs)
 * - File size indicators in URL
 */
function isLikelyProductImage(
  $img: cheerio.Cheerio<cheerio.Element>,
  src: string,
  width: number,
  height: number,
  baseUrl: string
): boolean {
  const srcLower = src.toLowerCase();
  const imgClass = ($img.attr('class') || '').toLowerCase();
  const imgId = ($img.attr('id') || '').toLowerCase();
  const parentClass = ($img.parent().attr('class') || '').toLowerCase();
  const parentId = ($img.parent().attr('id') || '').toLowerCase();
  
  // Exclude common non-product image patterns
  const excludePatterns = [
    'icon', 'logo', 'favicon', 'sprite', 'spacer', 'pixel',
    'button', 'badge', 'flag', 'social', 'share', 'avatar',
    'thumbnail', 'thumb', 'placeholder', 'loading', 'spinner',
    'arrow', 'chevron', 'close', 'menu', 'hamburger', 'nav',
    'ad', 'advertisement', 'banner', 'promo'
  ];
  
  // Check if image matches exclusion patterns
  const combinedText = `${srcLower} ${imgClass} ${imgId} ${parentClass} ${parentId}`;
  for (const pattern of excludePatterns) {
    if (combinedText.includes(pattern)) {
      return false;
    }
  }
  
  // Exclude very small images (likely icons/sprites)
  // Product images are typically at least 100x100px
  if (width > 0 && height > 0) {
    if (width < 100 || height < 100) {
      return false;
    }
  }
  
  // Exclude data URIs and base64 images (often icons/sprites)
  if (src.startsWith('data:') || src.includes('base64')) {
    return false;
  }
  
  // Exclude SVG files (often icons/logos, though some products use SVG)
  // We'll be conservative and include SVGs if they're large enough
  if (srcLower.endsWith('.svg') && (width < 200 || height < 200)) {
    return false;
  }
  
  // Include images that are likely product images based on URL patterns
  const productPatterns = [
    'product', 'item', 'goods', 'merchandise', 'catalog',
    'media', 'image', 'photo', 'picture', 'gallery',
    'cdn', 'assets', 'uploads', 'images', 'pics'
  ];
  
  // Check if URL contains product-related patterns
  for (const pattern of productPatterns) {
    if (srcLower.includes(pattern)) {
      // Additional check: make sure it's not in an exclude pattern
      let hasExcludePattern = false;
      for (const exclude of excludePatterns) {
        if (srcLower.includes(exclude)) {
          hasExcludePattern = true;
          break;
        }
      }
      if (!hasExcludePattern) {
        return true;
      }
    }
  }
  
  // Check parent context - product images are often in specific containers
  const productContainerPatterns = [
    'product', 'gallery', 'carousel', 'slider', 'main-image',
    'featured', 'hero', 'banner-image', 'product-image'
  ];
  
  for (const pattern of productContainerPatterns) {
    if (parentClass.includes(pattern) || parentId.includes(pattern)) {
      return true;
    }
  }
  
  // Check if image has meaningful alt text (product images usually do)
  const alt = ($img.attr('alt') || '').trim();
  if (alt.length > 10 && !excludePatterns.some(p => alt.toLowerCase().includes(p))) {
    // Likely a product image if it has descriptive alt text
    return true;
  }
  
  // Default: if we can't determine, include it if it's reasonably sized
  // This is conservative - we'd rather include a few non-product images
  // than exclude actual product images
  if (width > 0 && height > 0) {
    return width >= 200 && height >= 200;
  }
  
  // If no size info, include it but log for review
  // Most modern sites have product images that are substantial
  return true; // Default to include, but will be filtered by other checks
}

export interface TechnicalSEOData {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  h1Count: number;
  h2Tags: string[];
  images: Array<{ src: string; alt: string }>;
  schema: any;
  canonicalUrl: string;
  ogTags: {
    title: string;
    description: string;
    image: string;
  };
  twitterTags: {
    title: string;
    description: string;
    image: string;
  };
  breadcrumbs: string[];
  hasCanonical: boolean;
  urlStructure: string;
}

/**
 * Scrape HTML and extract all technical SEO elements
 * This handles the technical extraction that AI might miss
 */
export async function scrapeTechnicalSEO(url: string): Promise<TechnicalSEOData> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    }, 30000);

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract meta title
    const metaTitle = $('title').first().text().trim() || '';

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || 
                           $('meta[property="og:description"]').attr('content')?.trim() || '';

    // Extract H1 tags
    const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get();
    const h1 = h1Tags[0] || '';
    const h1Count = h1Tags.length;

    // Extract H2 tags
    const h2Tags = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10); // Limit to first 10

    // Extract images with alt text - focus on product images
    // Filter out icons, logos, decorative images, and small images
    const allImages: Array<{ src: string; alt: string; width?: number; height?: number; isProductImage?: boolean }> = [];
    const productImages: Array<{ src: string; alt: string }> = [];
    
    $('img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || 
                  $img.attr('data-src') || 
                  $img.attr('data-lazy-src') ||
                  $img.attr('data-original') ||
                  '';
      const alt = $img.attr('alt') || '';
      
      // Get dimensions (from attributes or CSS)
      const width = parseInt($img.attr('width') || $img.css('width') || '0', 10);
      const height = parseInt($img.attr('height') || $img.css('height') || '0', 10);
      
      if (src) {
        try {
          // Convert relative URLs to absolute
          let absoluteSrc = src;
          if (!src.startsWith('http')) {
            // Handle protocol-relative URLs
            if (src.startsWith('//')) {
              absoluteSrc = new URL(url).protocol + src;
            } else {
              absoluteSrc = new URL(src, url).href;
            }
          }
          
          // Heuristics to identify product images vs decorative images
          const isProductImage = isLikelyProductImage($img, src, width, height, url);
          
          allImages.push({ 
            src: absoluteSrc, 
            alt: alt.trim(),
            width: width || undefined,
            height: height || undefined,
            isProductImage
          });
          
          // Only include product images in the final list
          if (isProductImage) {
            productImages.push({ src: absoluteSrc, alt: alt.trim() });
          }
        } catch (e) {
          // Skip invalid URLs - log server-side only
          logError(e, 'html_scraper_image_url', { src: src.substring(0, 100) });
        }
      }
    });
    
    // Use product images for SEO analysis
    const images = productImages;

    // Extract schema markup (JSON-LD) - comprehensive extraction
    let schema: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          // Look for Product schema (handle both single objects and arrays)
          if (parsed['@type'] === 'Product') {
            schema = parsed;
          } else if (Array.isArray(parsed)) {
            const productSchema = parsed.find((item: any) => item['@type'] === 'Product');
            if (productSchema) {
              schema = productSchema;
            }
          } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
            // Handle @graph structure
            const productSchema = parsed['@graph'].find((item: any) => item['@type'] === 'Product');
            if (productSchema) {
              schema = productSchema;
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON - log server-side only
        logError(e, 'html_scraper_schema_parse');
      }
    });

    // Extract canonical URL
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
    const hasCanonical = !!canonicalUrl;

    // Extract Open Graph tags
    const ogTags = {
      title: $('meta[property="og:title"]').attr('content')?.trim() || '',
      description: $('meta[property="og:description"]').attr('content')?.trim() || '',
      image: $('meta[property="og:image"]').attr('content')?.trim() || '',
    };

    // Extract Twitter Card tags
    const twitterTags = {
      title: $('meta[name="twitter:title"]').attr('content')?.trim() || 
             $('meta[property="twitter:title"]').attr('content')?.trim() || '',
      description: $('meta[name="twitter:description"]').attr('content')?.trim() || 
                  $('meta[property="twitter:description"]').attr('content')?.trim() || '',
      image: $('meta[name="twitter:image"]').attr('content')?.trim() || 
             $('meta[property="twitter:image"]').attr('content')?.trim() || '',
    };

    // Extract breadcrumbs (try schema first, then HTML)
    const breadcrumbs: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          if (parsed['@type'] === 'BreadcrumbList' && Array.isArray(parsed.itemListElement)) {
            parsed.itemListElement.forEach((item: any) => {
              if (item.item?.name) {
                breadcrumbs.push(item.item.name);
              }
            });
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    // Fallback: try to extract from nav/ol elements
    if (breadcrumbs.length === 0) {
      $('nav[aria-label*="breadcrumb" i] a, ol.breadcrumb a, .breadcrumb a').each((_, el) => {
        const text = $(el).text().trim();
        if (text) breadcrumbs.push(text);
      });
    }

    // Analyze URL structure
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    const isCleanURL = /^\/[a-z0-9\-/]+$/i.test(urlPath) && !urlPath.includes('?');
    const urlStructure = isCleanURL ? 'clean' : 'needs-improvement';

    return {
      metaTitle,
      metaDescription,
      h1,
      h1Count,
      h2Tags,
      images,
      schema,
      canonicalUrl,
      ogTags,
      twitterTags,
      breadcrumbs,
      hasCanonical,
      urlStructure,
    };
  } catch (error: any) {
    logError(error, 'scrape_technical_seo');
    throw new Error(`Failed to scrape HTML: ${error.message}`);
  }
}

