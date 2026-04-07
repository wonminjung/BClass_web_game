import { useState, useCallback, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/stores/gameStore';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import StatBar from '@/components/common/StatBar';
import type { Character } from '@shared/types';

const classIcons: Record<string, string> = {
  dark_knight: '🗡️',
  shadow_mage: '🔮',
  hunter: '🏹',
  priest: '✨',
  assassin: '🗡️',
};

const classLabels: Record<string, string> = {
  dark_knight: '암흑 기사',
  shadow_mage: '그림자 마법사',
  hunter: '사냥꾼',
  priest: '성직자',
  assassin: '암살자',
};

function formatSaveCode(code: string): string {
  return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

const CharacterCard = React.memo(function CharacterCard({
  character,
  isSelected,
  onSelect,
}: {
  character: Character;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const handleClick = useCallback(() => onSelect(character.id), [character.id, onSelect]);

  return (
    <Card
      hover
      onClick={handleClick}
      className={`transition-all duration-200 ${
        isSelected
          ? 'border-dungeon-accent shadow-lg shadow-dungeon-accent/20'
          : ''
      }`}
    >
      <div className="w-full h-24 bg-dungeon-bg rounded-lg mb-3 flex items-center justify-center text-4xl">
        {classIcons[character.classType] ?? '?'}
      </div>

      <h3 className="text-lg font-bold text-dungeon-accent">{character.name}</h3>
      <p className="text-sm text-gray-400 mb-1">{character.title}</p>
      <p className="text-xs text-gray-500 mb-1">{classLabels[character.classType]}</p>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{character.description}</p>

      <div className="space-y-1.5">
        <StatBar current={character.baseStats.hp} max={400} color="health" label="HP" showNumbers />
        <StatBar current={character.baseStats.mp} max={200} color="mana" label="MP" showNumbers />
        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
          <div className="text-center">
            <span className="text-gray-500">공격</span>
            <p className="text-dungeon-health font-bold">{character.baseStats.attack}</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500">방어</span>
            <p className="text-dungeon-mana font-bold">{character.baseStats.defense}</p>
          </div>
          <div className="text-center">
            <span className="text-gray-500">속도</span>
            <p className="text-dungeon-xp font-bold">{character.baseStats.speed}</p>
          </div>
        </div>
      </div>
    </Card>
  );
});

function CharacterSelect() {
  const navigate = useNavigate();
  const { createNewGame, saveCode, isAuthenticated, isLoading, error } = useAuth();
  const { characters, loadGameData } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedId || !playerName.trim()) return;
    await createNewGame(playerName.trim(), selectedId);
    setShowCodeModal(true);
  }, [selectedId, playerName, createNewGame]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(saveCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = saveCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [saveCode]);

  const handleConfirmCode = useCallback(() => {
    setShowCodeModal(false);
    navigate('/home');
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-dungeon-accent mb-2">
        영웅 선택
      </h1>
      <p className="text-center text-gray-500 mb-6">어둠에 맞설 영웅을 선택하세요</p>

      {/* Player name input */}
      <div className="max-w-sm mx-auto mb-6">
        <label htmlFor="playerName" className="block text-sm text-gray-400 mb-1">
          모험가 이름
        </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="이름을 입력하세요"
          maxLength={12}
          className="w-full px-4 py-2 bg-dungeon-bg border border-dungeon-border rounded-lg
                     text-gray-100 focus:outline-none focus:border-dungeon-accent transition-colors"
        />
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            isSelected={selectedId === char.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {error && <p className="text-dungeon-health text-sm text-center mb-4">{error}</p>}

      {/* Start button */}
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          disabled={!selectedId || !playerName.trim() || isLoading}
        >
          {isLoading ? '생성 중...' : '모험 시작'}
        </Button>
      </div>

      {/* Save code modal */}
      <Modal
        isOpen={showCodeModal && isAuthenticated}
        onClose={handleConfirmCode}
        title="세이브 코드 발급"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400 text-center">
            이 코드를 반드시 기록해 주세요!<br />
            다음에 로그인할 때 필요합니다.
          </p>

          <div className="panel bg-dungeon-bg text-center py-4">
            <p className="text-2xl font-mono font-bold text-dungeon-gold tracking-widest">
              {formatSaveCode(saveCode)}
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleCopy}
            className="w-full"
          >
            {copied ? '복사 완료!' : '코드 복사하기'}
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirmCode}
            className="w-full"
          >
            코드를 저장했습니다
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default CharacterSelect;
