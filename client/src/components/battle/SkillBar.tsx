import React, { useCallback } from 'react';
import type { Skill, SkillState } from '@shared/types';

interface SkillBarProps {
  skills: Skill[];
  skillStates: SkillState[];
  currentMp: number;
  onSkillSelect: (skillId: string) => void;
}

const typeColorMap: Record<string, string> = {
  slash: 'bg-red-800',
  magic: 'bg-purple-800',
  arrow: 'bg-green-800',
  heal: 'bg-emerald-800',
  buff: 'bg-yellow-800',
  dark: 'bg-indigo-900',
  fire: 'bg-orange-800',
  ice: 'bg-cyan-800',
};

const SkillButton = React.memo(function SkillButton({
  skill,
  state,
  currentMp,
  onSelect,
}: {
  skill: Skill;
  state: SkillState | undefined;
  currentMp: number;
  onSelect: (skillId: string) => void;
}) {
  const onCooldown = (state?.currentCooldown ?? 0) > 0;
  const insufficientMp = currentMp < skill.manaCost;
  const isDisabled = onCooldown || insufficientMp || skill.type === 'passive';

  const handleClick = useCallback(() => {
    if (!isDisabled) onSelect(skill.id);
  }, [skill.id, isDisabled, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`relative flex flex-col items-center p-2 rounded-lg border transition-all duration-200 min-w-[72px]
        ${
          isDisabled
            ? 'border-gray-700 opacity-50 cursor-not-allowed'
            : 'border-dungeon-border hover:border-dungeon-accent hover:shadow-md hover:shadow-dungeon-accent/20 active:scale-95'
        }`}
    >
      {/* Skill icon placeholder */}
      <div
        className={`w-10 h-10 rounded-md mb-1 flex items-center justify-center text-xs font-bold text-gray-200 ${typeColorMap[skill.animation] ?? 'bg-gray-700'}`}
      >
        {skill.name[0]}
      </div>

      <span className="text-[10px] font-bold text-gray-200 truncate w-full text-center">
        {skill.name}
      </span>
      <span className="text-[10px] text-dungeon-mana">
        {skill.type === 'passive' ? '패시브' : `${skill.manaCost} MP`}
      </span>

      {/* Cooldown overlay */}
      {onCooldown && (
        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
          <span className="text-xs text-dungeon-gold font-bold">
            쿨타임: {state?.currentCooldown}턴
          </span>
        </div>
      )}
    </button>
  );
});

const SkillBar = React.memo(function SkillBar({
  skills,
  skillStates,
  currentMp,
  onSkillSelect,
}: SkillBarProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {skills.map((skill) => (
        <SkillButton
          key={skill.id}
          skill={skill}
          state={skillStates.find((ss) => ss.skillId === skill.id)}
          currentMp={currentMp}
          onSelect={onSkillSelect}
        />
      ))}
    </div>
  );
});

export default SkillBar;
