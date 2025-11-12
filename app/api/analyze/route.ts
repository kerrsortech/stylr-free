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
    let scrapedData;
    try {
      console.log('[API] Starting product extraction...');
      scrapedData = await scrapeProductPage(url);
      console.log('[API] Product extraction completed');
    } catch (error: any) {
      // Log error with full context before sanitizing
      logError(error, 'product_extraction', { url });
      const errorResponse = createErrorResponse(error, 'product_extraction');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // 3. Run analyses in parallel (where possible)
    // No fallbacks - if any analysis fails, the entire request fails
    let seoAnalysis, performanceMetrics;
    try {
      console.log('[API] Starting parallel analysis (SEO + Performance)...');
      [seoAnalysis, performanceMetrics] = await Promise.all([
        analyzeSEO(scrapedData),
        fetchPerformanceMetrics(url),
      ]);
      console.log('[API] Parallel analysis completed');
    } catch (error: any) {
      // Log error with full context before sanitizing
      logError(error, 'parallel_analysis', { 
        url,
        hasScrapedData: !!scrapedData,
        scrapedDataKeys: scrapedData ? Object.keys(scrapedData) : []
      });
      const errorResponse = createErrorResponse(error, 'parallel_analysis');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // 4. Enhance content with LLM
    // No fallback - if enhancement fails, the entire request fails
    let contentEnhancement;
    try {
      console.log('[API] Starting content enhancement with LLM...');
      contentEnhancement = await enhanceContentWithLLM({
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
      }, url, scrapedData.technicalSEO);
      console.log('[API] Content enhancement completed');
    } catch (error: any) {
      // Log error with full context before sanitizing
      console.error('[API] Content enhancement failed:', error.message);
      logError(error, 'content_enhancement', { 
        url,
        hasScrapedData: !!scrapedData,
        title: scrapedData?.title?.substring(0, 100),
        descriptionLength: scrapedData?.description?.length || 0
      });
      const errorResponse = createErrorResponse(error, 'content_enhancement');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // 5. Calculate overall score
    const overallScore = calculateOverallScore(
      seoAnalysis,
      performanceMetrics,
      { contentQualityScore: contentEnhancement.contentQualityScore }
    );

    // 6. Estimate potential score
    const potentialScore = estimatePotentialScore(
      overallScore,
      seoAnalysis,
      performanceMetrics
    );

    // 7. Generate recommendations summary
    const recommendations = generateRecommendations(
      seoAnalysis,
      performanceMetrics,
      contentEnhancement,
      overallScore,
      potentialScore
    );

    // 8. Return comprehensive analysis
    return NextResponse.json({
      success: true,
      url,
      productInfo: {
        title: scrapedData.title,
        productType: scrapedData.productType,
        category: scrapedData.category,
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
          metrics: performanceMetrics.mobile,
        },
      },
      recommendations,
      scrapedData: {
        metaTitle: scrapedData.metaTitle,
        metaDescription: scrapedData.metaDescription,
        h1: scrapedData.h1,
        images: scrapedData.images,
        features: scrapedData.features,
        hasSchema: !!scrapedData.schema,
        technicalSEO: scrapedData.technicalSEO, // Include full technical SEO data
      },
      // Include all enhancement data
      fullEnhancement: contentEnhancement,
    });
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

  // Critical SEO issues
  const criticalIssues = seoAnalysis.checks.filter(
    (c: any) => c.priority === 'critical' && c.status !== 'pass'
  );
  criticalIssues.forEach((issue: any) => {
    priority.push({
      type: 'critical',
      message: issue.message,
      impact: '+15 SEO points',
    });
  });

  // High priority issues
  const highIssues = seoAnalysis.checks.filter(
    (c: any) => c.priority === 'high' && c.status !== 'pass'
  );
  highIssues.forEach((issue: any) => {
    priority.push({
      type: 'high',
      message: issue.message,
      impact: '+8 SEO points',
    });
  });

  // Performance issues
  if (performanceMetrics.images.unoptimizedCount > 0) {
    priority.push({
      type: 'high',
      message: `Optimize ${performanceMetrics.images.unoptimizedCount} images (reduce ${(performanceMetrics.images.totalSize / 1024 / 1024).toFixed(1)}MB → ~400KB)`,
      impact: '+10 Performance points',
    });
  }

  // Quick wins
  if (contentEnhancement.title.enhanced !== contentEnhancement.title.current) {
    quickWins.push('Copy enhanced title (30 seconds)');
  }
  if (contentEnhancement.features.enhanced.length > contentEnhancement.features.current.length) {
    quickWins.push(`Add ${contentEnhancement.features.enhanced.length - contentEnhancement.features.current.length} bullet points from suggestions (2 minutes)`);
  }
  if (seoAnalysis.checks.some((c: any) => c.name === 'Image Alt Texts' && c.status !== 'pass')) {
    quickWins.push('Update alt texts on images (5 minutes)');
  }

  const scoreImprovement = potentialScore - overallScore.total;
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

