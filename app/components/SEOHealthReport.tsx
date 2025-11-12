'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface SEOHealthReportProps {
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

export function SEOHealthReport({ checks }: SEOHealthReportProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="success">Pass</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'fail':
        return <Badge variant="error">Fail</Badge>;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>SEO Health Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getPriorityColor(check.priority)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{check.name}</span>
                      {getStatusBadge(check.status)}
                    </div>
                    <p className="text-sm text-gray-700">{check.message}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

