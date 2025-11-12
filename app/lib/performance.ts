import { fetchWithTimeout } from './utils';
import { logError } from './error-handler';

export interface ImageOptimizationItem {
  url: string;
  totalBytes: number;
  wastedBytes: number;
  format?: string;
  width?: number;
  height?: number;
}

export interface ImageFormatItem {
  url: string;
  wastedBytes: number;
  format: string;
  webpSavingsBytes?: number;
  avifSavingsBytes?: number;
}

export interface PerformanceMetrics {
  desktop: {
    score: number;
    fcp: number; // First Contentful Paint (ms)
    lcp: number; // Largest Contentful Paint (ms)
    ttfb: number; // Time to First Byte (ms)
    loadTime: number; // Total load time (ms)
    speedIndex: number; // Speed Index (ms)
  };
  mobile: {
    score: number;
    fcp: number;
    lcp: number;
    ttfb: number;
    loadTime: number;
    speedIndex: number; // Speed Index (ms)
  };
  images: {
    totalSize: number; // bytes
    unoptimizedCount: number;
    totalCount: number;
    optimizationOpportunities: ImageOptimizationItem[]; // Real data from API
    formatOptimization: ImageFormatItem[]; // Real data from API
  };
  seo: {
    score: number; // SEO score from Lighthouse (0-100)
  };
  overallScore: number;
}

