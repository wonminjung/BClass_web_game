import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { toast } from '@/components/common/Toast';

interface PullResult {
  itemId?: string;
  petId?: string;
  isNew: boolean;
  name?: string;
  rarity?: string;
  enhanced?: boolean;
  petLevel?: number;
  petExp?: number;
}

const EQUIP_PITY_MAX = 50;
const PET_PITY_MAX = 30;

type GachaTab = 'equipment' | 'pet';

function GachaScreen() {
  const navigate = useNavigate();
  const saveData = useAuthStore((s) => s.saveData);
  const updateSaveData = useAuthStore((s) => s.updateSaveData);
  const [tab, setTab] = useState<GachaTab>('equipment');
  const [results, setResults] = useState<PullResult[]>([]);
  const [pulling, setPulling] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasMythic, setHasMythic] = useState(false);

  const equipPity = saveData?.gachaPity ?? 0;
  const petPity = saveData?.petGachaPity ?? 0;
  const gems = saveData?.gems ?? 0;

  const doPull = useCallback(async (type: 'single' | 'multi') => {
    setPulling(true);
    setResults([]);
    setShowAnimation(true);
    setHasMythic(false);

    const endpoint = tab === 'equipment'
      ? `/api/gacha/${type}`
      : `/api/gacha/pet-${type}`;

    try {
      const res = await axios.post(endpoint);
      if (res.data.success) {
        const pulls: PullResult[] = res.data.pulls;
        const gotMythic = pulls.some(p => p.rarity === 'mythic');
        setHasMythic(gotMythic);

        if (res.data.saveData) {
          updateSaveData(res.data.saveData);
        }

        // Delay showing results for animation effect
        setTimeout(() => {
          setResults(pulls);
          setShowAnimation(false);
          setPulling(false);
          if (gotMythic) {
            toast.success(tab === 'equipment' ? '신화 장비 획득!' : '신화 펫 획득!');
          }
        }, gotMythic ? 2000 : 1000);
      } else {
        toast.error(res.data.message || '소환에 실패했습니다.');
        setShowAnimation(false);
        setPulling(false);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : '소환에 실패했습니다.';
      toast.error(msg);
      setShowAnimation(false);
      setPulling(false);
    }
  }, [updateSaveData, tab]);

  if (!saveData) return null;

  const isEquipTab = tab === 'equipment';
  const currentPity = isEquipTab ? equipPity : petPity;
  const pityMax = isEquipTab ? EQUIP_PITY_MAX : PET_PITY_MAX;
  const singleCost = isEquipTab ? 300 : 500;
  const multiCost = isEquipTab ? 2700 : 4500;

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          &larr; 돌아가기
        </button>
        <h1 className="text-xl font-bold text-rose-400">소환</h1>
        <div className="text-sm text-gray-400">
          <span className="text-cyan-400 font-bold">{gems}</span> 젬
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 gap-2">
        <button
          type="button"
          onClick={() => { setTab('equipment'); setResults([]); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            isEquipTab
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              : 'bg-dungeon-panel text-gray-500 border border-gray-700 hover:border-gray-600'
          }`}
        >
          장비 소환
        </button>
        <button
          type="button"
          onClick={() => { setTab('pet'); setResults([]); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            !isEquipTab
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'bg-dungeon-panel text-gray-500 border border-gray-700 hover:border-gray-600'
          }`}
        >
          펫 소환
        </button>
      </div>

      {/* Pity counter */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">천장 카운터</span>
          <span className={`text-sm font-bold ${isEquipTab ? 'text-rose-400' : 'text-purple-400'}`}>
            {currentPity} / {pityMax}
          </span>
        </div>
        <div className="w-full bg-dungeon-bg rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (currentPity / pityMax) * 100)}%`,
              background: currentPity >= pityMax - 5
                ? 'linear-gradient(90deg, #f43f5e, #fbbf24)'
                : isEquipTab
                  ? 'linear-gradient(90deg, #6b7280, #f43f5e)'
                  : 'linear-gradient(90deg, #6b7280, #a855f7)',
            }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {isEquipTab
            ? `${pityMax}회 소환 시 신화 장비 확정 (기본 확률 2%)`
            : `${pityMax}회 소환 시 신화 펫 확정 (기본 확률 2%)`
          }
        </p>
        {isEquipTab && (
          <p className="text-[10px] text-yellow-500/70 mt-0.5">신화 장비 또는 강화석만 획득 가능</p>
        )}
      </Card>

      {/* Pull buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => doPull('single')}
          disabled={pulling || gems < singleCost}
          className={`py-4 bg-dungeon-panel border ${
            isEquipTab
              ? 'border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10'
              : 'border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10'
          } transition-all disabled:opacity-40`}
        >
          <div className="text-center">
            <p className={`text-lg font-bold ${isEquipTab ? 'text-rose-400' : 'text-purple-400'}`}>
              1회 소환
            </p>
            <p className="text-xs text-gray-400 mt-1">{singleCost} 젬</p>
          </div>
        </Button>
        <Button
          onClick={() => doPull('multi')}
          disabled={pulling || gems < multiCost}
          className={`py-4 bg-dungeon-panel border ${
            isEquipTab
              ? 'border-rose-500/50 hover:border-rose-500/80 hover:bg-rose-500/20'
              : 'border-purple-500/50 hover:border-purple-500/80 hover:bg-purple-500/20'
          } transition-all disabled:opacity-40`}
        >
          <div className="text-center">
            <p className={`text-lg font-bold ${isEquipTab ? 'text-rose-300' : 'text-purple-300'}`}>
              10연차 소환
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {multiCost} 젬 <span className="text-green-400">(10% 할인)</span>
            </p>
          </div>
        </Button>
      </div>

      {/* Animation */}
      {showAnimation && (
        <div className="text-center py-12">
          <div className={`text-5xl mb-4 ${hasMythic ? 'animate-spin' : 'animate-pulse'}`}>
            {hasMythic ? '\u2728' : isEquipTab ? '\u{1F52E}' : '\uD83D\uDC3E'}
          </div>
          <p className="text-gray-400 animate-pulse">소환 중...</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !showAnimation && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">소환 결과</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={`${r.itemId ?? r.petId ?? i}-${i}`}
                className={`p-3 rounded-lg border transition-all ${
                  r.rarity === 'mythic'
                    ? 'border-rose-500 bg-rose-500/10 animate-pulse shadow-lg shadow-rose-500/20'
                    : r.rarity === 'legendary'
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : r.rarity === 'epic'
                        ? 'border-purple-500/50 bg-purple-500/5'
                        : r.rarity === 'rare'
                          ? 'border-blue-500/50 bg-blue-500/5'
                          : 'border-gray-600 bg-dungeon-bg'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${
                    r.rarity === 'mythic' ? 'text-rose-400' :
                    r.rarity === 'legendary' ? 'text-yellow-400' :
                    r.rarity === 'epic' ? 'text-purple-400' :
                    r.rarity === 'rare' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {r.name ?? r.itemId ?? r.petId}
                    {r.rarity === 'mythic' && ' \u2605 \uC2E0\uD654!'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    r.rarity === 'mythic' ? 'bg-rose-500/20 text-rose-400' :
                    r.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                    r.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                    r.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {r.rarity === 'mythic' ? '\uC2E0\uD654' :
                     r.rarity === 'legendary' ? '\uC804\uC124' :
                     r.rarity === 'epic' ? '\uC601\uC6C5' :
                     r.rarity === 'rare' ? '\uD76C\uADC0' :
                     '\uC7AC\uB8CC'}
                  </span>
                </div>
                {r.isNew && (
                  <p className="text-[10px] text-green-400 mt-1">
                    NEW! {tab === 'equipment' ? '새로운 장비가 인벤토리에 추가되었습니다' : '새로운 펫을 획득했습니다'}
                  </p>
                )}
                {r.enhanced && !r.isNew && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    중복! 펫 강화 경험치 +1 (Lv.{r.petLevel ?? 0}, EXP: {r.petExp ?? 0})
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="mt-6 text-center text-[11px] text-gray-600 space-y-1">
        {isEquipTab ? (
          <>
            <p>신화 등급 장비 확률: 2% (천장 {EQUIP_PITY_MAX}회)</p>
            <p>신화 미획득 시 강화석 지급 (희귀/영웅/전설 랜덤)</p>
            <p>이미 보유한 신화 장비 획득 시 전설 강화석으로 변환</p>
          </>
        ) : (
          <>
            <p>신화 등급 펫 확률: 2% (천장 {PET_PITY_MAX}회)</p>
            <p>신화 미획득 시 일반~전설 랜덤 펫 지급</p>
            <p>이미 보유한 펫 획득 시 자동 강화 (경험치 +1)</p>
          </>
        )}
      </div>
    </div>
  );
}

export default GachaScreen;
