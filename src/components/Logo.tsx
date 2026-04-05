import React from 'react';

interface LogoProps {
  animated?: boolean;
  className?: string;
}

export default function Logo({ animated = false, className = "" }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Apple-style Rounded Square Base with Gradient and Shadow */}
      <div className="w-12 h-12 bg-gradient-to-br from-stone-100 to-stone-300 rounded-[22%] shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center justify-center overflow-hidden relative border border-stone-200/50">
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
        
        {/* Coffee Bean Icon (Polished) */}
        <div className="relative z-10 flex flex-col items-center justify-center scale-90">
          <svg 
            viewBox="0 0 24 24" 
            className={`w-8 h-8 text-stone-800 drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)] ${animated ? 'animate-bounce' : ''}`}
            fill="currentColor"
          >
            <path d="M18.5,10.5C18.5,14.09 15.59,17 12,17C8.41,17 5.5,14.09 5.5,10.5C5.5,6.91 8.41,4 12,4C15.59,4 18.5,6.91 18.5,10.5M12,2C7.31,2 3.5,5.81 3.5,10.5C3.5,15.19 7.31,19 12,19C16.69,19 20.5,15.19 20.5,10.5C20.5,5.81 16.69,2 12,2M12,15C9.5,15 7.5,13 7.5,10.5C7.5,8 9.5,6 12,6C14.5,6 16.5,8 16.5,10.5C16.5,13 14.5,15 12,15Z" />
            <path d="M12,13C10.62,13 9.5,11.88 9.5,10.5C9.5,9.12 10.62,8 12,8C13.38,8 14.5,9.12 14.5,10.5C14.5,11.88 13.38,13 12,13Z" />
          </svg>
          
          {/* Coffee Steam (Subtle) */}
          {animated && (
            <div className="absolute -top-2 flex gap-1">
              <div className="w-0.5 h-2 bg-stone-400/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-0.5 h-3 bg-stone-400/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-0.5 h-2 bg-stone-400/40 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
          )}
        </div>
        
        {/* Glass Reflection Overlay */}
        <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
