import React from 'react';

interface StatBarProps {
  current: number;
  max: number;
  color: 'health' | 'mana' | 'xp';
  label?: string;
  showNumbers?: boolean;
}

const colorMap: Record<string, string> = {
  health: 'bg-dungeon-health',
  mana: 'bg-dungeon-mana',
  xp: 'bg-dungeon-xp',
};

const StatBar = React.memo(function StatBar({
  current,
  max,
  color,
  label,
  showNumbers = true,
}: StatBarProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      {(label || showNumbers) && (
        <div className="flex justify-between text-xs mb-1">
          {label && <span className="text-gray-400">{label}</span>}
          {showNumbers && (
            <span className="text-gray-300">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      <div className="stat-bar">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

export default StatBar;
