'use client';

import Image from 'next/image';

export function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center">
            <Image
              src="/stylr_black.svg"
              alt="Stylr Logo"
              width={100}
              height={39}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </header>
  );
}

