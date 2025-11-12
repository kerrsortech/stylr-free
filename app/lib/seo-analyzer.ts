import { ScrapedProductData } from './scraper';

export interface SEOCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  score: number;
}

export interface SEOAnalysis {
  score: number;
  checks: SEOCheck[];
  recommendations: string[];
}

export function analyzeSEO(scrapedData: ScrapedProductData): SEOAnalysis {
  const checks: SEOCheck[] = [];
  let totalScore = 0;
  // Maximum possible score from all checks (deterministic):
  // Meta Title: 10, Meta Description: 10, H1: 10, Schema: 15, HTTPS: 10, URL: 10, Content: 10, Features: 10
  const maxPossibleScore = 85; // Sum of all maximum scores
  const maxScore = 100; // Target scale

  // 1. Meta Title Check
  if (!scrapedData.metaTitle || scrapedData.metaTitle.trim().length === 0) {
    checks.push({
      name: 'Meta Title',
      status: 'fail',
      message: 'Meta title is missing',
      priority: 'critical',
      score: 0,
    });
  } else {
    const titleLength = scrapedData.metaTitle.length;
    if (titleLength < 30) {
      checks.push({
        name: 'Meta Title',
        status: 'warning',
        message: `Meta title is too short (${titleLength} chars, aim for 50-60)`,
        priority: 'high',
        score: 5,
      });
    } else if (titleLength > 60) {
      checks.push({
        name: 'Meta Title',
        status: 'warning',
        message: `Meta title is too long (${titleLength} chars, aim for 50-60)`,
        priority: 'medium',
        score: 7,
      });
    } else {
      checks.push({
        name: 'Meta Title',
        status: 'pass',
        message: `Meta title is optimal (${titleLength} chars)`,
        priority: 'low',
        score: 10,
      });
    }
    totalScore += checks[checks.length - 1].score;
  }

  // 2. Meta Description Check
  if (!scrapedData.metaDescription || scrapedData.metaDescription.trim().length === 0) {
    checks.push({
      name: 'Meta Description',
      status: 'fail',
      message: 'Meta description is missing',
      priority: 'critical',
      score: 0,
    });
  } else {
    const descLength = scrapedData.metaDescription.length;
    if (descLength < 120) {
      checks.push({
        name: 'Meta Description',
        status: 'warning',
        message: `Meta description is too short (${descLength} chars, aim for 150-160)`,
        priority: 'high',
        score: 5,
      });
    } else if (descLength > 160) {
      checks.push({
        name: 'Meta Description',
        status: 'warning',
        message: `Meta description may be truncated (${descLength} chars, aim for 150-160)`,
        priority: 'medium',
        score: 7,
      });
    } else {
      checks.push({
        name: 'Meta Description',
        status: 'pass',
        message: `Meta description is optimal (${descLength} chars)`,
        priority: 'low',
        score: 10,
      });
    }
    totalScore += checks[checks.length - 1].score;
  }

  // 3. H1 Tag Check
  if (!scrapedData.h1 || scrapedData.h1.trim().length === 0) {
    checks.push({
      name: 'H1 Tag',
      status: 'fail',
      message: 'H1 tag is missing',
      priority: 'critical',
      score: 0,
    });
  } else if (scrapedData.h1Count > 1) {
    checks.push({
      name: 'H1 Tag',
      status: 'warning',
      message: `Multiple H1 tags found (${scrapedData.h1Count}), should have only one`,
      priority: 'high',
      score: 5,
    });
    totalScore += 5;
  } else {
    checks.push({
      name: 'H1 Tag',
      status: 'pass',
      message: 'Single, well-structured H1 tag found',
      priority: 'low',
      score: 10,
    });
    totalScore += 10;
  }

  // 4. Product Schema Markup
  if (!scrapedData.schema) {
    checks.push({
      name: 'Product Schema',
      status: 'fail',
      message: 'Product schema markup not detected (High priority fix!)',
      priority: 'critical',
      score: 0,
    });
  } else {
    checks.push({
      name: 'Product Schema',
      status: 'pass',
      message: 'Product schema markup detected',
      priority: 'low',
      score: 15,
    });
    totalScore += 15;
  }

  // 5. HTTPS Check
  const isHTTPS = scrapedData.url.startsWith('https://');
  if (!isHTTPS) {
    checks.push({
      name: 'HTTPS',
      status: 'fail',
      message: 'Page is not using HTTPS',
      priority: 'critical',
      score: 0,
    });
  } else {
    checks.push({
      name: 'HTTPS',
      status: 'pass',
      message: 'HTTPS enabled and valid',
      priority: 'low',
      score: 10,
    });
    totalScore += 10;
  }

  // 6. URL Structure
  const urlPath = new URL(scrapedData.url).pathname;
  const isCleanURL = /^\/[a-z0-9\-/]+$/i.test(urlPath) && !urlPath.includes('?');
  if (!isCleanURL) {
    checks.push({
      name: 'URL Structure',
      status: 'warning',
      message: 'URL contains query parameters or special characters',
      priority: 'medium',
      score: 5,
    });
    totalScore += 5;
  } else {
    checks.push({
      name: 'URL Structure',
      status: 'pass',
      message: 'Clean, descriptive URL structure',
      priority: 'low',
      score: 10,
    });
    totalScore += 10;
  }

  // 7. Content Length
  const descriptionLength = scrapedData.description ? scrapedData.description.trim().length : 0;
  
  if (descriptionLength === 0) {
    checks.push({
      name: 'Content Length',
      status: 'fail',
      message: 'Product description is missing or could not be extracted',
      priority: 'critical',
      score: 0,
    });
    totalScore += 0;
  } else if (descriptionLength < 200) {
    checks.push({
      name: 'Content Length',
      status: 'warning',
      message: `Product description is too short (${descriptionLength} chars, aim for 300+)`,
      priority: 'high',
      score: 5,
    });
    totalScore += 5;
  } else if (descriptionLength < 500) {
    checks.push({
      name: 'Content Length',
      status: 'pass',
      message: `Product description length is adequate (${descriptionLength} chars)`,
      priority: 'low',
      score: 10,
    });
    totalScore += 10;
  } else {
    checks.push({
      name: 'Content Length',
      status: 'pass',
      message: `Product description is comprehensive (${descriptionLength} chars)`,
      priority: 'low',
      score: 10,
    });
    totalScore += 10;
  }

  // 8. Features/Bullet Points
  if (scrapedData.features.length === 0) {
    checks.push({
      name: 'Key Features',
      status: 'warning',
      message: 'No key features or bullet points found',
      priority: 'high',
      score: 3,
    });
    totalScore += 3;
  } else if (scrapedData.features.length < 3) {
    checks.push({
      name: 'Key Features',
      status: 'warning',
      message: `Only ${scrapedData.features.length} feature(s) found, aim for 5-7`,
      priority: 'medium',
      score: 6,
    });
    totalScore += 6;
  } else {
    checks.push({
      name: 'Key Features',
      status: 'pass',
      message: `${scrapedData.features.length} key features found`,
      priority: 'low',
      score: 10,
    });
    totalScore += 10;
  }

  // Calculate final score (out of 100) - normalize to 100 scale
  // Use deterministic rounding to ensure consistency
  const normalizedScore = (totalScore / maxPossibleScore) * maxScore;
  const finalScore = Math.min(Math.max(0, Math.round(normalizedScore)), 100);

  // Generate recommendations
  const recommendations: string[] = [];
  const criticalIssues = checks.filter(c => c.priority === 'critical' && c.status !== 'pass');
  const highPriorityIssues = checks.filter(c => c.priority === 'high' && c.status !== 'pass');

  if (criticalIssues.length > 0) {
    recommendations.push(...criticalIssues.map(c => `🔴 Critical: ${c.message}`));
  }
  if (highPriorityIssues.length > 0) {
    recommendations.push(...highPriorityIssues.map(c => `🟠 High: ${c.message}`));
  }

  return {
    score: finalScore,
    checks,
    recommendations,
  };
}

