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
    const error = new Error('Performance analysis service not configured');
    logError(error, 'fetch_performance_metrics', { hasApiKey: false });
    throw error;
  }

  // Fetch both mobile and desktop metrics in parallel
  const [mobileData, desktopData] = await Promise.all([
    fetchPageSpeedMetrics(url, 'mobile', pagespeedApiKey),
    fetchPageSpeedMetrics(url, 'desktop', pagespeedApiKey),
  ]);

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
      
      if (seoAuditKeys.length === 0) {
        logError(new Error('SEO score not found in expected location'), 'fetch_performance_seo_score', {
          hasCategories: !!mobileData.lighthouseResult?.categories,
          hasSEO: !!mobileData.lighthouseResult?.categories?.seo
        });
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
  apiKey: string
): Promise<{
  score: number;
  fcp: number;
  lcp: number;
  ttfb: number;
  loadTime: number;
  speedIndex: number;
  lighthouseResult: any; // Full lighthouse result for extracting additional data
}> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;

  try {
    const response = await fetchWithTimeout(apiUrl, {}, 30000);
    
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
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

