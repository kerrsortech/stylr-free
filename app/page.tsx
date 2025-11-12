'use client';

import { useState, useEffect, useRef } from 'react';
import { InputSection } from './components/InputSection';
import { LoadingState } from './components/LoadingState';
import { ResultsDashboard } from './components/ResultsDashboard';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { AlertCircle } from 'lucide-react';

type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export default function HomePage() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing analysis...');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>(undefined);
  const [dynamicMessage, setDynamicMessage] = useState<string>('');
  const [extractionCount, setExtractionCount] = useState(0);
  
  const startTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Time-based progress calculation with realistic spacing
  // Progress spread over ~60 seconds with better distribution
  const calculateProgress = (elapsedSeconds: number): number => {
    // Expected total time: ~60 seconds
    const expectedTotalTime = 60;
    
    // More realistic progress distribution:
    // Step 1: 0-15% in first 8 seconds (Extracting page content)
    // Step 2: 15-40% in next 12 seconds (Running SEO audit)
    // Step 3: 40-65% in next 15 seconds (Analyzing performance)
    // Step 4: 65-90% in next 25 seconds (Generating AI enhancements)
    // Then cap at 95% until API completes
    
    if (elapsedSeconds < 8) {
      // Step 1: Extracting page content (0-15%)
      return Math.min(15, (elapsedSeconds / 8) * 15);
    } else if (elapsedSeconds < 20) {
      // Step 2: Running SEO audit (15-40%)
      return 15 + ((elapsedSeconds - 8) / 12) * 25;
    } else if (elapsedSeconds < 35) {
      // Step 3: Analyzing performance metrics (40-65%)
      return 40 + ((elapsedSeconds - 20) / 15) * 25;
    } else if (elapsedSeconds < 60) {
      // Step 4: Generating AI enhancements (65-90%)
      return 65 + ((elapsedSeconds - 35) / 25) * 25;
    } else {
      // Very slow progress (90-95% - caps here until API completes)
      return Math.min(95, 90 + ((elapsedSeconds - 60) / 30) * 5);
    }
  };

  // Generate dynamic messages based on elapsed time and progress
  const getDynamicMessage = (elapsed: number, progress: number): string => {
    if (elapsed < 8) {
      const count = Math.min(25, Math.floor(elapsed * 3));
      return `Extracting ${count}+ elements from page structure...`;
    } else if (elapsed < 20) {
      const count = Math.min(30, 25 + Math.floor((elapsed - 8) * 0.5));
      return `Analyzing ${count}+ SEO ranking factors...`;
    } else if (elapsed < 35) {
      const count = Math.min(40, 30 + Math.floor((elapsed - 20) * 0.7));
      return `Assessing ${count}+ performance metrics and data points...`;
    } else if (elapsed < 60) {
      const count = Math.min(50, 40 + Math.floor((elapsed - 35) * 0.4));
      return `Processing ${count}+ data points for AI enhancement generation...`;
    } else {
      return `Deep analysis: Evaluating 30 ranking factors for comprehensive insights...`;
    }
  };

  // Get extraction count for current step
  const getExtractionCount = (elapsed: number, progress: number): number => {
    if (progress < 15) {
      return Math.min(25, Math.floor(elapsed * 3));
    } else if (progress < 40) {
      return Math.min(30, 25 + Math.floor((elapsed - 8) * 0.5));
    } else if (progress < 65) {
      return Math.min(40, 30 + Math.floor((elapsed - 20) * 0.7));
    } else {
      return Math.min(50, 40 + Math.floor((elapsed - 35) * 0.4));
    }
  };

  const updateProgress = () => {
    if (startTimeRef.current === null) return;
    
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setElapsedTime(elapsed);
    
    const progress = calculateProgress(elapsed);
    setLoadingProgress(progress);

    // Update step based on progress - ensure correct order:
    // 1. Extracting page content (0-15%)
    // 2. Running SEO audit (15-40%)
    // 3. Analyzing performance metrics (40-65%)
    // 4. Generating AI enhancements (65%+)
    if (progress < 15) {
      setCurrentStep('Extracting page content');
    } else if (progress < 40) {
      setCurrentStep('Running SEO audit');
    } else if (progress < 65) {
      setCurrentStep('Analyzing performance metrics');
    } else {
      setCurrentStep('Generating AI enhancements');
    }

    // Update dynamic message
    const message = getDynamicMessage(elapsed, progress);
    setDynamicMessage(message);

    // Update extraction count
    const count = getExtractionCount(elapsed, progress);
    setExtractionCount(count);

    // Estimate time remaining based on 60 second target
    const typicalDuration = 60;
    if (elapsed < typicalDuration) {
      const remaining = Math.max(0, typicalDuration - elapsed);
      setEstimatedTimeRemaining(remaining);
    } else {
      // If we've exceeded typical duration, show a small buffer
      setEstimatedTimeRemaining(Math.max(0, 10 - (elapsed - typicalDuration)));
    }
  };

  const startProgressTracking = () => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setLoadingProgress(0);
    
    // Ensure we start with the first step
    setCurrentStep('Extracting page content');
    
    // Update progress every 500ms for smooth animation
    progressIntervalRef.current = setInterval(updateProgress, 500);
    
    // Update elapsed time every second
    timeIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, []);

  const handleAnalyze = async (analyzeUrl: string) => {
    setState('loading');
    setUrl(analyzeUrl);
    setError(null);
    setLoadingProgress(0);
    setCurrentStep('Extracting page content'); // Always start with first step
    setElapsedTime(0);
    setEstimatedTimeRemaining(60); // Initial estimate (1 minute)
    setDynamicMessage('Extracting 1+ elements from page structure...');
    setExtractionCount(1);
    
    startProgressTracking();
    
    // Immediately update progress to ensure correct initial state
    // This ensures the step is set correctly from the very beginning
    setTimeout(() => {
      if (startTimeRef.current) {
        updateProgress();
      }
    }, 100);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: analyzeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Backend already sanitizes errors - use the user-friendly message
        throw new Error(errorData.error || 'Analysis failed. Please try again.');
      }

      const data = await response.json();
      stopProgressTracking();
      setResults(data);
      setState('success');
      setLoadingProgress(100);
      setEstimatedTimeRemaining(0);
    } catch (err: any) {
      stopProgressTracking();
      // Error message is already sanitized by backend
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setState('error');
    }
  };

  const handleBack = () => {
    stopProgressTracking();
    setState('idle');
    setResults(null);
    setError(null);
    setUrl('');
    setLoadingProgress(0);
    setElapsedTime(0);
    setEstimatedTimeRemaining(undefined);
    setDynamicMessage('');
    setExtractionCount(0);
  };

  if (state === 'idle') {
    return <InputSection onAnalyze={handleAnalyze} isLoading={false} />;
  }

  if (state === 'loading') {
    return (
      <LoadingState 
        progress={loadingProgress} 
        currentStep={currentStep}
        elapsedTime={elapsedTime}
        estimatedTimeRemaining={estimatedTimeRemaining}
        dynamicMessage={dynamicMessage}
        extractionCount={extractionCount}
      />
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:underline"
            >
              Try again with a different URL
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'success' && results) {
    return <ResultsDashboard data={results} onBack={handleBack} />;
  }

  return null;
}

