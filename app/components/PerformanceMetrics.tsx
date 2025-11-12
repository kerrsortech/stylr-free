'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatTime, formatBytes } from '@/app/lib/utils';

interface ImageOptimizationItem {
  url: string;
  totalBytes: number;
  wastedBytes: number;
  format?: string;
  width?: number;
  height?: number;
}

interface ImageFormatItem {
  url: string;
  wastedBytes: number;
  format: string;
  webpSavingsBytes?: number;
  avifSavingsBytes?: number;
}

interface PerformanceMetricsProps {
  metrics: {
    desktop: {
      score: number;
      fcp: number;
      lcp: number;
      ttfb: number;
      loadTime: number;
      speedIndex: number;
    };
    mobile: {
      score: number;
      fcp: number;
      lcp: number;
      ttfb: number;
      loadTime: number;
      speedIndex: number;
    };
    images: {
      totalSize: number;
      unoptimizedCount: number;
      totalCount: number;
      optimizationOpportunities: ImageOptimizationItem[];
      formatOptimization: ImageFormatItem[];
    };
    seo: {
      score: number;
    };
  };
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="success">Excellent</Badge>;
    if (score >= 75) return <Badge variant="warning">Good</Badge>;
    if (score >= 50) return <Badge variant="warning">Fair</Badge>;
    return <Badge variant="error">Poor</Badge>;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Desktop</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{metrics.desktop.score}</span>
              <span className="text-gray-500">/100</span>
            </div>
            {getScoreBadge(metrics.desktop.score)}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Mobile</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{metrics.mobile.score}</span>
              <span className="text-gray-500">/100</span>
            </div>
            {getScoreBadge(metrics.mobile.score)}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-1">SEO Score</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{metrics.seo.score}</span>
              <span className="text-gray-500">/100</span>
            </div>
            {getScoreBadge(metrics.seo.score)}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Speed Index</div>
            <div className="text-2xl font-bold mb-2">
              {formatTime(metrics.mobile.speedIndex)}
            </div>
            <div className="text-xs text-gray-500">Mobile</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-sm font-medium mb-1">First Contentful Paint</div>
            <div className="text-lg">{formatTime(metrics.mobile.fcp)}</div>
            <div className="text-xs text-gray-500">Mobile</div>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Largest Contentful Paint</div>
            <div className="text-lg">{formatTime(metrics.mobile.lcp)}</div>
            <div className="text-xs text-gray-500">Mobile</div>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Time to First Byte</div>
            <div className="text-lg">{formatTime(metrics.mobile.ttfb)}</div>
            <div className="text-xs text-gray-500">Mobile</div>
          </div>
        </div>

        {/* Image Optimization Opportunities */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Image Optimization</h3>
          
          {/* Image Optimization Opportunities */}
          {metrics.images.optimizationOpportunities.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium">Optimization Opportunities</h4>
                <Badge variant="warning">
                  {metrics.images.optimizationOpportunities.length} images
                </Badge>
              </div>
              <div className="space-y-3">
                {metrics.images.optimizationOpportunities.slice(0, 5).map((img, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {img.url.split('/').pop() || `Image ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{img.url}</div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-semibold text-orange-600">
                          -{formatBytes(img.wastedBytes)}
                        </div>
                        <div className="text-xs text-gray-500">potential savings</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                      <span>Size: {formatBytes(img.totalBytes)}</span>
                      {img.format && <span>Format: {img.format}</span>}
                      {img.width && img.height && (
                        <span>Dimensions: {img.width}×{img.height}</span>
                      )}
                    </div>
                  </div>
                ))}
                {metrics.images.optimizationOpportunities.length > 5 && (
                  <div className="text-sm text-gray-500 text-center pt-2">
                    +{metrics.images.optimizationOpportunities.length - 5} more images
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Total Potential Savings
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {formatBytes(
                    metrics.images.optimizationOpportunities.reduce(
                      (sum, img) => sum + img.wastedBytes,
                      0
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Format Optimization */}
          {metrics.images.formatOptimization.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium">Format Optimization</h4>
                <Badge variant="warning">
                  {metrics.images.formatOptimization.length} images
                </Badge>
              </div>
              <div className="space-y-3">
                {metrics.images.formatOptimization.slice(0, 5).map((img, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {img.url.split('/').pop() || `Image ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{img.url}</div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-semibold text-orange-600">
                          -{formatBytes(img.wastedBytes)}
                        </div>
                        <div className="text-xs text-gray-500">potential savings</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                      <span>Current: {img.format}</span>
                      {img.webpSavingsBytes && (
                        <span className="text-green-600">
                          WebP: -{formatBytes(img.webpSavingsBytes)}
                        </span>
                      )}
                      {img.avifSavingsBytes && (
                        <span className="text-green-600">
                          AVIF: -{formatBytes(img.avifSavingsBytes)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {metrics.images.formatOptimization.length > 5 && (
                  <div className="text-sm text-gray-500 text-center pt-2">
                    +{metrics.images.formatOptimization.length - 5} more images
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-900 mb-1">
                  Total Format Savings
                </div>
                <div className="text-lg font-bold text-green-700">
                  {formatBytes(
                    metrics.images.formatOptimization.reduce(
                      (sum, img) => sum + img.wastedBytes,
                      0
                    )
                  )}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Convert to WebP or AVIF for better compression
                </div>
              </div>
            </div>
          )}

          {/* No optimization needed message */}
          {metrics.images.optimizationOpportunities.length === 0 &&
            metrics.images.formatOptimization.length === 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="text-green-600">✓</div>
                  <div className="text-sm font-medium text-green-900">
                    All images are optimized! No optimization opportunities found.
                  </div>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

