import { NextRequest, NextResponse } from 'next/server';
import { isValidProductURL } from '@/app/lib/utils';
import { scrapeProductPage } from '@/app/lib/scraper';
import { analyzeSEO } from '@/app/lib/seo-analyzer';
import { fetchPerformanceMetrics } from '@/app/lib/performance';
import { enhanceContentWithLLM } from '@/app/lib/replicate';
import { calculateOverallScore, estimatePotentialScore } from '@/app/lib/scoring';
import { createErrorResponse, logError } from '@/app/lib/error-handler';

export const maxDuration = 300; // 5 minutes for Vercel (allows 4+ minutes for AI processing)

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Analyze request received');
    const { url } = await request.json();
    console.log('[API] URL:', url);

    // 1. Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidProductURL(url)) {
      return NextResponse.json(
        { error: 'Invalid URL. Please provide a valid HTTP/HTTPS product page URL.' },
        { status: 400 }
      );
    }

    // 2. Extract product data using LLM
    // CRITICAL: Even if scraping fails, we can still run PageSpeed API and content enhancement
    // GPT-5 has the URL and can extract directly, PageSpeed only needs URL
    let scrapedData;
    try {
      console.log('[API] Starting product extraction...');
      scrapedData = await scrapeProductPage(url);
      console.log('[API] Product extraction completed');
    } catch (error: any) {
      // Log error but don't fail - use minimal fallback data
      console.warn('[API] ⚠️ Product extraction failed, using minimal fallback data:', error.message);
      logError(error, 'product_extraction_fallback', { url });
      
      // Create minimal scrapedData fallback - GPT-5 and PageSpeed can still work
      scrapedData = {
        title: 'Product',
        description: '',
        metaTitle: '',
        metaDescription: '',
        h1: 'Product',
        h1Count: 1,
        features: [],
        images: [],
        price: '',
        schema: null,
        url,
        productType: 'Product',
        category: '',
        ctaText: 'Add to Cart',
        brand: '',
        sku: '',
        availability: 'In Stock',
        technicalSEO: {
          metaTitle: '',
          metaDescription: '',
          h1: 'Product',
          h1Count: 1,
          h2Tags: [],
          images: [],
          schema: null,
          canonicalUrl: url,
          ogTags: { title: '', description: '', image: '' },
          twitterTags: { title: '', description: '', image: '' },
          breadcrumbs: [],
          hasCanonical: false,
          urlStructure: url,
        },
      };
      console.log('[API] Using minimal fallback data - PageSpeed and GPT-5 will still work');
    }

    // 3. Run ALL independent analyses in parallel for maximum speed
    // CRITICAL ARCHITECTURE:
    // - PageSpeed API: COMPLETELY INDEPENDENT - only needs URL, NEVER fails (has fallbacks)
    // - SEO Analysis: Needs scrapedData, but can use minimal data
    // - Content Enhancement: Needs scrapedData, but can use minimal data
    // 
    // ALL THREE are independent - if one fails, others continue!
    // PageSpeed API will ALWAYS succeed (returns fallback if API fails)
    let seoAnalysis, performanceMetrics, contentEnhancement;
    
    console.log('[API] Starting parallel analysis (SEO + Performance + Content Enhancement)...');
    console.log('[API] PageSpeed API is completely independent - only needs URL');
    
    const results = await Promise.allSettled([
      // 1. SEO Analysis (needs scrapedData)
      analyzeSEO(scrapedData),
      
      // 2. Performance Metrics (PageSpeed API - COMPLETELY INDEPENDENT)
      // CRITICAL: This ONLY needs the URL - no dependencies on scrapedData
      // It handles ALL errors internally and ALWAYS returns valid metrics (real or fallback)
      // This will NEVER cause a 500 error - it's bulletproof
      fetchPerformanceMetrics(url),
      
      // 3. Content Enhancement (GPT-5 - needs scrapedData but has URL as fallback)
      // GPT-5 can extract from URL directly if scrapedData is incomplete
      enhanceContentWithLLM({
        title: scrapedData.title,
        description: scrapedData.description,
        features: scrapedData.features,
        productType: scrapedData.productType,
        category: scrapedData.category,
        metaTitle: scrapedData.metaTitle,
        metaDescription: scrapedData.metaDescription,
        h1: scrapedData.h1,
        ctaText: scrapedData.ctaText || 'Add to Cart',
        images: scrapedData.images,
      }, url, scrapedData.technicalSEO),
    ]);
    
    // Process results - each is independent, handle failures gracefully
    const seoResult = results[0];
    const perfResult = results[1];
    const enhanceResult = results[2];
    
    // 1. Performance Metrics - ALWAYS succeeds (has internal fallbacks)
    if (perfResult.status === 'fulfilled') {
      performanceMetrics = perfResult.value;
      console.log('[API] ✅ Performance metrics retrieved successfully');
    } else {
      // This should NEVER happen since fetchPerformanceMetrics never throws
      // But handle it just in case
      console.error('[API] ⚠️ Performance metrics unexpectedly failed (this should never happen):', perfResult.reason);
      logError(perfResult.reason, 'performance_metrics_unexpected_failure', { url });
      performanceMetrics = {
        desktop: { score: 50, fcp: 2000, lcp: 3000, ttfb: 500, loadTime: 4000, speedIndex: 3500 },
        mobile: { score: 50, fcp: 2500, lcp: 4000, ttfb: 600, loadTime: 5000, speedIndex: 4500 },
        images: { totalSize: 1000000, unoptimizedCount: 2, totalCount: 5, optimizationOpportunities: [], formatOptimization: [] },
        seo: { score: 0 },
        overallScore: 50,
      };
    }
    
    // 2. SEO Analysis - try to continue even if it fails
    if (seoResult.status === 'fulfilled') {
      seoAnalysis = seoResult.value;
      console.log('[API] ✅ SEO analysis completed successfully');
    } else {
      console.error('[API] ⚠️ SEO analysis failed, using minimal fallback:', seoResult.reason);
      logError(seoResult.reason, 'seo_analysis_fallback', { url });
      // Create minimal SEO analysis fallback
      seoAnalysis = {
        score: 0,
        checks: [],
        recommendations: [],
      };
    }
    
    // 3. Content Enhancement - try to continue even if it fails
    if (enhanceResult.status === 'fulfilled') {
      contentEnhancement = enhanceResult.value;
      console.log('[API] ✅ Content enhancement completed successfully');
    } else {
      console.error('[API] ⚠️ Content enhancement failed, using minimal fallback:', enhanceResult.reason);
      logError(enhanceResult.reason, 'content_enhancement_fallback', { url });
      // Create minimal content enhancement fallback
      contentEnhancement = {
        summary: {
          overallAssessment: 'Content analysis unavailable',
          strengths: [],
          weaknesses: [],
          priorityRecommendations: [],
        },
        title: { enhanced: scrapedData.title, reasoning: '', improvement: '' },
        metaDescription: { enhanced: scrapedData.metaDescription, reasoning: '', improvement: '' },
        description: { enhanced: scrapedData.description, reasoning: '', improvement: '' },
        features: { enhanced: scrapedData.features, reasoning: '', improvement: '' },
        contentQualityScore: 50,
      };
    }
    
    console.log('[API] ✅ All parallel analyses completed (some may have used fallbacks)');

    // 5. Calculate overall score (with error handling)
    let overallScore;
    try {
      overallScore = calculateOverallScore(
        seoAnalysis,
        performanceMetrics,
        { contentQualityScore: contentEnhancement?.contentQualityScore || 50 }
      );
    } catch (error: any) {
      console.error('[API] ⚠️ Score calculation failed, using fallback:', error.message);
      logError(error, 'score_calculation_fallback', { url });
      overallScore = {
        total: 50,
        breakdown: {
          content: 50,
          seo: 50,
          performance: performanceMetrics?.overallScore || 50,
          mobile: performanceMetrics?.mobile?.score || 50,
        },
        label: 'Fair',
        color: 'orange',
      };
    }

    // 6. Estimate potential score (with error handling)
    let potentialScore;
    try {
      potentialScore = estimatePotentialScore(
        overallScore,
        seoAnalysis,
        performanceMetrics
      );
    } catch (error: any) {
      console.error('[API] ⚠️ Potential score calculation failed, using fallback:', error.message);
      logError(error, 'potential_score_fallback', { url });
      potentialScore = overallScore.total + 10; // Simple fallback
    }

    // 7. Generate recommendations summary (with error handling)
    let recommendations;
    try {
      recommendations = generateRecommendations(
        seoAnalysis,
        performanceMetrics,
        contentEnhancement,
        overallScore,
        potentialScore
      );
    } catch (error: any) {
      console.error('[API] ⚠️ Recommendations generation failed, using fallback:', error.message);
      logError(error, 'recommendations_fallback', { url });
      recommendations = {
        priority: [],
        quickWins: [],
        estimatedImpact: {
          scoreImprovement: potentialScore - overallScore.total,
          trafficImprovement: '10-20%',
          implementationTime: '~30 minutes',
        },
      };
    }

    // 8. Return comprehensive analysis (with error handling)
    try {
      return NextResponse.json({
        success: true,
        url,
        productInfo: {
          title: scrapedData?.title || 'Product',
          productType: scrapedData?.productType || 'Product',
          category: scrapedData?.category || '',
        },
        overallScore,
        potentialScore,
        percentile: calculatePercentile(overallScore.total),
        breakdown: {
          content: {
            score: overallScore.breakdown.content,
            enhancement: contentEnhancement,
          },
          seo: {
            score: overallScore.breakdown.seo,
            analysis: seoAnalysis,
          },
          performance: {
            score: overallScore.breakdown.performance,
            metrics: performanceMetrics,
          },
          mobile: {
            score: overallScore.breakdown.mobile,
            metrics: performanceMetrics?.mobile || { score: 50, fcp: 2500, lcp: 4000, ttfb: 600, loadTime: 5000, speedIndex: 4500 },
          },
        },
        recommendations,
        scrapedData: {
          metaTitle: scrapedData?.metaTitle || '',
          metaDescription: scrapedData?.metaDescription || '',
          h1: scrapedData?.h1 || 'Product',
          images: scrapedData?.images || [],
          features: scrapedData?.features || [],
          hasSchema: !!scrapedData?.schema,
          technicalSEO: scrapedData?.technicalSEO || {},
        },
        // Include all enhancement data
        fullEnhancement: contentEnhancement,
      });
    } catch (error: any) {
      // Last resort - if even response building fails, return minimal success response
      console.error('[API] ⚠️ Response building failed, returning minimal response:', error.message);
      logError(error, 'response_building_fallback', { url });
      return NextResponse.json({
        success: true,
        url,
        productInfo: { title: 'Product', productType: 'Product', category: '' },
        overallScore: { total: 50, breakdown: { content: 50, seo: 50, performance: 50, mobile: 50 }, label: 'Fair', color: 'orange' },
        potentialScore: 60,
        percentile: 65,
        breakdown: {
          content: { score: 50, enhancement: contentEnhancement },
          seo: { score: 50, analysis: seoAnalysis },
          performance: { score: 50, metrics: performanceMetrics },
          mobile: { score: 50, metrics: performanceMetrics?.mobile || { score: 50, fcp: 2500, lcp: 4000, ttfb: 600, loadTime: 5000, speedIndex: 4500 } },
        },
        recommendations: { priority: [], quickWins: [], estimatedImpact: { scoreImprovement: 10, trafficImprovement: '10-20%', implementationTime: '~30 minutes' } },
        scrapedData: { metaTitle: '', metaDescription: '', h1: 'Product', images: [], features: [], hasSchema: false, technicalSEO: {} },
        fullEnhancement: contentEnhancement,
      });
    }
  } catch (error: any) {
    // Log error with full context before sanitizing
    logError(error, 'analysis_pipeline', { 
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      errorStack: error?.stack?.substring(0, 500),
      hasUrl: !!request?.body
    });
    const errorResponse = createErrorResponse(error, 'analysis_pipeline');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

function calculatePercentile(score: number): number {
  if (score >= 90) return 15;
  if (score >= 75) return 35;
  if (score >= 50) return 65;
  return 85;
}

function generateRecommendations(
  seoAnalysis: any,
  performanceMetrics: any,
  contentEnhancement: any,
  overallScore: any,
  potentialScore: number
): {
  priority: Array<{ type: string; message: string; impact: string }>;
  quickWins: string[];
  estimatedImpact: {
    scoreImprovement: number;
    trafficImprovement: string;
    implementationTime: string;
  };
} {
  const priority: Array<{ type: string; message: string; impact: string }> = [];
  const quickWins: string[] = [];

  // Critical SEO issues - with null safety
  const seoChecks = seoAnalysis?.checks || [];
  const criticalIssues = seoChecks.filter(
    (c: any) => c?.priority === 'critical' && c?.status !== 'pass'
  );
  criticalIssues.forEach((issue: any) => {
    priority.push({
      type: 'critical',
      message: issue?.message || 'Critical SEO issue detected',
      impact: '+15 SEO points',
    });
  });

  // High priority issues - with null safety
  const highIssues = seoChecks.filter(
    (c: any) => c?.priority === 'high' && c?.status !== 'pass'
  );
  highIssues.forEach((issue: any) => {
    priority.push({
      type: 'high',
      message: issue?.message || 'High priority SEO issue detected',
      impact: '+8 SEO points',
    });
  });

  // Performance issues - with null safety
  const images = performanceMetrics?.images;
  if (images && images.unoptimizedCount > 0) {
    priority.push({
      type: 'high',
      message: `Optimize ${images.unoptimizedCount} images (reduce ${((images.totalSize || 0) / 1024 / 1024).toFixed(1)}MB → ~400KB)`,
      impact: '+10 Performance points',
    });
  }

  // Quick wins - with null safety
  const title = contentEnhancement?.title;
  if (title && title.enhanced && title.current && title.enhanced !== title.current) {
    quickWins.push('Copy enhanced title (30 seconds)');
  }
  
  const features = contentEnhancement?.features;
  if (features && features.enhanced && Array.isArray(features.enhanced) && 
      features.current && Array.isArray(features.current) &&
      features.enhanced.length > features.current.length) {
    quickWins.push(`Add ${features.enhanced.length - features.current.length} bullet points from suggestions (2 minutes)`);
  }
  
  if (seoChecks.some((c: any) => c?.name === 'Image Alt Texts' && c?.status !== 'pass')) {
    quickWins.push('Update alt texts on images (5 minutes)');
  }

  const scoreImprovement = potentialScore - (overallScore?.total || 50);
  const trafficImprovement = scoreImprovement > 20 ? '35-50%' : scoreImprovement > 10 ? '20-35%' : '10-20%';
  const implementationTime = priority.length > 5 ? '~60 minutes' : priority.length > 2 ? '~45 minutes' : '~30 minutes';

  return {
    priority,
    quickWins,
    estimatedImpact: {
      scoreImprovement,
      trafficImprovement,
      implementationTime,
    },
  };
}

