import React from 'react';

interface LogoProps {
  animated?: boolean;
  className?: string;
}

export default function Logo({ animated = false, className = "" }: LogoProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center gap-1.5 w-12 h-12 ${className}`}>
      {animated && (
        <div 
          className="absolute inset-0 bg-stone-200/60 rounded-[40%_60%_60%_40%/50%_50%_50%_50%] opacity-0" 
          style={{ animation: 'formBean 3s ease-in-out infinite' }} 
        />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
        {/* 1 (一) */}
        <div 
          className={`w-4 h-[2px] bg-stone-900 rounded-full ${animated ? 'animate-pulse' : ''}`} 
          style={{ animationDelay: '0ms' }} 
        />
        {/* 0 (口) */}
        <div 
          className={`w-5 h-3 border-[2px] border-stone-900 rounded-sm ${animated ? 'animate-pulse' : ''}`} 
          style={{ animationDelay: '200ms' }} 
        />
        {/* 8 (八) */}
        <div className="flex gap-1.5">
          <div 
            className={`w-[2px] h-2.5 bg-stone-900 rounded-full -rotate-12 ${animated ? 'animate-pulse' : ''}`} 
            style={{ animationDelay: '400ms' }} 
          />
          <div 
            className={`w-[2px] h-2.5 bg-stone-900 rounded-full rotate-12 ${animated ? 'animate-pulse' : ''}`} 
            style={{ animationDelay: '400ms' }} 
          />
        </div>
        {/* 1 (一) */}
        <div 
          className={`w-6 h-[2px] bg-stone-900 rounded-full ${animated ? 'animate-pulse' : ''}`} 
          style={{ animationDelay: '600ms' }} 
        />
      </div>
    </div>
  );
}
