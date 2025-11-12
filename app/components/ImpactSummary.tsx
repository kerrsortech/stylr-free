'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface ImpactSummaryProps {
  currentScore: number;
  potentialScore: number;
  estimatedImpact: {
    scoreImprovement: number;
    trafficImprovement: string;
    implementationTime: string;
  };
  priority: Array<{ type: string; message: string; impact: string }>;
  quickWins: string[];
  onAnalyzeAnother: () => void;
}

export function ImpactSummary({
  currentScore,
  potentialScore,
  estimatedImpact,
  priority,
  quickWins,
  onAnalyzeAnother,
}: ImpactSummaryProps) {
  return (
    <div className="space-y-6 mb-6">
      {/* Estimated Impact */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Estimated Impact Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{currentScore}</div>
              <div className="text-sm text-gray-600">Current Score</div>
            </div>
            <ArrowRight className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{potentialScore}</div>
              <div className="text-sm text-gray-600">Potential Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Organic Traffic</div>
              <div className="text-2xl font-bold text-green-600">
                +{estimatedImpact.trafficImprovement}
              </div>
              <div className="text-xs text-gray-500 mt-1">over 90 days</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Score Improvement</div>
              <div className="text-2xl font-bold text-blue-600">
                +{estimatedImpact.scoreImprovement}
              </div>
              <div className="text-xs text-gray-500 mt-1">points</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Implementation Time</div>
              <div className="text-2xl font-bold text-purple-600">
                {estimatedImpact.implementationTime}
              </div>
            </div>
          </div>

          {priority.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Priority Fixes (Do These First):</h4>
              <div className="space-y-2">
                {priority.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <span className={item.type === 'critical' ? 'text-red-600' : 'text-orange-600'}>
                      {item.type === 'critical' ? '🔴' : '🟠'}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm">{item.message}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.impact})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quickWins.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Quick Wins:</h4>
              <div className="space-y-2">
                {quickWins.map((win, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">{win}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" className="flex-1" onClick={onAnalyzeAnother}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Analyze Another Product
        </Button>
      </div>
    </div>
  );
}