export async function fetchPerformanceMetrics(url: string): Promise<PerformanceMetrics> {
  const pagespeedApiKey = process.env.PAGESPEED_API_KEY;

  if (!pagespeedApiKey) {
    console.warn('[Performance] PAGESPEED_API_KEY not configured, using fallback metrics');
    logError(new Error('Performance analysis service not configured'), 'fetch_performance_metrics', { hasApiKey: false });
    return getFallbackPerformanceMetrics();
  }

  // Validate API key format early
  if (!pagespeedApiKey.startsWith('AIza')) {
    console.warn('[Performance] Invalid PAGESPEED_API_KEY format, using fallback metrics');
    logError(new Error('Invalid PageSpeed API key format'), 'fetch_performance_metrics', { 
      hasApiKey: true,
      keyPrefix: pagespeedApiKey.substring(0, 4)
    });
    return getFallbackPerformanceMetrics();
  }

  // Fetch both mobile and desktop metrics in parallel with error handling
  // If one fails, try to continue with the other
  // CRITICAL: This function MUST NEVER throw - it always returns valid metrics (real or fallback)
  let mobileData: any = null;
  let desktopData: any = null;
  
  try {
    console.log('[Performance] Starting parallel PageSpeed API requests (mobile + desktop)...');
    const results = await Promise.allSettled([
      fetchPageSpeedMetrics(url, 'mobile', pagespeedApiKey),
      fetchPageSpeedMetrics(url, 'desktop', pagespeedApiKey),
    ]);
    
    // Process results
    results.forEach((result, index) => {
      const strategy = index === 0 ? 'mobile' : 'desktop';
      if (result.status === 'fulfilled') {
        if (index === 0) {
          mobileData = result.value;
        } else {
          desktopData = result.value;
        }
        console.log(`[Performance] ${strategy} metrics retrieved successfully`);
      } else {
        console.error(`[Performance] ${strategy} metrics failed:`, result.reason?.message || 'Unknown error');
        logError(result.reason, 'fetch_pagespeed_metrics_settled', { 
          strategy,
          errorMessage: result.reason?.message,
          errorStack: result.reason?.stack?.substring(0, 200)
        });
        // Set to null - will use fallback or copy from other strategy
        if (index === 0) {
          mobileData = null;
        } else {
          desktopData = null;
        }
      }
    });
  } catch (error: any) {
    // This catch should never be hit since Promise.allSettled never rejects,
    // but handle it just in case
    console.error('[Performance] Unexpected error in Promise.allSettled:', error);
    logError(error, 'fetch_performance_metrics_parallel', {
      errorMessage: error?.message,
      errorStack: error?.stack?.substring(0, 200)
    });
    mobileData = null;
    desktopData = null;
  }

  // If both failed, provide fallback metrics
  if (!mobileData && !desktopData) {
    console.warn('[Performance] PageSpeed API failed for both mobile and desktop, using fallback metrics');
    return getFallbackPerformanceMetrics();
  }

  // If one succeeded, use it for both (better than nothing)
  if (!mobileData && desktopData) {
    console.warn('[Performance] Mobile PageSpeed failed, using desktop data for both');
    mobileData = desktopData;
  } else if (!desktopData && mobileData) {
    console.warn('[Performance] Desktop PageSpeed failed, using mobile data for both');
    desktopData = mobileData;
  }

  // Extract SEO score (same for both mobile and desktop, use mobile as source)
  // Try multiple paths to find SEO score with better error handling
  let seoScore = 0;
  
  try {
    // Try primary path: lighthouseResult.categories.seo.score
    if (mobileData.lighthouseResult?.categories?.seo?.score !== undefined) {
      seoScore = Math.round(mobileData.lighthouseResult.categories.seo.score * 100);
    } 
    // Fallback: try desktop data
    else if (desktopData.lighthouseResult?.categories?.seo?.score !== undefined) {
      seoScore = Math.round(desktopData.lighthouseResult.categories.seo.score * 100);
    }
    // Fallback: try audits
    else {
      const mobileAudits = mobileData.lighthouseResult?.audits || {};
      const desktopAudits = desktopData.lighthouseResult?.audits || {};
      
      const seoAuditKeys = Object.keys(mobileAudits).filter(key => 
        key.includes('meta') || key.includes('headings') || key.includes('link-text')
      );
      
      // SEO score not found - this is not critical, just log a warning
      if (seoAuditKeys.length === 0) {
        console.warn('[Performance] SEO score not found in Lighthouse result - using 0 as default');
        // Don't log as error - this is just informational
      }
      seoScore = 0;
    }
  } catch (error: any) {
    logError(error, 'fetch_performance_seo_score');
    seoScore = 0;
  }

  // Calculate image metrics from actual data (use mobile data as primary source)
  const imageMetrics = calculateImageMetrics(mobileData.lighthouseResult, desktopData.lighthouseResult);

  // Calculate overall performance score (weighted: mobile 60%, desktop 40%)
  const overallScore = Math.round(
    mobileData.score * 0.6 + desktopData.score * 0.4
  );

  return {
    desktop: {
      score: desktopData.score,
      fcp: desktopData.fcp,
      lcp: desktopData.lcp,
      ttfb: desktopData.ttfb,
      loadTime: desktopData.loadTime,
      speedIndex: desktopData.speedIndex,
    },
    mobile: {
      score: mobileData.score,
      fcp: mobileData.fcp,
      lcp: mobileData.lcp,
      ttfb: mobileData.ttfb,
      loadTime: mobileData.loadTime,
      speedIndex: mobileData.speedIndex,
    },
    images: imageMetrics,
    seo: {
      score: seoScore,
    },
    overallScore,
  };
}

