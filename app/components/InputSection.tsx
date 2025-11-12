'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function InputSection({ onAnalyze, isLoading }: InputSectionProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 relative overflow-hidden">
      {/* Radial gradient overlay from bottom - colorful spear effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 20%, rgba(59, 130, 246, 0.1) 40%, rgba(168, 85, 247, 0.06) 60%, transparent 80%)'
        }}
      />
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/stylr_black.svg"
              alt="Stylr Logo"
              width={140}
              height={54}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Product Page Analyzer
          </h1>
          <p className="text-lg text-gray-600 mb-3 leading-relaxed">
            Analyzes your product page against 26+ ranking factors and shows exactly what to change with enhanced content, optimization scores, and reasoning.
          </p>
          <p className="text-base text-gray-500 mt-4 font-medium">
            Trusted by 1000+ e-commerce sellers worldwide
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="url"
              placeholder="https://example.com/product/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 text-lg shadow-lg border-2 focus:border-blue-500 flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="h-14 px-8 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 20%, #6d28d9 40%, #7c3aed 60%, #8b5cf6 80%, #a78bfa 100%)',
              }}
              size="default"
            >
              <Search className="mr-2 h-5 w-5" />
              Analyze
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Free forever</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

