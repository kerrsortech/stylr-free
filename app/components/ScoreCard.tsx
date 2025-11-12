'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { getScoreColor, getScoreLabel, getScoreBgColor } from '@/app/lib/utils';

interface ScoreCardProps {
  score: number;
  label: string;
  breakdown: {
    content: number;
    seo: number;
    performance: number;
    mobile: number;
  };
  percentile: number;
}

export function ScoreCard({ score, label, breakdown, percentile }: ScoreCardProps) {
  const color = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  
  // Helper to get progress bar color based on score (vibrant colors)
  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">Overall Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Circular Score Display */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                  className={color}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${color}`}>{score}</div>
                  <div className="text-sm text-gray-500">/100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Score Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{scoreLabel}!</h3>
                <Badge variant={score >= 90 ? 'success' : score >= 75 ? 'warning' : score >= 50 ? 'warning' : 'error'}>
                  Top {percentile}%
                </Badge>
              </div>
              <p className="text-gray-600">
                Your page ranks in the top {percentile}% of analyzed products
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Content Quality</span>
                  <span className="font-medium">{breakdown.content}/100</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${getProgressColor(breakdown.content)}`}
                    style={{ width: `${breakdown.content}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>SEO Health</span>
                  <span className="font-medium">{breakdown.seo}/100</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${getProgressColor(breakdown.seo)}`}
                    style={{ width: `${breakdown.seo}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Performance</span>
                  <span className="font-medium">{breakdown.performance}/100</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${getProgressColor(breakdown.performance)}`}
                    style={{ width: `${breakdown.performance}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Mobile Optimized</span>
                  <span className="font-medium">{breakdown.mobile}/100</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${getProgressColor(breakdown.mobile)}`}
                    style={{ width: `${breakdown.mobile}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

