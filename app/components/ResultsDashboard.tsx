'use client';

import { ScoreCard } from './ScoreCard';
import { PerformanceMetrics } from './PerformanceMetrics';
import { ContentEnhancement } from './ContentEnhancement';
import { SEOHealthReport } from './SEOHealthReport';
import { ImpactSummary } from './ImpactSummary';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { Header } from './Header';

interface ResultsDashboardProps {
  data: {
    url: string;
    overallScore: {
      total: number;
      breakdown: {
        content: number;
        seo: number;
        performance: number;
        mobile: number;
      };
      label: string;
    };
    potentialScore: number;
    percentile: number;
    breakdown: {
      content: {
        enhancement: any;
      };
      seo: {
        analysis: {
          checks: any[];
        };
      };
      performance: {
        metrics: any;
      };
    };
    recommendations: {
      priority: Array<{ type: string; message: string; impact: string }>;
      quickWins: string[];
      estimatedImpact: {
        scoreImprovement: number;
        trafficImprovement: string;
        implementationTime: string;
      };
    };
  };
  onBack: () => void;
}

export function ResultsDashboard({ data, onBack }: ResultsDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Radial gradient overlay from bottom - colorful spear effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 20%, rgba(59, 130, 246, 0.1) 40%, rgba(168, 85, 247, 0.06) 60%, transparent 80%)'
        }}
      />
      <Header />
      <div className="py-8 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analyzer
            </Button>
            <h1 className="text-2xl font-bold">Product Page Analysis Results</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>

        {/* Overall Score */}
        <ScoreCard
          score={data.overallScore.total}
          label={data.overallScore.label}
          breakdown={data.overallScore.breakdown}
          percentile={data.percentile}
        />

        {/* Performance Metrics */}
        <PerformanceMetrics metrics={data.breakdown.performance.metrics} />

        {/* Content Enhancement */}
        <ContentEnhancement enhancement={data.breakdown.content.enhancement} />

        {/* SEO Health Report */}
        <SEOHealthReport checks={data.breakdown.seo.analysis.checks} />

        {/* Impact Summary */}
        <ImpactSummary
          currentScore={data.overallScore.total}
          potentialScore={data.potentialScore}
          estimatedImpact={data.recommendations.estimatedImpact}
          priority={data.recommendations.priority}
          quickWins={data.recommendations.quickWins}
          onAnalyzeAnother={onBack}
        />
        </div>
      </div>
    </div>
  );
}

