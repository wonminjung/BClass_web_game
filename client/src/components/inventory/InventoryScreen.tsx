import { useState, useCallback, useEffect, useMemo } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import type { ResolvedItem, EquippedSlotInfo } from '@/hooks/useInventory';
import type { Item } from '@shared/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

// ── Shared constants ──

const rarityColors: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/10',
  uncommon: 'bg-green-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-yellow-500/10',
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
  legendary: 'text-yellow-400',
};

const typeLabels: Record<string, string> = {
  weapon: '무기',
  shield: '방패',
  helm: '투구',
  shoulders: '견갑',
  chest: '흉갑',
  gloves: '장갑',
  belt: '허리띠',
  legs: '다리',
  boots: '장화',
  accessory: '장신구',
  consumable: '소비',
  material: '재료',
};

const typeEmojis: Record<string, string> = {
  weapon: '\u2694',
  shield: '\uD83D\uDEE1',
  helm: '\uD83E\uDE96',
  shoulders: '\uD83E\uDDB6',
  chest: '\uD83E\uDDE5',
  gloves: '\uD83E\uDDE4',
  belt: '\u2696',
  legs: '\uD83D\uDC56',
  boots: '\uD83E\uDD7E',
  accessory: '\uD83D\uDC8D',
  consumable: '\uD83E\uDDEA',
  material: '\u25C6',
};

// ── Stat display helper ──

function StatLine({ label, value, color, isPercent }: { label: string; value: number; color: string; isPercent?: boolean }) {
  if (!value || value === 0) return null;
  return (
    <div className="flex justify-between panel py-1 px-2">
      <span className="text-gray-500">{label}</span>
      <span className={color}>
        +{isPercent ? `${Math.round(value * 100)}%` : value}
      </span>
    </div>
  );
}

function enhanceCost(targetLevel: number): number {
  return targetLevel <= 2 ? 2 : Math.pow(2, targetLevel - 1);
}

function EnhanceBadge({ level, exp }: { level: number; exp?: number }) {
  if (level <= 0 && (!exp || exp <= 0)) return null;
  const color = level >= 10 ? 'text-yellow-400' : level >= 5 ? 'text-purple-400' : level > 0 ? 'text-blue-400' : 'text-gray-400';
  const nextCost = enhanceCost(level + 1);
  return (
    <span className={`text-xs font-bold ${color}`}>
      +{level}
      {exp !== undefined && exp > 0 && <span className="text-[9px] text-gray-500 ml-0.5">({exp}/{nextCost})</span>}
    </span>
  );
}

// ── Item icon component ──

function ItemIcon({ item, size = 'md' }: { item: Item; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-full h-full';
  return (
    <img
      src={item.iconUrl}
      alt={item.name}
      className={`${sizeClass} object-contain`}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.style.display = 'none';
        if (img.parentElement) {
          img.parentElement.innerHTML = `<span class="text-2xl ${rarityTextColors[item.rarity]}">${typeEmojis[item.type] ?? '\u25C6'}</span>`;
        }
      }}
    />
  );
}

// ── Equipped slot component ──

