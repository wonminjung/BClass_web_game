import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { toast } from '@/components/common/Toast';

interface PullResult {
  itemId: string;
  isNew: boolean;
  name?: string;
  rarity?: string;
}

const PITY_MAX = 50;

function GachaScreen() {
  const navigate = useNavigate();
  const saveData = useAuthStore((s) => s.saveData);
  const updateSaveData = useAuthStore((s) => s.updateSaveData);
  const [results, setResults] = useState<PullResult[]>([]);
  const [pulling, setPulling] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasMythic, setHasMythic] = useState(false);

  const pity = saveData?.gachaPity ?? 0;
  const gems = saveData?.gems ?? 0;

  const doPull = useCallback(async (type: 'single' | 'multi') => {
    setPulling(true);
    setResults([]);
    setShowAnimation(true);
    setHasMythic(false);

    try {
      const res = await axios.post(`/api/gacha/${type}`);
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
            toast.success('신화 장비 획득!');
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
  }, [updateSaveData]);

  if (!saveData) return null;

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

      {/* Pity counter */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">천장 카운터</span>
          <span className="text-sm font-bold text-rose-400">{pity} / {PITY_MAX}</span>
        </div>
        <div className="w-full bg-dungeon-bg rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (pity / PITY_MAX) * 100)}%`,
              background: pity >= PITY_MAX - 5
                ? 'linear-gradient(90deg, #f43f5e, #fbbf24)'
                : 'linear-gradient(90deg, #6b7280, #f43f5e)',
            }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {PITY_MAX}회 소환 시 신화 장비 확정 (기본 확률 2%)
        </p>
      </Card>

      {/* Pull buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => doPull('single')}
          disabled={pulling || gems < 100}
          className="py-4 bg-dungeon-panel border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10 transition-all disabled:opacity-40"
        >
          <div className="text-center">
            <p className="text-lg font-bold text-rose-400">1회 소환</p>
            <p className="text-xs text-gray-400 mt-1">100 젬</p>
          </div>
        </Button>
        <Button
          onClick={() => doPull('multi')}
          disabled={pulling || gems < 900}
          className="py-4 bg-dungeon-panel border border-rose-500/50 hover:border-rose-500/80 hover:bg-rose-500/20 transition-all disabled:opacity-40"
        >
          <div className="text-center">
            <p className="text-lg font-bold text-rose-300">10연차 소환</p>
            <p className="text-xs text-gray-400 mt-1">900 젬 <span className="text-green-400">(10% 할인)</span></p>
          </div>
        </Button>
      </div>

      {/* Animation */}
      {showAnimation && (
        <div className="text-center py-12">
          <div className={`text-5xl mb-4 ${hasMythic ? 'animate-spin' : 'animate-pulse'}`}>
            {hasMythic ? '\u2728' : '\u{1F52E}'}
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
                key={`${r.itemId}-${i}`}
                className={`p-3 rounded-lg border transition-all ${
                  r.rarity === 'mythic'
                    ? 'border-rose-500 bg-rose-500/10 animate-pulse shadow-lg shadow-rose-500/20'
                    : r.rarity === 'legendary'
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : r.rarity === 'epic'
                        ? 'border-purple-500/50 bg-purple-500/5'
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
                    {r.name ?? r.itemId}
                    {r.rarity === 'mythic' && ' \u2605 \uC2E0\uD654!'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    r.rarity === 'mythic' ? 'bg-rose-500/20 text-rose-400' :
                    r.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                    r.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
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
                  <p className="text-[10px] text-green-400 mt-1">NEW! 새로운 장비가 인벤토리에 추가되었습니다</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="mt-6 text-center text-[11px] text-gray-600 space-y-1">
        <p>신화 등급 장비 확률: 2% (천장 {PITY_MAX}회)</p>
        <p>신화 미획득 시 강화석 지급 (희귀/영웅/전설 랜덤)</p>
        <p>이미 보유한 신화 장비 획득 시 전설 강화석으로 변환</p>
      </div>
    </div>
  );
}

export default GachaScreen;
