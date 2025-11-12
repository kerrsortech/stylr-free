'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Copy, Check } from 'lucide-react';
import { Separator } from './ui/separator';

interface ContentEnhancementProps {
  enhancement: {
    summary?: {
      overallAssessment: string;
      strengths: string[];
      weaknesses: string[];
      priorityRecommendations: string[];
    };
    title: {
      current: string;
      enhanced: string;
      reasoning: string;
      improvement: string;
    };
    metaDescription?: {
      current: string;
      enhanced: string;
      reasoning: string;
      improvement: string;
    };
    description: {
      current: string;
      enhanced: string;
      reasoning: string;
      improvement: string;
    };
    features: {
      current: string[];
      enhanced: string[];
      reasoning: string;
      improvement: string;
    };
  };
}

export function ContentEnhancement({ enhancement }: ContentEnhancementProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Ensure we're copying the enhanced content - format appropriately
      let contentToCopy = text.trim();
      
      // For features, format as bullet points for better readability
      if (type === 'features') {
        const features = enhancement.features.enhanced;
        contentToCopy = features
          .map(feature => `• ${feature.trim()}`)
          .join('\n');
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      // Silently fail - user will see the copy didn't work
      // No need to log client-side errors for clipboard operations
    }
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Title Enhancement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📝 Product Title
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(enhancement.title.enhanced, 'title')}
            >
              {copied === 'title' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Enhanced
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Enhanced by AI</div>
            <div className="p-3 bg-blue-50 rounded border border-blue-200 whitespace-pre-wrap break-words">
              {enhancement.title.enhanced}
            </div>
            <Badge variant="success" className="mt-2">
              {enhancement.title.improvement} improvement
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">💡 Why This Works:</div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm whitespace-pre-wrap break-words">
              {enhancement.title.reasoning}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Enhancement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📄 Product Description
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(enhancement.description.enhanced, 'description')}
            >
              {copied === 'description' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Enhanced
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Enhanced by AI</div>
            <div className="p-3 bg-blue-50 rounded border border-blue-200 whitespace-pre-wrap break-words">
              {enhancement.description.enhanced}
            </div>
            <Badge variant="success" className="mt-2">
              {enhancement.description.improvement} improvement
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">💡 Why This Works:</div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm whitespace-pre-wrap break-words">
              {enhancement.description.reasoning}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Enhancement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🎯 Key Features/Bullet Points
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard('', 'features')}
            >
              {copied === 'features' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Enhanced
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Enhanced by AI</div>
            <ul className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
              {enhancement.features.enhanced.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Badge variant="success" className="mt-2">
              {enhancement.features.improvement} improvement
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">💡 Why This Works:</div>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm whitespace-pre-wrap break-words">
              {enhancement.features.reasoning}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      {enhancement.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Overall Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Assessment</div>
              <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap break-words">
                {enhancement.summary.overallAssessment}
              </div>
            </div>
            {enhancement.summary.strengths.length > 0 && (
              <div>
                <div className="text-sm font-medium text-green-600 mb-2">✅ Strengths</div>
                <ul className="p-3 bg-green-50 rounded border border-green-200 space-y-1">
                  {enhancement.summary.strengths.map((strength, idx) => (
                    <li key={idx} className="list-disc list-inside text-sm">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {enhancement.summary.weaknesses.length > 0 && (
              <div>
                <div className="text-sm font-medium text-red-600 mb-2">⚠️ Weaknesses</div>
                <ul className="p-3 bg-red-50 rounded border border-red-200 space-y-1">
                  {enhancement.summary.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="list-disc list-inside text-sm">{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
            {enhancement.summary.priorityRecommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium text-blue-600 mb-2">🎯 Priority Recommendations</div>
                <ul className="p-3 bg-blue-50 rounded border border-blue-200 space-y-1">
                  {enhancement.summary.priorityRecommendations.map((rec, idx) => (
                    <li key={idx} className="list-disc list-inside text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meta Description Enhancement */}
      {enhancement.metaDescription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                📝 Meta Description
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(enhancement.metaDescription!.enhanced, 'metaDescription')}
              >
                {copied === 'metaDescription' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Enhanced
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Enhanced by AI</div>
              <div className="p-3 bg-blue-50 rounded border border-blue-200 whitespace-pre-wrap break-words">
                {enhancement.metaDescription.enhanced}
              </div>
              <Badge variant="success" className="mt-2">
                {enhancement.metaDescription.improvement} improvement
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">💡 Why This Works:</div>
              <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm whitespace-pre-wrap break-words">
                {enhancement.metaDescription.reasoning}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

