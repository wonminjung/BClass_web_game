import { useEffect, useRef, useState } from 'react';

interface AnimatedSpriteProps {
  frames: string[];
  fps?: number;
  width?: number;
  height?: number;
  className?: string;
  flip?: boolean;
  paused?: boolean;
  onAnimationEnd?: () => void;
  loop?: boolean;
}

/**
 * Renders a frame-by-frame pixel art sprite animation.
 * Uses image-rendering: pixelated to keep the retro look when scaled up.
 */
export default function AnimatedSprite({
  frames,
  fps = 6,
  width = 64,
  height = 64,
  className = '',
  flip = false,
  paused = false,
  onAnimationEnd,
  loop = true,
}: AnimatedSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || frames.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (!loop) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onAnimationEnd?.();
            return prev;
          }
          return 0;
        }
        return next;
      });
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [frames, fps, paused, loop, onAnimationEnd]);

  // Reset frame index when frames change
  useEffect(() => {
    setFrameIndex(0);
  }, [frames]);

  if (frames.length === 0) return null;

  return (
    <img
      src={frames[frameIndex % frames.length]}
      alt="sprite"
      width={width}
      height={height}
      className={className}
      draggable={false}
      style={{
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
        objectFit: 'contain',
      }}
    />
  );
}
