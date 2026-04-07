import React, { useCallback } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { ITEMS } from '@shared/data';
import type { BattleRewards } from '@shared/types';
import type { LevelUpResult } from '@/stores/types';

interface BattleResultProps {
  isOpen: boolean;
  isVictory: boolean;
  rewards: BattleRewards | null;
  levelUp: LevelUpResult | null;
  onContinue: () => void;
  onRetry: () => void;
  onHome: () => void;
}

const BattleResult = React.memo(function BattleResult({
  isOpen,
  isVictory,
  rewards,
  levelUp,
  onContinue,
  onRetry,
  onHome,
}: BattleResultProps) {
  const handleContinue = useCallback(() => onContinue(), [onContinue]);
  const handleRetry = useCallback(() => onRetry(), [onRetry]);
  const handleHome = useCallback(() => onHome(), [onHome]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isVictory ? handleContinue : handleHome}
      title={isVictory ? '승리!' : '패배...'}
    >
      {isVictory && rewards ? (
        <div className="space-y-4">
          <p className="text-dungeon-xp text-center font-bold text-lg">전투에서 승리했습니다!</p>

          {/* 레벨업 알림 */}
          {levelUp && levelUp.levelsGained > 0 && (
            <div className="text-center panel bg-dungeon-accent/10 border-dungeon-accent/30">
              <p className="text-dungeon-gold font-bold text-lg">
                레벨 업! Lv.{levelUp.newLevel - levelUp.levelsGained} &rarr; Lv.{levelUp.newLevel}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">획득 경험치</span>
              <span className="text-dungeon-xp font-bold">+{rewards.exp} EXP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">획득 골드</span>
              <span className="text-dungeon-gold font-bold">+{rewards.gold} G</span>
            </div>

            {rewards.items.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-1">획득 아이템</p>
                <div className="space-y-1">
                  {rewards.items.map((drop) => {
                    const item = ITEMS.find((i) => i.id === drop.itemId);
                    return (
                      <div
                        key={drop.itemId}
                        className="flex justify-between text-sm panel py-1 px-2"
                      >
                        <span className="text-gray-200">{item?.name ?? drop.itemId}</span>
                        <span className="text-gray-400">x{drop.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-600 text-center">진행 상황이 자동 저장되었습니다</p>

          <Button variant="primary" size="lg" onClick={handleContinue} className="w-full">
            계속하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-dungeon-health text-center font-bold text-lg">
            전투에서 패배했습니다...
          </p>
          <p className="text-sm text-gray-500 text-center">
            더 강해져서 다시 도전하세요
          </p>
          <div className="flex gap-3">
            <Button variant="primary" size="md" onClick={handleRetry} className="flex-1">
              다시 도전
            </Button>
            <Button variant="secondary" size="md" onClick={handleHome} className="flex-1">
              홈으로
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
});

export default BattleResult;