const EquippedSlot = React.memo(function EquippedSlot({
  slot,
  label,
  onClickEquipped,
  onClickEmpty,
}: {
  slot: EquippedSlotInfo;
  label: string;
  onClickEquipped: (slot: EquippedSlotInfo) => void;
  onClickEmpty: (slotName: string) => void;
}) {
  const handleClick = useCallback(() => {
    if (slot.data) {
      onClickEquipped(slot);
    } else {
      onClickEmpty(slot.slotName);
    }
  }, [slot, onClickEquipped, onClickEmpty]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:bg-dungeon-panel/50 ${
        slot.data
          ? `${rarityColors[slot.data.rarity]} ${rarityBgColors[slot.data.rarity]}`
          : 'border-dungeon-border/30 border-dashed'
      }`}
    >
      <div className="w-12 h-12 flex items-center justify-center mb-1">
        {slot.data ? (
          <ItemIcon item={slot.data} />
        ) : (
          <span className="text-gray-600 text-xs">{label}</span>
        )}
      </div>
      {slot.data ? (
        <div className="text-center">
          <p className={`text-[10px] font-bold truncate max-w-[72px] ${rarityTextColors[slot.data.rarity]}`}>
            {slot.data.name}
          </p>
          <EnhanceBadge level={slot.enhanceLevel} />
        </div>
      ) : (
        <p className="text-[10px] text-gray-600">{label}</p>
      )}
    </button>
  );
});

// ── Item slot (inventory grid) ──

const ItemSlot = React.memo(function ItemSlot({
  item,
  enhanceLevel,
  enhanceExp,
  onSelect,
}: {
  item: ResolvedItem;
  enhanceLevel: number;
  enhanceExp: number;
  onSelect: (item: ResolvedItem) => void;
}) {
  const handleClick = useCallback(() => onSelect(item), [item, onSelect]);

  return (
    <Card
      hover
      onClick={handleClick}
      className={`relative border-2 ${rarityColors[item.data.rarity]} p-2`}
    >
      <div className="w-full aspect-square bg-dungeon-bg rounded-lg mb-1 flex items-center justify-center p-1">
        <ItemIcon item={item.data} />
      </div>
      <p className={`text-xs font-bold text-center truncate ${rarityTextColors[item.data.rarity]}`}>
        {item.data.name}
      </p>
      {(enhanceLevel > 0 || enhanceExp > 0) && (
        <div className="text-center">
          <EnhanceBadge level={enhanceLevel} exp={enhanceExp} />
        </div>
      )}
      {item.slot.quantity > 1 && (
        <div className="absolute top-1 right-1 bg-dungeon-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {item.slot.quantity}
        </div>
      )}
    </Card>
  );
});

// ── Item detail modal (shared) ──

function ItemStatsDisplay({ item, enhanceLevel }: { item: Item; enhanceLevel: number }) {
  if (!item.stats) return null;
  const mult = 1 + enhanceLevel;
  return (
    <div className="grid grid-cols-2 gap-1 text-xs">
      <StatLine label="공격력" value={(item.stats.attack ?? 0) * mult} color="text-red-400" />
      <StatLine label="방어력" value={(item.stats.defense ?? 0) * mult} color="text-blue-400" />
      <StatLine label="HP" value={(item.stats.hp ?? 0) * mult} color="text-red-400" />
      <StatLine label="MP" value={(item.stats.mp ?? 0) * mult} color="text-blue-400" />
      <StatLine label="속도" value={(item.stats.speed ?? 0) * mult} color="text-green-400" />
      <StatLine label="치명타율" value={(item.stats.critRate ?? 0) * mult} color="text-yellow-400" isPercent />
      <StatLine label="치명타 피해" value={(item.stats.critDamage ?? 0) * mult} color="text-purple-400" isPercent />
    </div>
  );
}

// ── Equip selection modal ──

function EquipSelectModal({
  isOpen,
  onClose,
  slotName,
  candidates,
  getEnhanceLevel,
  onEquip,
}: {
  isOpen: boolean;
  onClose: () => void;
  slotName: string;
  candidates: ResolvedItem[];
  getEnhanceLevel: (id: string) => number;
  onEquip: (itemId: string, slot: string) => void;
}) {
  const slotLabel = typeLabels[slotName] ?? slotName;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${slotLabel} 선택`}>
      {candidates.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          장착 가능한 {slotLabel}이(가) 없습니다
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {candidates.map((c) => {
            const enh = getEnhanceLevel(c.data.id);
            return (
              <button
                key={c.data.id}
                type="button"
                onClick={() => { onEquip(c.data.id, slotName); onClose(); }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border ${rarityColors[c.data.rarity]} hover:bg-dungeon-panel/50 transition-colors text-left`}
              >
                <div className="w-10 h-10 bg-dungeon-bg rounded flex items-center justify-center flex-shrink-0">
                  <ItemIcon item={c.data} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold truncate ${rarityTextColors[c.data.rarity]}`}>
                      {c.data.name}
                    </span>
                    <EnhanceBadge level={enh} />
                  </div>
                  <div className="flex gap-2 text-[10px] text-gray-500">
                    {c.data.stats?.attack ? <span>ATK +{(c.data.stats.attack * (1 + enh))}</span> : null}
                    {c.data.stats?.defense ? <span>DEF +{(c.data.stats.defense * (1 + enh))}</span> : null}
                    {c.data.stats?.hp ? <span>HP +{(c.data.stats.hp * (1 + enh))}</span> : null}
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${rarityTextColors[c.data.rarity]} bg-dungeon-bg`}>
                  {rarityLabels[c.data.rarity]}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={onClose} className="w-full">
          취소
        </Button>
      </div>
    </Modal>
  );
}

// ── Equipped item detail modal ──

function EquippedDetailModal({
  isOpen,
  onClose,
  slot,
  onUnequip,
}: {
  isOpen: boolean;
  onClose: () => void;
  slot: EquippedSlotInfo | null;
  onUnequip: (slotName: string) => void;
}) {
  if (!slot?.data) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={slot.data.name}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${rarityTextColors[slot.data.rarity]} bg-dungeon-bg`}>
            {rarityLabels[slot.data.rarity]}
          </span>
          <span className="text-xs text-gray-500">{typeLabels[slot.data.type]}</span>
          <EnhanceBadge level={slot.enhanceLevel} />
        </div>
        <p className="text-sm text-gray-300">{slot.data.description}</p>
        <ItemStatsDisplay item={slot.data} enhanceLevel={slot.enhanceLevel} />
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => { onUnequip(slot.slotName); onClose(); }}
            className="flex-1"
          >
            장착 해제
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Stat comparison helper ──

function CompareStatLine({ label, newVal, oldVal, color, isPercent }: {
  label: string; newVal: number; oldVal: number; color: string; isPercent?: boolean;
}) {
  if (newVal === 0 && oldVal === 0) return null;
  const diff = newVal - oldVal;
  const fmt = (v: number) => isPercent ? `${Math.round(v * 100)}%` : String(Math.round(v));
  return (
    <div className="flex justify-between panel py-1 px-2">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={color}>+{fmt(newVal)}</span>
        {diff !== 0 && (
          <span className={`text-[10px] font-bold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({diff > 0 ? '\u25B2' : '\u25BC'}{fmt(Math.abs(diff))})
          </span>
        )}
      </div>
    </div>
  );
}

// ── Inventory item detail modal ──

function ItemDetailModal({
  item,
  enhanceLevel,
  currentEquipped,
  isOpen,
  onClose,
  onUse,
  onEquip,
}: {
  item: Item | null;
  enhanceLevel: number;
  currentEquipped: EquippedSlotInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (itemId: string) => void;
  onEquip: (itemId: string, slot: string) => void;
}) {
  if (!item) return null;

  const isEquipType = ['weapon', 'shield', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory'].includes(item.type);
  const equipSlot = item.type;
  const mult = 1 + enhanceLevel;

  // Current equipped item stats for comparison
  const equippedMult = currentEquipped ? 1 + currentEquipped.enhanceLevel : 1;
  const equippedStats = currentEquipped?.data?.stats;
  const showCompare = isEquipType && currentEquipped?.data != null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${rarityTextColors[item.rarity]} bg-dungeon-bg`}>
            {rarityLabels[item.rarity]}
          </span>
          <span className="text-xs text-gray-500">{typeLabels[item.type]}</span>
          <EnhanceBadge level={enhanceLevel} />
        </div>
        <p className="text-sm text-gray-300">{item.description}</p>

        {/* Stats with comparison */}
        {item.stats && (
          showCompare ? (
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500 mb-1">
                vs 착용중: <span className={rarityTextColors[currentEquipped!.data!.rarity]}>{currentEquipped!.data!.name}</span>
                {currentEquipped!.enhanceLevel > 0 && <span className="text-blue-400"> +{currentEquipped!.enhanceLevel}</span>}
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <CompareStatLine label="공격력" newVal={(item.stats.attack ?? 0) * mult} oldVal={(equippedStats?.attack ?? 0) * equippedMult} color="text-red-400" />
                <CompareStatLine label="방어력" newVal={(item.stats.defense ?? 0) * mult} oldVal={(equippedStats?.defense ?? 0) * equippedMult} color="text-blue-400" />
                <CompareStatLine label="HP" newVal={(item.stats.hp ?? 0) * mult} oldVal={(equippedStats?.hp ?? 0) * equippedMult} color="text-red-400" />
                <CompareStatLine label="MP" newVal={(item.stats.mp ?? 0) * mult} oldVal={(equippedStats?.mp ?? 0) * equippedMult} color="text-blue-400" />
                <CompareStatLine label="속도" newVal={(item.stats.speed ?? 0) * mult} oldVal={(equippedStats?.speed ?? 0) * equippedMult} color="text-green-400" />
                <CompareStatLine label="치명타율" newVal={(item.stats.critRate ?? 0) * mult} oldVal={(equippedStats?.critRate ?? 0) * equippedMult} color="text-yellow-400" isPercent />
                <CompareStatLine label="치명타 피해" newVal={(item.stats.critDamage ?? 0) * mult} oldVal={(equippedStats?.critDamage ?? 0) * equippedMult} color="text-purple-400" isPercent />
              </div>
            </div>
          ) : (
            <ItemStatsDisplay item={item} enhanceLevel={enhanceLevel} />
          )
        )}

        {item.useEffect && (
          <p className="text-xs text-green-400">
            사용 효과: {item.useEffect.type === 'heal_hp' ? `HP ${item.useEffect.value} 회복` :
                       item.useEffect.type === 'heal_mp' ? `MP ${item.useEffect.value} 회복` :
                       item.useEffect.type === 'buff_attack' ? `공격력 ${item.useEffect.value} 증가` :
                       `방어력 ${item.useEffect.value} 증가`}
          </p>
        )}

        {enhanceLevel > 0 && (
          <p className="text-xs text-gray-500">
            강화 배율: x{1 + enhanceLevel} (기본 스탯의 {(1 + enhanceLevel) * 100}%)
          </p>
        )}

        <p className="text-xs text-gray-600">판매가: {item.sellPrice} G</p>

        <div className="flex gap-2">
          {item.type === 'consumable' && (
            <Button variant="primary" size="sm" onClick={() => { onUse(item.id); onClose(); }} className="flex-1">
              사용하기
            </Button>
          )}
          {isEquipType && (
            <Button variant="primary" size="sm" onClick={() => { onEquip(item.id, equipSlot); onClose(); }} className="flex-1">
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

// ── Main screen ──

function InventoryScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData } = useAuth();
  const {
    equipmentItems, nonEquipmentItems, equippedSlots,
    getEnhanceLevel, getEnhanceExp, totalGold, totalGems,
    useItem, equipItem, unequipItem, SLOT_LABELS,
  } = useInventory();

  const [tab, setTab] = useState<'equip' | 'bag'>('equip');
  const [selectedItem, setSelectedItem] = useState<ResolvedItem | null>(null);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState<EquippedSlotInfo | null>(null);
  const [equipSelectSlot, setEquipSelectSlot] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Candidates for equip selection (items in inventory matching the slot type)
  const equipCandidates = useMemo(() => {
    if (!equipSelectSlot || !saveData) return [];
    return equipmentItems.filter((i) => i.data.type === equipSelectSlot);
  }, [equipSelectSlot, equipmentItems, saveData]);

  const handleSelectItem = useCallback((item: ResolvedItem) => setSelectedItem(item), []);
  const handleCloseItem = useCallback(() => setSelectedItem(null), []);
  const handleCloseEquipped = useCallback(() => setSelectedEquipSlot(null), []);
  const handleCloseEquipSelect = useCallback(() => setEquipSelectSlot(null), []);
  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  const handleClickEquipped = useCallback((slot: EquippedSlotInfo) => {
    setSelectedEquipSlot(slot);
  }, []);

  const handleClickEmptySlot = useCallback((slotName: string) => {
    setEquipSelectSlot(slotName);
  }, []);

  const handleEquip = useCallback(
    async (itemId: string, slot: string) => {
      await equipItem(itemId, slot);
    },
    [equipItem],
  );

  const handleUnequip = useCallback(
    async (slot: string) => {
      await unequipItem(slot);
    },
    [unequipItem],
  );

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-dungeon-accent">장비 & 가방</h1>
          <div className="flex gap-4 text-sm mt-1">
            <span className="text-yellow-400">G {totalGold.toLocaleString()}</span>
            <span className="text-purple-400">&#9670; {totalGems.toLocaleString()}</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          돌아가기
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          type="button"
          onClick={() => setTab('equip')}
          className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
            tab === 'equip'
              ? 'bg-dungeon-panel text-dungeon-accent border-b-2 border-dungeon-accent'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          장비
        </button>
        <button
          type="button"
          onClick={() => setTab('bag')}
          className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
            tab === 'bag'
              ? 'bg-dungeon-panel text-dungeon-accent border-b-2 border-dungeon-accent'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          가방 ({nonEquipmentItems.length})
        </button>
      </div>

      {/* Equipment tab */}
      {tab === 'equip' && (
        <div className="space-y-6">
          {/* Equipped slots */}
          <Card className="p-4">
            <h2 className="text-sm font-bold text-gray-400 mb-3">착용 중인 장비</h2>
            <div className="grid grid-cols-5 gap-3">
              {equippedSlots.map((slot) => (
                <EquippedSlot
                  key={slot.slotName}
                  slot={slot}
                  label={SLOT_LABELS[slot.slotName] ?? slot.slotName}
                  onClickEquipped={handleClickEquipped}
                  onClickEmpty={handleClickEmptySlot}
                />
              ))}
            </div>
          </Card>

          {/* Equipment inventory */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 mb-3">
              보유 장비 ({equipmentItems.length})
            </h2>
            {equipmentItems.length === 0 ? (
              <p className="text-center text-gray-600 py-8">보유한 장비가 없습니다</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {equipmentItems.map((item) => (
                  <ItemSlot
                    key={item.slot.itemId}
                    item={item}
                    enhanceLevel={getEnhanceLevel(item.data.id)}
                    enhanceExp={getEnhanceExp(item.data.id)}
                    onSelect={handleSelectItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bag tab (consumables + materials) */}
      {tab === 'bag' && (
        <div>
          {nonEquipmentItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">가방이 비어있습니다</p>
              <p className="text-gray-700 text-sm mt-1">던전에서 아이템을 획득하세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {nonEquipmentItems.map((item) => (
                <ItemSlot
                  key={item.slot.itemId}
                  item={item}
                  enhanceLevel={0}
                  enhanceExp={0}
                  onSelect={handleSelectItem}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ItemDetailModal
        item={selectedItem?.data ?? null}
        enhanceLevel={selectedItem ? getEnhanceLevel(selectedItem.data.id) : 0}
        currentEquipped={selectedItem ? equippedSlots.find((s) => s.slotName === selectedItem.data.type) ?? null : null}
        isOpen={selectedItem !== null}
        onClose={handleCloseItem}
        onUse={useItem}
        onEquip={handleEquip}
      />

      <EquippedDetailModal
        isOpen={selectedEquipSlot !== null}
        onClose={handleCloseEquipped}
        slot={selectedEquipSlot}
        onUnequip={handleUnequip}
      />

      <EquipSelectModal
        isOpen={equipSelectSlot !== null}
        onClose={handleCloseEquipSelect}
        slotName={equipSelectSlot ?? ''}
        candidates={equipCandidates}
        getEnhanceLevel={getEnhanceLevel}
        onEquip={handleEquip}
      />
    </div>
  );
}

export default InventoryScreen;
