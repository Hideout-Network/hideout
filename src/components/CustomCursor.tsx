import { useEffect, useState, useCallback } from 'react';

interface CursorState {
  x: number;
  y: number;
  isPointer: boolean;
  isText: boolean;
  isHidden: boolean;
}

interface CustomCursorProps {
  smoothness?: number;
  size?: number;
}

const CustomCursor = ({ smoothness = 0.65, size = 36 }: CustomCursorProps) => {
  const [cursor, setCursor] = useState<CursorState>({
    x: -100,
    y: -100,
    isPointer: false,
    isText: false,
    isHidden: true,
  });

  const [smoothPosition, setSmoothPosition] = useState({ x: -100, y: -100 });

  const updateCursorType = useCallback((target: Element | null) => {
    if (!target) return { isPointer: false, isText: false };
    
    const computedStyle = window.getComputedStyle(target as HTMLElement);
    const cursorStyle = computedStyle.cursor;
    
    const isClickable = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      !!target.closest('button') ||
      !!target.closest('a') ||
      !!target.closest('[role="button"]') ||
      cursorStyle === 'pointer';
    
    const isTextInput = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      (target as HTMLElement).isContentEditable ||
      cursorStyle === 'text';

    return { isPointer: isClickable, isText: isTextInput };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { isPointer, isText } = updateCursorType(e.target as Element);
      
      setCursor({
        x: e.clientX,
        y: e.clientY,
        isPointer,
        isText,
        isHidden: false,
      });
    };

    const handleMouseLeave = () => {
      setCursor(prev => ({ ...prev, isHidden: true }));
    };

    const handleMouseEnter = () => {
      setCursor(prev => ({ ...prev, isHidden: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [updateCursorType]);

  // Smooth animation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      setSmoothPosition(prev => ({
        x: prev.x + (cursor.x - prev.x) * smoothness,
        y: prev.y + (cursor.y - prev.y) * smoothness,
      }));
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [cursor.x, cursor.y, smoothness]);

  // Hide default cursor globally
  useEffect(() => {
    document.body.style.cursor = 'none';
    
    const style = document.createElement('style');
    style.id = 'custom-cursor-hide';
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.cursor = '';
      const existingStyle = document.getElementById('custom-cursor-hide');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  if (cursor.isHidden) return null;

  // Default arrow cursor
  const ArrowCursor = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.53.35-.85L5.85 2.36a.5.5 0 0 0-.35.85z"
        className="fill-background stroke-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Pointer cursor (hand)
  const PointerCursor = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <path
        d="M18 12.5V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v-1a2 2 0 0 0-2-2 2 2 0 0 0-2 2V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9.5a5.5 5.5 0 0 0 5.5 5.5h1a5.5 5.5 0 0 0 5.5-5.5z"
        className="fill-background stroke-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9V4"
        className="stroke-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  // Text cursor (I-beam)
  const TextCursor = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <path
        d="M12 4v16M8 4h8M8 20h8"
        className="stroke-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const getCursorComponent = () => {
    if (cursor.isText) return <TextCursor />;
    if (cursor.isPointer) return <PointerCursor />;
    return <ArrowCursor />;
  };

  const getOffset = () => {
    const scale = size / 36;
    if (cursor.isText) return { x: -18 * scale, y: -18 * scale };
    if (cursor.isPointer) return { x: -8 * scale, y: -4 * scale };
    return { x: -5 * scale, y: -3 * scale };
  };

  const offset = getOffset();

  return (
    <div
      className="fixed pointer-events-none z-[99999] transition-transform duration-75"
      style={{
        left: smoothPosition.x + offset.x,
        top: smoothPosition.y + offset.y,
        transform: cursor.isPointer ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {getCursorComponent()}
    </div>
  );
};

export default CustomCursor;
