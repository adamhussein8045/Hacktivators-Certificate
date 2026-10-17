import React, { useEffect, useState, useRef } from 'react';

interface CustomCursorProps {
  enabled?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ enabled = true }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTextInput, setIsTextInput] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const targetPos = useRef({ x: -100, y: -100 });
  const currentRing = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Check if device is touch-primary
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Detect interactive elements under cursor
      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable = !!target.closest(
          'button, a, [role="button"], input[type="submit"], input[type="button"], select, .cursor-pointer'
        );
        const isInput = !!target.closest('input[type="text"], input[type="email"], input[type="search"], textarea');
        
        setIsHovered(isClickable);
        setIsTextInput(isInput);
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth lerp loop for the outer reticle ring
    const animate = () => {
      const lerp = 0.22;
      currentRing.current.x += (targetPos.current.x - currentRing.current.x) * lerp;
      currentRing.current.y += (targetPos.current.y - currentRing.current.y) * lerp;

      setRingPos({
        x: Math.round(currentRing.current.x * 10) / 10,
        y: Math.round(currentRing.current.y * 10) / 10,
      });

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isVisible]);

  if (!enabled || isTouchDevice || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
      {/* Precision Instant Center Diamond Dot */}
      <div
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${isClicking ? 0.75 : isHovered ? 1.4 : 1})`,
          transition: 'transform 0.08s ease-out',
        }}
      >
        {isTextInput ? (
          // Text input vertical precision beam
          <div className="w-[2px] h-4 bg-neutral-900 rounded-full" />
        ) : (
          // Special High-Tech Precision Geometric Diamond
          <div className="relative flex items-center justify-center">
            {/* Inner diamond */}
            <div className="w-2.5 h-2.5 rotate-45 bg-neutral-950 border border-white shadow-sm flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-white rounded-full" />
            </div>
            {/* Micro Crosshair lines */}
            <div className="absolute w-4 h-[1px] bg-neutral-950/40 -z-10" />
            <div className="absolute h-4 w-[1px] bg-neutral-950/40 -z-10" />
          </div>
        )}
      </div>

      {/* Outer Smooth Trailing Reticle with Enterprise Corner Brackets */}
      {!isTextInput && (
        <div
          className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${
              isClicking ? 0.85 : isHovered ? 1.45 : 1
            })`,
            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className={`relative flex items-center justify-center transition-all duration-200 ${
              isHovered ? 'w-9 h-9' : 'w-7 h-7'
            }`}
          >
            {/* Geometric Enterprise Corner Brackets [ + ] */}
            <svg
              className={`w-full h-full text-neutral-900 transition-transform duration-300 ${
                isHovered ? 'rotate-90 text-neutral-950' : 'rotate-0 text-neutral-400'
              }`}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top-Left Bracket */}
              <path
                d="M4 11V6C4 4.89543 4.89543 4 6 4H11"
                stroke="currentColor"
                strokeWidth={isHovered ? '1.75' : '1.25'}
                strokeLinecap="round"
              />
              {/* Top-Right Bracket */}
              <path
                d="M21 4H26C27.1046 4 28 4.89543 28 6V11"
                stroke="currentColor"
                strokeWidth={isHovered ? '1.75' : '1.25'}
                strokeLinecap="round"
              />
              {/* Bottom-Left Bracket */}
              <path
                d="M4 21V26C4 27.1046 4.89543 28 6 28H11"
                stroke="currentColor"
                strokeWidth={isHovered ? '1.75' : '1.25'}
                strokeLinecap="round"
              />
              {/* Bottom-Right Bracket */}
              <path
                d="M21 28H26C27.1046 28 28 27.1046 28 26V21"
                stroke="currentColor"
                strokeWidth={isHovered ? '1.75' : '1.25'}
                strokeLinecap="round"
              />

              {/* Center subtle precision tick marks when hovered */}
              {isHovered && (
                <>
                  <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.3" />
                </>
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
