import { useState, useCallback, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import type { ResolvedItem } from '@/hooks/useInventory';
import type { Item } from '@shared/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

const rarityColors: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-dungeon-gold',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-dungeon-gold',
};

const typeLabels: Record<string, string> = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구',
  consumable: '소비',
  material: '재료',
};

const ItemSlot = React.memo(function ItemSlot({
  item,
  onSelect,
}: {
  item: ResolvedItem;
  onSelect: (item: ResolvedItem) => void;
}) {
  const handleClick = useCallback(() => onSelect(item), [item, onSelect]);

  return (
    <Card
      hover
      onClick={handleClick}
      className={`relative border-2 ${rarityColors[item.data.rarity]} p-2`}
    >
      {/* Item icon */}
      <div className="w-full aspect-square bg-dungeon-bg rounded-lg mb-1 flex items-center justify-center p-1">
        <img
          src={item.data.iconUrl}
          alt={item.data.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-2xl ${rarityTextColors[item.data.rarity]}">${
              item.data.type === 'weapon' ? '⚔' :
              item.data.type === 'armor' ? '🛡' :
              item.data.type === 'accessory' ? '💍' :
              item.data.type === 'consumable' ? '🧪' : '◆'
            }</span>`;
          }}
        />
      </div>
      <p className={`text-xs font-bold text-center truncate ${rarityTextColors[item.data.rarity]}`}>
        {item.data.name}
      </p>

      {/* Quantity badge */}
      {item.slot.quantity > 1 && (
        <div className="absolute top-1 right-1 bg-dungeon-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {item.slot.quantity}
        </div>
      )}
    </Card>
  );
});

function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onUse,
  onEquip,
}: {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (itemId: string) => void;
  onEquip: (itemId: string, slot: string) => void;
}) {
  if (!item) return null;

  const handleUse = () => onUse(item.id);
  const handleEquip = () => {
    const slot = item.type === 'weapon' ? 'weapon' : item.type === 'armor' ? 'armor' : 'accessory';
    onEquip(item.id, slot);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${rarityTextColors[item.rarity]} bg-dungeon-bg`}>
            {rarityLabels[item.rarity]}
          </span>
          <span className="text-xs text-gray-500">{typeLabels[item.type]}</span>
        </div>

        <p className="text-sm text-gray-300">{item.description}</p>

        {item.stats && (
          <div className="grid grid-cols-2 gap-1 text-xs">
            {item.stats.attack != null && item.stats.attack > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">공격력</span>
                <span className="text-dungeon-health">+{item.stats.attack}</span>
              </div>
            )}
            {item.stats.defense != null && item.stats.defense > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">방어력</span>
                <span className="text-dungeon-mana">+{item.stats.defense}</span>
              </div>
            )}
            {item.stats.hp != null && item.stats.hp > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">HP</span>
                <span className="text-dungeon-health">+{item.stats.hp}</span>
              </div>
            )}
            {item.stats.mp != null && item.stats.mp > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">MP</span>
                <span className="text-dungeon-mana">+{item.stats.mp}</span>
              </div>
            )}
            {item.stats.speed != null && item.stats.speed > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">속도</span>
                <span className="text-dungeon-xp">+{item.stats.speed}</span>
              </div>
            )}
            {item.stats.critRate != null && item.stats.critRate > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">치명타율</span>
                <span className="text-dungeon-gold">+{Math.round(item.stats.critRate * 100)}%</span>
              </div>
            )}
            {item.stats.critDamage != null && item.stats.critDamage > 0 && (
              <div className="flex justify-between panel py-1 px-2">
                <span className="text-gray-500">치명타 피해</span>
                <span className="text-purple-400">+{Math.round(item.stats.critDamage * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {item.useEffect && (
          <p className="text-xs text-dungeon-xp">
            사용 효과: {item.useEffect.type === 'heal_hp' ? `HP ${item.useEffect.value} 회복` :
                       item.useEffect.type === 'heal_mp' ? `MP ${item.useEffect.value} 회복` :
                       item.useEffect.type === 'buff_attack' ? `공격력 ${item.useEffect.value} 증가` :
                       `방어력 ${item.useEffect.value} 증가`}
          </p>
        )}

        <p className="text-xs text-gray-600">판매가: {item.sellPrice} G</p>

        <div className="flex gap-2">
          {item.type === 'consumable' && (
            <Button variant="primary" size="sm" onClick={handleUse} className="flex-1">
              사용하기
            </Button>
          )}
          {(item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') && (
            <Button variant="primary" size="sm" onClick={handleEquip} className="flex-1">
              장착하기
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InventoryScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, totalGold, totalGems, useItem, equipItem } = useInventory();

  const [selectedItem, setSelectedItem] = useState<ResolvedItem | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSelect = useCallback((item: ResolvedItem) => {
    setSelectedItem(item);
  }, []);

  const handleClose = useCallback(() => setSelectedItem(null), []);

  const handleUse = useCallback(
    (itemId: string) => {
      useItem(itemId);
      setSelectedItem(null);
    },
    [useItem],
  );

  const handleEquip = useCallback(
    (itemId: string, slot: string) => {
      equipItem(itemId, slot);
      setSelectedItem(null);
    },
    [equipItem],
  );

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">가방</h1>
          <div className="flex gap-4 text-sm mt-1">
            <span className="text-dungeon-gold">G {totalGold.toLocaleString()}</span>
            <span className="text-purple-400">&#9670; {totalGems.toLocaleString()}</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 text-lg">가방이 비어있습니다</p>
          <p className="text-gray-700 text-sm mt-1">던전에서 아이템을 획득하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {items.map((item) => (
            <ItemSlot key={item.slot.itemId} item={item} onSelect={handleSelect} />
          ))}
        </div>
      )}

      <ItemDetailModal
        item={selectedItem?.data ?? null}
        isOpen={selectedItem !== null}
        onClose={handleClose}
        onUse={handleUse}
        onEquip={handleEquip}
      />
    </div>
  );
}

export default InventoryScreen;
