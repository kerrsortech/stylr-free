import { extractProductDataWithLLM } from './replicate';
import { scrapeTechnicalSEO, TechnicalSEOData } from './html-scraper';
import { logError } from './error-handler';

export interface ScrapedProductData {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  h1Count: number;
  features: string[];
  images: Array<{ src: string; alt: string }>;
  price: string;
  schema: any;
  url: string;
  productType: string;
  category: string;
  ctaText?: string;
  brand?: string;
  sku?: string;
  availability?: string;
  // Additional technical SEO data
  technicalSEO: TechnicalSEOData;
}

/**
 * Extract product data using a hybrid approach:
 * 1. HTML scraping for technical SEO elements (meta tags, H1, images, schema, etc.)
 * 2. AI for content understanding and product-specific data
 */
export async function scrapeProductPage(url: string): Promise<ScrapedProductData> {
  try {
    // Step 1: Scrape HTML for technical SEO elements (reliable, fast)
    const technicalSEO = await scrapeTechnicalSEO(url);
    
    // Step 2: Use AI for content understanding and product-specific extraction
    const extractedData = await extractProductDataWithLLM(url, technicalSEO);
    
    // Merge technical SEO data with AI extracted data
    // Technical SEO (HTML scraping) is more reliable for meta tags, H1, images, schema
    // AI is better for content understanding (product description, features, context)
    
    // Validate and merge data with proper fallbacks
    const mergedData = {
      // Technical SEO takes priority (more reliable for HTML elements)
      metaTitle: technicalSEO.metaTitle || extractedData.title || '',
      metaDescription: technicalSEO.metaDescription || extractedData.metaDescription || '',
      h1: technicalSEO.h1 || extractedData.h1 || extractedData.title || '',
      h1Count: technicalSEO.h1Count || 0,
      images: technicalSEO.images.length > 0 ? technicalSEO.images : (Array.isArray(extractedData.images) ? extractedData.images : []),
      schema: technicalSEO.schema || extractedData.schema || null,
      
      // AI data for content understanding (more reliable for semantic content)
      title: extractedData.title || technicalSEO.h1 || '',
      description: (extractedData.description || '').trim(),
      features: Array.isArray(extractedData.features) && extractedData.features.length > 0 
        ? extractedData.features.filter((f: string) => f && f.trim().length > 0)
        : [],
      price: (extractedData.price || '').trim(),
      productType: (extractedData.productType || 'Product').trim(),
      category: (extractedData.category || '').trim(),
      ctaText: (extractedData.ctaText || 'Add to Cart').trim(),
      brand: (extractedData.brand || '').trim(),
      sku: (extractedData.sku || '').trim(),
      availability: (extractedData.availability || 'In Stock').trim(),
      
      url,
      technicalSEO, // Include full technical SEO data for reference
    };
    
    // Validate data quality - log warnings but don't fail
    // Some products may legitimately have empty descriptions (e.g., Amazon products with minimal info)
    if (mergedData.description.length === 0) {
      console.warn('[Scraper] Description is empty - continuing with analysis');
      logError(new Error('Description is empty'), 'scrape_product_validation', {
        hasTitle: !!mergedData.title,
        hasMetaTitle: !!mergedData.metaTitle,
        hasFeatures: mergedData.features.length > 0,
        extractedDataKeys: Object.keys(extractedData)
      });
      // Use meta description as fallback if available
      if (mergedData.metaDescription && mergedData.metaDescription.length > 0) {
        mergedData.description = mergedData.metaDescription;
        console.log('[Scraper] Using meta description as fallback for description');
      }
    } else if (mergedData.description.length < 200) {
      console.warn(`[Scraper] Description is very short (${mergedData.description.length} chars) - continuing with analysis`);
      logError(new Error('Description is very short'), 'scrape_product_validation', {
        descriptionLength: mergedData.description.length
      });
    }
    
    return mergedData;
  } catch (error: any) {
    logError(error, 'scrape_product_page');
    throw new Error(`Failed to extract product data: ${error.message}`);
  }
}
