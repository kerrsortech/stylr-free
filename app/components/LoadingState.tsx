'use client';

import { Progress } from './ui/progress';
import { Loader2 } from 'lucide-react';
import { Header } from './Header';

interface LoadingStateProps {
  progress: number;
  currentStep: string;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
  dynamicMessage?: string;
  extractionCount?: number;
}

export function LoadingState({ 
  progress, 
  currentStep, 
  elapsedTime = 0,
  estimatedTimeRemaining,
  dynamicMessage,
  extractionCount = 0
}: LoadingStateProps) {
  const steps = [
    { name: 'Extracting page content', progress: 15, duration: 8 },
    { name: 'Running SEO audit', progress: 40, duration: 12 },
    { name: 'Analyzing performance metrics', progress: 65, duration: 15 },
    { name: 'Generating AI enhancements', progress: 90, duration: 25 },
  ];

  // Format time in a user-friendly way
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Show processing indicator even at high percentages
  const isProcessing = progress >= 90 && progress < 100;
  const isDeepAnalysis = elapsedTime > 60;
  const displayProgress = Math.min(progress, 95); // Cap visual progress at 95%

  // Get current step index
  let currentStepIndex = steps.findIndex((step, idx) => {
    const nextStep = steps[idx + 1];
    return progress >= step.progress && (!nextStep || progress < nextStep.progress);
  });
  if (currentStepIndex === -1) {
    currentStepIndex = steps.length - 1;
  }

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
      <div className="flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            ⚙️ Analyzing Your Page...
          </h2>
          <p className="text-gray-600 mb-2 font-medium">{currentStep}</p>
          {dynamicMessage && (
            <p className="text-sm text-blue-600 font-medium animate-pulse mt-1">
              {dynamicMessage}
            </p>
          )}
          {isDeepAnalysis && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700 font-medium">
                🧠 Deep Analysis Mode: Assessing multiple data points for comprehensive insights...
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Progress value={displayProgress} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {Math.round(displayProgress)}% complete
            </span>
            {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
              <span className="text-gray-500">
                ~{formatTime(estimatedTimeRemaining)} remaining
              </span>
            )}
          </div>

          {elapsedTime > 0 && (
            <div className="text-center text-xs text-gray-400">
              Elapsed: {formatTime(elapsedTime)}
            </div>
          )}

          <div className="space-y-3 mt-8">
            {steps.map((step, index) => {
              const isCompleted = progress >= step.progress;
              const isCurrent = index === currentStepIndex || (progress >= step.progress && (!steps[index + 1] || progress < steps[index + 1].progress));
              const isUpcoming = progress < step.progress && !isCurrent;

              return (
                <div
                  key={step.name}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                    isCurrent ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' : isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 text-xl ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}>
                    {isCompleted ? '✓' : isCurrent ? '⏳' : '○'}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>
                      {step.name}
                    </span>
                    {isCurrent && (
                      <div className="mt-1 text-xs text-blue-600">
                        {extractionCount > 0 && `Extracting ${extractionCount}+ data points...`}
                        {!extractionCount && 'In progress...'}
                      </div>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isProcessing && !isDeepAnalysis && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 text-center">
                <span className="inline-block animate-pulse mr-2">⏳</span>
                AI is generating comprehensive enhancements and analyzing multiple data points...
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

