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
 * Extract product data using HTML scraping for technical SEO elements
 * (meta tags, H1, images, schema, etc.)
 */
export async function scrapeProductPage(url: string): Promise<ScrapedProductData> {
  try {
    // Scrape HTML for technical SEO elements (reliable, fast)
    const technicalSEO = await scrapeTechnicalSEO(url);
    
    // Build data structure from technical SEO data only
    const mergedData = {
      // Technical SEO data (HTML scraping)
      metaTitle: technicalSEO.metaTitle || '',
      metaDescription: technicalSEO.metaDescription || '',
      h1: technicalSEO.h1 || '',
      h1Count: technicalSEO.h1Count || 0,
      images: technicalSEO.images || [],
      schema: technicalSEO.schema || null,
      
      // Use technical SEO data for basic fields
      title: technicalSEO.h1 || technicalSEO.metaTitle || 'Product',
      description: technicalSEO.metaDescription || '',
      features: [],
      price: '',
      productType: 'Product',
      category: '',
      ctaText: 'Add to Cart',
      brand: '',
      sku: '',
      availability: 'In Stock',
      
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