async function fetchPageSpeedMetrics(
  url: string,
  strategy: 'mobile' | 'desktop',
  apiKey: string,
  retryCount: number = 0
): Promise<{
  score: number;
  fcp: number;
  lcp: number;
  ttfb: number;
  loadTime: number;
  speedIndex: number;
  lighthouseResult: any; // Full lighthouse result for extracting additional data
}> {
  // Validate API key format (should start with AIza)
  if (!apiKey || !apiKey.startsWith('AIza')) {
    const error = new Error('Invalid PageSpeed API key format. Key should start with "AIza"');
    logError(error, 'fetch_pagespeed_metrics', { 
      strategy,
      hasApiKey: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 4) : 'none'
    });
    throw error;
  }

  // Construct API URL with proper encoding
  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&key=${apiKey}&strategy=${strategy}`;
  const maxRetries = 2; // Retry up to 2 times for transient errors

  // Log API URL construction for debugging (without exposing full key)
  if (retryCount === 0) {
    console.log(`[PageSpeed] ${strategy} - URL length: ${url.length}, Encoded length: ${encodedUrl.length}, API URL length: ${apiUrl.length}`);
  }

  try {
    if (retryCount > 0) {
      console.log(`[PageSpeed] Retry attempt ${retryCount}/${maxRetries} for ${strategy}...`);
    } else {
      console.log(`[PageSpeed] Fetching ${strategy} metrics for: ${url.substring(0, 80)}...`);
    }
    
    // PageSpeed API can take 60+ seconds, increase timeout
    // Use 90 seconds to allow for slow pages
    const response = await fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StylrAI/1.0)',
      },
    }, 90000); // 90 seconds
    
    if (!response.ok) {
      // Check if it's a retryable error (500, 502, 503, 504, 429)
      const isRetryable = [500, 502, 503, 504, 429].includes(response.status);
      
      if (isRetryable && retryCount < maxRetries) {
        // Wait before retry (exponential backoff: 2s, 4s)
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[PageSpeed] ${strategy} got ${response.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchPageSpeedMetrics(url, strategy, apiKey, retryCount + 1);
      }
      // Get detailed error message from response
      let errorDetails = '';
      let errorJson: any = null;
      try {
        const errorText = await response.text();
        errorDetails = errorText.substring(0, 1000); // First 1000 chars
        
        // Try to parse as JSON for structured error
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use as text
        }
        
        console.error(`[PageSpeed API] Error ${response.status} details:`, errorDetails);
      } catch (e) {
        // If we can't read the error, just use status
        errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      }
      
      // Common error patterns
      let errorMessage = `PageSpeed API error: ${response.status}`;
      if (errorJson) {
        if (errorJson.error?.message) {
          errorMessage = `PageSpeed API error: ${errorJson.error.message}`;
        } else if (errorJson.error?.errors?.[0]?.message) {
          errorMessage = `PageSpeed API error: ${errorJson.error.errors[0].message}`;
        }
      }
      
      // Log full error for debugging
      logError(new Error(errorMessage), 'fetch_pagespeed_metrics_error', {
        strategy,
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorDetails.substring(0, 500),
        errorJson: errorJson ? JSON.stringify(errorJson).substring(0, 500) : null,
        url: url.substring(0, 100), // First 100 chars of URL
        apiKeyPrefix: apiKey.substring(0, 10), // First 10 chars for verification
      });
      
      throw new Error(errorMessage);
    }

    if (retryCount > 0) {
      console.log(`[PageSpeed] ${strategy} succeeded on retry ${retryCount}`);
    }

    const data = await response.json();
    
    if (!data.lighthouseResult) {
      const error = new Error('Invalid performance analysis response: missing data');
      logError(error, 'fetch_pagespeed_metrics', { 
        strategy, 
        responsePreview: JSON.stringify(data).substring(0, 500) 
      });
      throw error;
    }
    
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse.audits;

    // Extract metrics with proper fallbacks
    const score = Math.round((lighthouse.categories?.performance?.score || 0) * 100);
    const fcp = audits['first-contentful-paint']?.numericValue || 0;
    const lcp = audits['largest-contentful-paint']?.numericValue || 0;
    const ttfb = audits['server-response-time']?.numericValue || 0;
    const loadTime = audits['load-time']?.numericValue || audits['total-blocking-time']?.numericValue || 0;
    const speedIndex = audits['speed-index']?.numericValue || 0;

    return {
      score,
      fcp,
      lcp,
      ttfb,
      loadTime,
      speedIndex,
      lighthouseResult: lighthouse,
    };
  } catch (error: any) {
    logError(error, 'fetch_pagespeed_metrics', { strategy });
    throw new Error(`Failed to fetch ${strategy} performance metrics: ${error.message}`);
  }
}

function calculateImageMetrics(mobileLighthouse: any, desktopLighthouse: any): {
  totalSize: number;
  unoptimizedCount: number;
  totalCount: number;
  optimizationOpportunities: ImageOptimizationItem[];
  formatOptimization: ImageFormatItem[];
} {
  // Extract real image metrics from PageSpeed Insights audits
  // Use mobile data as primary source (more critical for performance)
  const mobileAudits = mobileLighthouse.audits || {};
  const desktopAudits = desktopLighthouse.audits || {};

  // Extract Image Optimization Opportunities
  const imageOptimizationAudit = mobileAudits['uses-optimized-images'] || desktopAudits['uses-optimized-images'];
  const optimizationOpportunities: ImageOptimizationItem[] = [];
  
  if (imageOptimizationAudit?.details?.items) {
    imageOptimizationAudit.details.items.forEach((item: any) => {
      optimizationOpportunities.push({
        url: item.url || '',
        totalBytes: item.totalBytes || 0,
        wastedBytes: item.wastedBytes || 0,
        format: item.mimeType || '',
        width: item.width,
        height: item.height,
      });
    });
  }

  // Extract Image Format Optimization (modern-image-formats)
  const formatOptimizationAudit = mobileAudits['modern-image-formats'] || desktopAudits['modern-image-formats'];
  const formatOptimization: ImageFormatItem[] = [];
  
  if (formatOptimizationAudit?.details?.items) {
    formatOptimizationAudit.details.items.forEach((item: any) => {
      formatOptimization.push({
        url: item.url || '',
        wastedBytes: item.wastedBytes || 0,
        format: item.mimeType || '',
        webpSavingsBytes: item.webpSavingsBytes,
        avifSavingsBytes: item.avifSavingsBytes,
      });
    });
  }

  // Calculate totals
  const totalSize = optimizationOpportunities.reduce((sum, img) => sum + img.totalBytes, 0);
  const unoptimizedCount = optimizationOpportunities.length;
  const totalCount = unoptimizedCount + (optimizationOpportunities.length > 0 ? 0 : 3); // Fallback if no data

  // If no real data found, provide fallback based on audit scores
  if (optimizationOpportunities.length === 0 && formatOptimization.length === 0) {
    const mobileScore = mobileLighthouse.categories?.performance?.score || 0;
    const desktopScore = desktopLighthouse.categories?.performance?.score || 0;
    const avgScore = (mobileScore + desktopScore) / 2;
    
    // Performance-based estimation
    if (avgScore < 0.5) {
      return {
        totalSize: 3000000,
        unoptimizedCount: 5,
        totalCount: 8,
        optimizationOpportunities: [],
        formatOptimization: [],
      };
    } else if (avgScore < 0.7) {
      return {
        totalSize: 1500000,
        unoptimizedCount: 3,
        totalCount: 5,
        optimizationOpportunities: [],
        formatOptimization: [],
      };
    } else {
      return {
        totalSize: 500000,
        unoptimizedCount: 0,
        totalCount: 3,
        optimizationOpportunities: [],
        formatOptimization: [],
      };
    }
  }

  return {
    totalSize,
    unoptimizedCount,
    totalCount: Math.max(totalCount, unoptimizedCount),
    optimizationOpportunities,
    formatOptimization,
  };
}

/**
 * Fallback performance metrics when PageSpeed API fails
 */
function getFallbackPerformanceMetrics(): PerformanceMetrics {
  return {
    desktop: {
      score: 50, // Neutral score
      fcp: 2000,
      lcp: 3000,
      ttfb: 500,
      loadTime: 4000,
      speedIndex: 3500,
    },
    mobile: {
      score: 50,
      fcp: 2500,
      lcp: 4000,
      ttfb: 600,
      loadTime: 5000,
      speedIndex: 4500,
    },
    images: {
      totalSize: 1000000, // 1MB estimate
      unoptimizedCount: 2,
      totalCount: 5,
      optimizationOpportunities: [],
      formatOptimization: [],
    },
    seo: {
      score: 0, // Will be calculated from SEO analysis instead
    },
    overallScore: 50,
  };
}

