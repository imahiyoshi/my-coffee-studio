import React from 'react';

interface LogoProps {
  animated?: boolean;
  className?: string;
}

export default function Logo({ animated = false, className = "" }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Minimalist White Base with Brown 'Bean' Kanji (1081) */}
      <div className={`w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex flex-col items-center justify-center gap-1.5 ${animated ? 'animate-pulse' : ''}`}>
        <div className="flex flex-col items-center justify-center gap-1.5">
          {/* 1 (一) */}
          <div className="w-4 h-[2px] bg-[#4a3728] rounded-full" />
          {/* 0 (口) */}
          <div className="w-5 h-3 border-[2px] border-[#4a3728] rounded-sm" />
          {/* 8 (八) */}
          <div className="flex gap-1.5">
            <div className="w-[2px] h-2.5 bg-[#4a3728] rounded-full -rotate-12" />
            <div className="w-[2px] h-2.5 bg-[#4a3728] rounded-full rotate-12" />
          </div>
          {/* 1 (一) */}
          <div className="w-6 h-[2px] bg-[#4a3728] rounded-full" />
        </div>
      </div>
    </div>
  );
}
