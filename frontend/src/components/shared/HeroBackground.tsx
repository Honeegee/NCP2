import React from "react";

interface HeroBackgroundProps {
 
  className?: string;
  style?: React.CSSProperties;
  showWave?: boolean;
  showExtraCircles?: boolean;
  children?: React.ReactNode;
}


export function HeroBackground({
  className = "",
  style,
  showWave = false,
  showExtraCircles = false,
  children,
}: HeroBackgroundProps) {
  return (
    <div className={`admin-hero ${className}`} style={style}>
      <div className="admin-hero-bg">
        {/* Gradient circle - top left */}
        <div
          className="admin-hero-circle -left-10 -top-10 w-44 h-44 md:w-56 md:h-56 opacity-15"
          style={{ background: "linear-gradient(135deg, var(--highlight-light), var(--warning))" }}
        />
        
        {/* Highlight circle - left bottom */}
        <div
          className="admin-hero-circle left-20 bottom-16 w-20 h-20 md:w-28 md:h-28 opacity-10"
          style={{ background: "var(--highlight-light)" }}
        />
        
        {/* Bordered circle - right top */}
        <div className="admin-hero-circle -right-8 top-4 w-36 h-36 md:w-48 md:h-48 border-[6px] border-white/10" />
        
        {/* Success circle - right bottom */}
        <div
          className="admin-hero-circle right-24 -bottom-6 w-24 h-24 opacity-10"
          style={{ background: "var(--success)" }}
        />
        
        {/* Extra decorative circles (optional) */}
        {showExtraCircles && (
          <>
            <div
              className="admin-hero-circle left-1/3 -top-4 w-32 h-32 opacity-[0.07]"
              style={{ background: "radial-gradient(circle, var(--primary-light), transparent)" }}
            />
            <div
              className="admin-hero-circle right-1/4 top-8 w-20 h-20 opacity-[0.08]"
              style={{ background: "var(--highlight-light)" }}
            />
          </>
        )}
        
        {/* Medical cross watermark */}
        <svg
          className="absolute right-8 top-6 w-16 h-16 md:w-24 md:h-24 opacity-[0.06]"
          viewBox="0 0 100 100"
          fill="white"
        >
          <rect x="35" y="10" width="30" height="80" rx="4" />
          <rect x="10" y="35" width="80" height="30" rx="4" />
        </svg>
        
        {/* Heartbeat line */}
        <svg
          className="absolute bottom-20 left-12 w-48 h-10 opacity-[0.08] hidden md:block"
          viewBox="0 0 200 40"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <path d="M0,20 L40,20 L50,5 L60,35 L70,10 L80,30 L90,20 L200,20" />
        </svg>
      </div>
      
      {children}
      
      {showWave && (
        <svg
          className="admin-hero-wave"
          viewBox="0 0 1440 24"
          preserveAspectRatio="none"
          fill="var(--background, #f7fbfa)"
        >
          <path d="M0,24 L0,8 C240,20 480,0 720,8 C960,16 1200,4 1440,12 L1440,24 Z" />
        </svg>
      )}
    </div>
  );
}

export default HeroBackground;
