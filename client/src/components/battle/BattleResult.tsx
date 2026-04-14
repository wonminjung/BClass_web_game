import React, { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { ITEMS } from '@shared/data';
import type { BattleRewards, BattleStats } from '@shared/types';
import type { LevelUpResult } from '@/stores/types';

interface BattleResultProps {
  isOpen: boolean;
  isVictory: boolean;
  rewards: BattleRewards | null;
  levelUp: LevelUpResult | null;
  onContinue: () => void;
  onRetry: () => void;
  onHome: () => void;
  stats?: BattleStats | null;
  isAbyss?: boolean;
  abyssFloor?: number | null;
  abyssNextFloor?: number | null;
  onNextFloor?: () => void;
}

const BattleResult = React.memo(function BattleResult({
  isOpen,
  isVictory,
  rewards,
  levelUp,
  onContinue,
  onRetry,
  onHome,
  stats,
  isAbyss,
  abyssFloor,
  abyssNextFloor,
  onNextFloor,
}: BattleResultProps) {
  const [showStats, setShowStats] = useState(false);
  const handleContinue = useCallback(() => onContinue(), [onContinue]);
  const handleRetry = useCallback(() => onRetry(), [onRetry]);
  const handleHome = useCallback(() => onHome(), [onHome]);
  const handleNextFloor = useCallback(() => onNextFloor?.(), [onNextFloor]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isAbyss) {
          handleNextFloor();
        } else if (isVictory) {
          handleContinue();
        } else {
          handleRetry();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleHome();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isAbyss, isVictory, handleNextFloor, handleContinue, handleRetry, handleHome]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isVictory ? handleContinue : handleHome}
      title={isVictory ? (isAbyss ? `${abyssFloor}층 클리어!` : '승리!') : '패배...'}
    >
      {isVictory && rewards ? (
        <div className="space-y-4">
          {isAbyss ? (
            <p className="text-purple-400 text-center font-bold text-lg">
              심연 {abyssFloor}층을 돌파했습니다!
            </p>
          ) : (
            <p className="text-green-400 text-center font-bold text-lg">전투에서 승리했습니다!</p>
          )}

          {levelUp && levelUp.levelsGained > 0 && (
            <div className="text-center panel bg-yellow-500/10 border-yellow-500/30">
              <p className="text-yellow-400 font-bold text-lg">
                레벨 업! Lv.{levelUp.newLevel - levelUp.levelsGained} &rarr; Lv.{levelUp.newLevel}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">획득 경험치</span>
              <span className="text-green-400 font-bold">+{rewards.exp} EXP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">획득 골드</span>
              <span className="text-yellow-400 font-bold">+{rewards.gold} G</span>
            </div>

            {rewards.items.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-1">획득 아이템</p>
                <div className="space-y-1">
                  {rewards.items.map((drop) => {
                    const item = ITEMS.find((i) => i.id === drop.itemId);
                    return (
                      <div key={drop.itemId} className="flex justify-between text-sm panel py-1 px-2">
                        <span className={`${item?.rarity === 'mythic' ? 'text-rose-400 font-bold' : item?.rarity === 'legendary' ? 'text-yellow-400 font-bold' : 'text-gray-200'}`}>
                          {item?.name ?? drop.itemId}
                        </span>
                        <span className="text-gray-400">x{drop.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {stats && (
            <div className="border-t border-dungeon-border pt-2">
              <button
                type="button"
                onClick={() => setShowStats((v) => !v)}
                className="w-full text-left text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <span className={`transition-transform ${showStats ? 'rotate-90' : ''}`}>&#9654;</span>
                전투 통계
              </button>
              {showStats && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">총 피해량</span>
                    <span className="text-red-400 font-bold">{stats.totalDamageDealt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">받은 피해</span>
                    <span className="text-orange-400 font-bold">{stats.totalDamageTaken.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">최고 치명타</span>
                    <span className="text-yellow-400 font-bold">{stats.highestCrit > 0 ? stats.highestCrit.toLocaleString() : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">경과 턴</span>
                    <span className="text-gray-300">{stats.turnsElapsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">사용한 스킬</span>
                    <span className="text-gray-300">{stats.skillsUsed}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-gray-600 text-center">진행 상황이 자동 저장되었습니다</p>

          {isAbyss ? (
            <div className="flex gap-3">
              <Button variant="primary" size="lg" onClick={handleNextFloor} className="flex-1">
                {abyssNextFloor}층으로 진행
              </Button>
              <Button variant="secondary" size="md" onClick={handleHome} className="flex-1">
                귀환
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="lg" onClick={handleContinue} className="w-full">
              계속하기
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-red-400 text-center font-bold text-lg">
            {isAbyss ? `심연 ${abyssFloor}층에서 쓰러졌습니다...` : '전투에서 패배했습니다...'}
          </p>
          {isAbyss && abyssNextFloor !== null && abyssNextFloor !== undefined && (
            <p className="text-sm text-purple-300 text-center">
              {abyssNextFloor}층으로 후퇴합니다 (-10층)
            </p>
          )}
          <p className="text-sm text-gray-500 text-center">
            더 강해져서 다시 도전하세요
          </p>
          <div className="flex gap-3">
            {isAbyss ? (
              <>
                <Button variant="primary" size="md" onClick={handleNextFloor} className="flex-1">
                  {abyssNextFloor}층에서 재도전
                </Button>
                <Button variant="secondary" size="md" onClick={handleHome} className="flex-1">
                  귀환
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="md" onClick={handleRetry} className="flex-1">
                  다시 도전
                </Button>
                <Button variant="secondary" size="md" onClick={handleHome} className="flex-1">
                  홈으로
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
});

export default BattleResult;
