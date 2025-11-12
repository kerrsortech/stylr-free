import { SEOAnalysis } from './seo-analyzer';
import { PerformanceMetrics } from './performance';

export interface ContentEnhancement {
  contentQualityScore: number;
}

export interface OverallScore {
  total: number;
  breakdown: {
    content: number;
    seo: number;
    performance: number;
    mobile: number;
  };
  label: string;
  color: string;
}

/**
 * Calculate overall optimization score with weighted components:
 * - Content Quality: 35%
 * - SEO Optimization: 30%
 * - Performance: 20%
 * - Mobile Optimization: 15%
 * 
 * Uses deterministic rounding to ensure consistent scores for the same inputs
 */
export function calculateOverallScore(
  seoAnalysis: SEOAnalysis,
  performanceMetrics: PerformanceMetrics,
  contentEnhancement: ContentEnhancement
): OverallScore {
  // Ensure all scores are valid numbers (0-100)
  const contentScore = Math.max(0, Math.min(100, contentEnhancement.contentQualityScore || 0));
  const seoScore = Math.max(0, Math.min(100, seoAnalysis.score || 0));
  const performanceScore = Math.max(0, Math.min(100, performanceMetrics.overallScore || 0));
  const mobileScore = Math.max(0, Math.min(100, performanceMetrics.mobile.score || 0));

  // Weighted calculation with deterministic rounding
  // Use Math.floor to ensure consistent rounding (no floating point precision issues)
  const weightedSum = 
    contentScore * 0.35 +
    seoScore * 0.30 +
    performanceScore * 0.20 +
    mobileScore * 0.15;
  
  // Round to nearest integer deterministically
  const total = Math.round(weightedSum);

  // Determine label and color
  let label: string;
  let color: string;

  if (total >= 90) {
    label = 'Excellent';
    color = 'green';
  } else if (total >= 75) {
    label = 'Good';
    color = 'yellow';
  } else if (total >= 50) {
    label = 'Fair';
    color = 'orange';
  } else {
    label = 'Poor';
    color = 'red';
  }

  return {
    total,
    breakdown: {
      content: contentScore,
      seo: seoScore,
      performance: performanceScore,
      mobile: mobileScore,
    },
    label,
    color,
  };
}

/**
 * Calculate percentile ranking
 */
export function calculatePercentile(score: number): number {
  // Simple percentile calculation
  // In a real scenario, this would compare against a database of scores
  if (score >= 90) return 15; // Top 15%
  if (score >= 75) return 35; // Top 35%
  if (score >= 50) return 65; // Top 65%
  return 85; // Top 85%
}

/**
 * Estimate potential improvement
 * Uses deterministic calculations to ensure consistent results
 */
export function estimatePotentialScore(
  currentScore: OverallScore,
  seoAnalysis: SEOAnalysis,
  performanceMetrics: PerformanceMetrics
): number {
  // Calculate potential improvements from fixing issues (deterministic)
  let potentialImprovement = 0;

  // SEO improvements (deterministic counting)
  const criticalSEOIssues = seoAnalysis.checks.filter(
    c => c.priority === 'critical' && c.status !== 'pass'
  ).length;
  potentialImprovement += criticalSEOIssues * 5; // Each critical issue fixed = +5 points

  const highSEOIssues = seoAnalysis.checks.filter(
    c => c.priority === 'high' && c.status !== 'pass'
  ).length;
  potentialImprovement += highSEOIssues * 3; // Each high issue fixed = +3 points

  // Performance improvements (image optimization) - deterministic
  const unoptimizedCount = performanceMetrics.images?.unoptimizedCount || 0;
  if (unoptimizedCount > 0) {
    potentialImprovement += Math.min(unoptimizedCount * 2, 10);
  }

  // Content quality improvements (deterministic threshold)
  if (currentScore.breakdown.content < 85) {
    potentialImprovement += 12;
  }

  // Ensure result is deterministic and within bounds
  const potential = currentScore.total + potentialImprovement;
  return Math.min(Math.max(0, Math.round(potential)), 100);
}

