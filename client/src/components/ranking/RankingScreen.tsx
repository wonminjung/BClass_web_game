import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CHARACTERS } from '@shared/data';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import axios from 'axios';

interface RankingEntry {
  playerName: string;
  characterId: string;
  level: number;
  abyssHighest: number;
  prestigeLevel: number;
}

function RankingScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    axios
      .get('/api/ranking/abyss')
      .then((res) => {
        if (res.data.success) {
          setEntries(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  if (!saveData) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">랭킹</h1>
          <p className="text-sm text-gray-500 mt-1">심연의 던전 최고 기록</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">로딩 중...</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-500 py-12">아직 기록이 없습니다.</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dungeon-border text-gray-500">
                <th className="py-2 px-3 text-left w-12">#</th>
                <th className="py-2 px-3 text-left">플레이어</th>
                <th className="py-2 px-3 text-center">직업</th>
                <th className="py-2 px-3 text-center">레벨</th>
                <th className="py-2 px-3 text-center">환생</th>
                <th className="py-2 px-3 text-right">심연 최고층</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const character = CHARACTERS.find((c) => c.id === entry.characterId);
                const isMe = entry.playerName === saveData.playerName;
                const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

                return (
                  <tr
                    key={idx}
                    className={`border-b border-dungeon-border/50 ${
                      isMe ? 'bg-dungeon-accent/10' : ''
                    } hover:bg-dungeon-panel/50 transition-colors`}
                  >
                    <td className={`py-2.5 px-3 font-bold ${rankColors[idx] ?? 'text-gray-500'}`}>
                      {idx + 1}
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${isMe ? 'text-dungeon-accent' : 'text-gray-200'}`}>
                      {entry.playerName}
                      {isMe && <span className="ml-1 text-xs text-dungeon-accent">(나)</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-400">
                      {character?.name ?? entry.characterId}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-300">
                      {entry.level}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {entry.prestigeLevel > 0 ? (
                        <span className="text-purple-400">
                          {'★'.repeat(Math.min(entry.prestigeLevel, 5))}
                          {entry.prestigeLevel > 5 && `+${entry.prestigeLevel - 5}`}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-400">
                      {entry.abyssHighest}F
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default RankingScreen;
