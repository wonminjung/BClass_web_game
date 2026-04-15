import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import axios from 'axios';
import { toast, confirm } from '@/components/common/Toast';

const blessingLabels: Record<string, string> = {
  warrior: '전사의 유산',
  sage: '현자의 지혜',
  plunderer: '약탈자의 행운',
  guardian: '수호자의 축복',
};
const blessingIcons: Record<string, string> = {
  warrior: '\u2694\uFE0F',
  sage: '\uD83D\uDCD6',
  plunderer: '\uD83D\uDCB0',
  guardian: '\uD83D\uDEE1\uFE0F',
};
const blessingDescs: Record<string, string> = {
  warrior: 'ATK/DEF +5%, 스킬 20% 유지',
  sage: 'EXP +30%',
  plunderer: '골드/드랍 +25%',
  guardian: '펫 보너스 2배',
};

function PrestigeScreen() {
  const navigate = useNavigate();
  const { saveData, isAuthenticated, updateSaveData } = useAuth();
  const [selectedBlessing, setSelectedBlessing] = useState<string>(saveData?.prestigeBlessingType ?? 'warrior');
  const [prestigeLoading, setPrestigeLoading] = useState(false);

  const handlePrestige = useCallback(async () => {
    if (!selectedBlessing) {
      toast.error('축복을 선택해주세요.');
      return;
    }

    const arts = saveData?.artifacts ?? {};
    const gemBoost = (arts['art_gem'] ?? 0) * 10;
    const nextPrestige = (saveData?.prestigeLevel ?? 0) + 1;
    const baseGems = 50 * nextPrestige;
    const levelBonus = Math.max(0, (saveData?.level ?? 60) - 60) * 2;
    const abyssBonus = Math.floor((saveData?.abyssHighest ?? 0) * 0.5);
    const rawGems = baseGems + levelBonus + abyssBonus;
    const totalGems = Math.round(rawGems * (1 + gemBoost / 100));

    const confirmed = await confirm(
      `환생하시겠습니까?\n\n` +
      `선택한 축복: ${blessingLabels[selectedBlessing]}\n` +
      `보상: 젬 ${totalGems.toLocaleString()}개\n\n` +
      `레벨, 스킬, 특성, 심연이 초기화됩니다.\n` +
      `장비, 강화, 업적, 젬, 유물은 유지됩니다.`
    );
    if (!confirmed) return;

    setPrestigeLoading(true);
    try {
      const res = await axios.post('/api/game/prestige', { blessingType: selectedBlessing });
      if (res.data.success && res.data.saveData) {
        updateSaveData(res.data.saveData);
        toast.success(res.data.message);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '환생에 실패했습니다.';
      toast.error(msg);
    } finally {
      setPrestigeLoading(false);
    }
  }, [saveData, updateSaveData, selectedBlessing]);

  if (!isAuthenticated || !saveData) {
    navigate('/', { replace: true });
    return null;
  }

  const prestigeLevel = saveData.prestigeLevel ?? 0;
  const maxLevel = 300 + prestigeLevel;
  const levelReached = saveData.level >= maxLevel;
  const trialSkip = prestigeLevel >= 10;
  const trialCleared = saveData.prestigeTrialCleared === true;
  const trialOk = trialSkip || trialCleared;
  const canPrestige = levelReached && trialOk;

  const arts = saveData.artifacts ?? {};
  const gemBoost = (arts['art_gem'] ?? 0) * 10;
  const nextPrestige = prestigeLevel + 1;
  const baseGems = 50 * nextPrestige;
  const levelBonus = Math.max(0, (saveData.level ?? 60) - 60) * 2;
  const abyssBonus = Math.floor((saveData.abyssHighest ?? 0) * 0.5);
  const rawGems = baseGems + levelBonus + abyssBonus;
  const totalGems = Math.round(rawGems * (1 + gemBoost / 100));

  const milestones = [
    { level: 10, label: '시련 스킵', reached: prestigeLevel >= 10 },
    { level: 25, label: '수호자의 축복 해금', reached: prestigeLevel >= 25 },
    { level: 50, label: '펫 2마리 동시 출전', reached: prestigeLevel >= 50 },
    { level: 100, label: '스킬 슬롯 +1', reached: prestigeLevel >= 100 },
    { level: 200, label: '크리 오버플로우', reached: prestigeLevel >= 200 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="mb-4 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        &larr; 돌아가기
      </button>

      <Card className="mb-6">
        <h2 className="text-lg font-bold text-center text-purple-300 mb-3">
          &#9760; 영혼의 시련 &#9760;
        </h2>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">환생 횟수</span>
            <span className="font-bold text-purple-300">{prestigeLevel}회</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">맥스 레벨</span>
            <span className={`font-bold ${levelReached ? 'text-green-400' : 'text-red-400'}`}>
              {maxLevel} (현재: {saveData.level}) {levelReached ? '\u2713' : '\u2717'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">시련 보스</span>
            {trialSkip ? (
              <span className="text-green-400 font-bold text-xs">자동 스킵 (10회+) &#10003;</span>
            ) : trialCleared ? (
              <span className="text-green-400 font-bold">처치 완료 &#10003;</span>
            ) : levelReached ? (
              <button
                type="button"
                onClick={() => navigate('/battle/prestige_trial')}
                className="px-3 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded font-bold transition-colors"
              >
                시련 도전
              </button>
            ) : (
              <span className="text-red-400 font-bold">맥스 레벨 필요 &#10007;</span>
            )}
          </div>
          {saveData.prestigeBlessingType && (
            <div>
              <div className="flex justify-between">
                <span className="text-gray-400">현재 축복</span>
                <span className="font-bold text-yellow-300">
                  {blessingIcons[saveData.prestigeBlessingType]} {blessingLabels[saveData.prestigeBlessingType]}
                </span>
              </div>
              <p className="text-[10px] text-yellow-400/60 text-right">{blessingDescs[saveData.prestigeBlessingType]}</p>
            </div>
          )}
        </div>

        {/* Blessing selection */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 text-center mb-2">-- 축복 선택 --</p>
          <div className="grid grid-cols-2 gap-2">
            {(['warrior', 'sage', 'plunderer', 'guardian'] as const).map((type) => {
              const isGuardianLocked = type === 'guardian' && prestigeLevel < 25;
              const isSelected = selectedBlessing === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={isGuardianLocked}
                  onClick={() => setSelectedBlessing(type)}
                  className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                      : isGuardianLocked
                        ? 'border-dungeon-border bg-dungeon-panel/50 text-gray-600 cursor-not-allowed'
                        : 'border-dungeon-border bg-dungeon-panel hover:border-purple-500/50 text-gray-300'
                  }`}
                >
                  <div className="font-bold mb-0.5">
                    {blessingIcons[type]} {blessingLabels[type]}
                    {isGuardianLocked && <span className="text-[10px] text-gray-600 ml-1">(25회)</span>}
                  </div>
                  <div className="text-[10px] text-gray-500">{blessingDescs[type]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gem reward preview */}
        <div className="text-center mb-4">
          <span className="text-sm text-gray-400">보상: </span>
          <span className="text-sm font-bold text-purple-300">
            &#9670; {totalGems.toLocaleString()}개
            {gemBoost > 0 && <span className="text-[10px] text-green-400 ml-1">(+{gemBoost}%)</span>}
          </span>
        </div>

        {/* Prestige button */}
        <button
          type="button"
          onClick={handlePrestige}
          disabled={!canPrestige || prestigeLoading}
          className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors border border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {prestigeLoading ? '환생 중...' : '환생 실행'}
        </button>

        {/* Milestones */}
        <div className="mt-4 pt-3 border-t border-dungeon-border">
          <p className="text-xs text-gray-500 mb-2">마일스톤</p>
          <div className="space-y-1">
            {milestones.map((m) => (
              <div key={m.level} className="flex items-center gap-2 text-xs">
                <span className={m.reached ? 'text-green-400' : 'text-gray-600'}>
                  {m.reached ? '\u2713' : '\u25CB'}
                </span>
                <span className={m.reached ? 'text-gray-300' : 'text-gray-600'}>
                  {m.level}회: {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PrestigeScreen;
