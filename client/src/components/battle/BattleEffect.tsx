import { useEffect, useState } from 'react';

export type EffectType = 'slash' | 'magic' | 'arrow' | 'heal' | 'buff' | 'dark' | 'fire' | 'ice' | 'enemy_attack';

interface BattleEffectProps {
  type: EffectType;
  onComplete?: () => void;
}

const EFFECT_CONFIG: Record<EffectType, { duration: number; className: string; content: string }> = {
  slash: {
    duration: 400,
    className: 'effect-slash',
    content: '',
  },
  magic: {
    duration: 500,
    className: 'effect-magic',
    content: '',
  },
  arrow: {
    duration: 350,
    className: 'effect-arrow',
    content: '',
  },
  heal: {
    duration: 600,
    className: 'effect-heal',
    content: '',
  },
  buff: {
    duration: 500,
    className: 'effect-buff',
    content: '',
  },
  dark: {
    duration: 500,
    className: 'effect-dark',
    content: '',
  },
  fire: {
    duration: 500,
    className: 'effect-fire',
    content: '',
  },
  ice: {
    duration: 500,
    className: 'effect-ice',
    content: '',
  },
  enemy_attack: {
    duration: 350,
    className: 'effect-slash',
    content: '',
  },
};

export default function BattleEffect({ type, onComplete }: BattleEffectProps) {
  const [visible, setVisible] = useState(true);
  const config = EFFECT_CONFIG[type] ?? EFFECT_CONFIG.slash;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, config.duration);
    return () => clearTimeout(timer);
  }, [config.duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center ${config.className}`}>
      {config.content}
    </div>
  );
}
