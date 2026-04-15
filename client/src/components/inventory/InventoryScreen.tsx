import { useState, useCallback, useEffect, useMemo } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import type { ResolvedItem, EquippedSlotInfo } from '@/hooks/useInventory';
import type { Item, ItemRarity, RandomOption } from '@shared/types';
import { ITEMS, SETS, CHARACTERS, GEMS, TITLES, PETS, ARTIFACTS } from '@shared/data';
import axios from 'axios';
import { toast, confirm } from '@/components/common/Toast';
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
  mythic: 'border-rose-500',
};

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/10',
  uncommon: 'bg-green-500/10',
  rare: 'bg-blue-500/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-yellow-500/10',
  mythic: 'bg-rose-500/10',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
  mythic: '신화',
};

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-rose-400',
};

const typeLabels: Record<string, string> = {
  weapon: '무기',
  shield: '방패',
  offhand: '보조장비',
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
  offhand: '\uD83D\uDEE1',
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

// ── Random option helpers ──

const OPTION_LABELS: Record<string, string> = {
  atk_flat: '공격력',
  atk_percent: '공격력%',
  def_flat: '방어력',
  hp_flat: 'HP',
  hp_percent: 'HP%',
  crit_rate: '크리율%',
  crit_damage: '크리뎀%',
  gold_percent: '골드%',
  exp_percent: '경험치%',
  speed: '속도',
  lifesteal: '흡혈%',
  reflect: '반사%',
  hp_regen: '턴HP회복%',
};

const REROLL_COSTS: Record<string, number> = {
  common: 1000,
  uncommon: 5000,
  rare: 20000,
  epic: 100000,
  legendary: 500000,
  mythic: 2000000,
};

// Option ranges (mirrored from server OptionService)
const OPTION_RANGES: Record<string, Record<string, [number, number]>> = {
  atk_flat: { common: [5,50], uncommon: [10,100], rare: [20,200], epic: [50,500], legendary: [100,1000], mythic: [150,1500] },
  atk_percent: { common: [1,3], uncommon: [2,5], rare: [3,8], epic: [5,12], legendary: [8,20], mythic: [10,30] },
  crit_rate: { common: [1,2], uncommon: [1,3], rare: [2,5], epic: [3,7], legendary: [5,10], mythic: [7,15] },
  crit_damage: { common: [2,5], uncommon: [3,8], rare: [5,12], epic: [8,20], legendary: [10,30], mythic: [15,40] },
  def_flat: { common: [5,50], uncommon: [10,100], rare: [20,200], epic: [50,500], legendary: [100,1000], mythic: [150,1500] },
  hp_flat: { common: [10,100], uncommon: [20,200], rare: [50,500], epic: [100,1000], legendary: [200,2000], mythic: [300,3000] },
  hp_percent: { common: [1,3], uncommon: [2,5], rare: [3,8], epic: [5,12], legendary: [8,20], mythic: [10,30] },
  gold_percent: { common: [1,3], uncommon: [2,5], rare: [3,8], epic: [5,10], legendary: [5,15], mythic: [8,20] },
  exp_percent: { common: [1,3], uncommon: [2,5], rare: [3,8], epic: [5,10], legendary: [5,15], mythic: [8,20] },
  speed: { common: [1,2], uncommon: [1,3], rare: [2,5], epic: [3,7], legendary: [5,10], mythic: [7,15] },
  lifesteal: { epic: [1,3], legendary: [2,5], mythic: [3,8] },
  reflect: { epic: [2,5], legendary: [3,8], mythic: [5,12] },
  hp_regen: { epic: [0.5,1], legendary: [1,2], mythic: [2,4] },
};

function getQuality(stat: string, rarity: string, value: number): { percent: number; label: string; color: string } {
  const range = OPTION_RANGES[stat]?.[rarity];
  if (!range) return { percent: 50, label: '일반', color: 'text-gray-300' };
  const [min, max] = range;
  const pct = max === min ? 100 : Math.round(((value - min) / (max - min)) * 100);
  if (pct >= 75) return { percent: pct, label: '최상급', color: 'text-yellow-400' };
  if (pct >= 50) return { percent: pct, label: '상급', color: 'text-green-400' };
  if (pct >= 25) return { percent: pct, label: '일반', color: 'text-gray-300' };
  return { percent: pct, label: '하급', color: 'text-gray-500' };
}

function formatValue(stat: string, value: number): string {
  const isPercent = stat.includes('percent') || stat === 'crit_rate' || stat === 'crit_damage' || stat === 'lifesteal' || stat === 'reflect' || stat === 'hp_regen';
  return isPercent ? value.toFixed(1) + '%' : String(Math.round(value));
}

function RandomOptionsDisplay({ options, rarity, lockedIndices, onToggleLock, showLock }: {
  options: RandomOption[];
  rarity?: string;
  lockedIndices?: Set<number>;
  onToggleLock?: (idx: number) => void;
  showLock?: boolean;
}) {
  if (!options || options.length === 0) return <p className="text-xs text-gray-600 mt-1">옵션 없음 (리롤하면 생성됩니다)</p>;
  return (
    <div className="panel p-2 space-y-1">
      <p className="text-xs font-bold text-yellow-400">랜덤 옵션</p>
      {options.map((opt, i) => {
        const label = OPTION_LABELS[opt.stat] ?? opt.stat;
        const range = rarity ? OPTION_RANGES[opt.stat]?.[rarity] : null;
        const quality = rarity ? getQuality(opt.stat, rarity, opt.value) : null;
        const isLocked = lockedIndices?.has(i) ?? false;
        return (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            {showLock && onToggleLock && (
              <button type="button" onClick={() => onToggleLock(i)} className={`text-sm ${isLocked ? 'text-yellow-400' : 'text-gray-600'}`}>
                {isLocked ? '\uD83D\uDD12' : '\uD83D\uDD13'}
              </button>
            )}
            <span className={quality?.color ?? 'text-green-300'}>
              {label} +{formatValue(opt.stat, opt.value)}
            </span>
            {range && (
              <span className="text-[9px] text-gray-600">({formatValue(opt.stat, range[0])}~{formatValue(opt.stat, range[1])})</span>
            )}
            {quality && (
              <span className={`text-[9px] ${quality.color}`}>[{quality.label}]</span>
            )}
          </div>
        );
      })}
    </div>
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
      <StatLine label="치명타율" value={(item.stats.critRate ?? 0)} color="text-yellow-400" isPercent />
      <StatLine label="치명타 피해" value={(item.stats.critDamage ?? 0)} color="text-purple-400" isPercent />
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

// ── Gem socket helpers ──

function getSocketCount(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common':
    case 'uncommon':
      return 1;
    case 'rare':
      return 2;
    case 'epic':
    case 'legendary':
      return 3;
    case 'mythic':
      return 4;
    default:
      return 1;
  }
}

function GemSocketSection({
  itemId,
  rarity,
  socketedGems,
  playerGems,
  onSocket,
  onUnsocket,
}: {
  itemId: string;
  rarity: ItemRarity;
  socketedGems: string[];
  playerGems: number;
  onSocket: (itemId: string, gemId: string) => void;
  onUnsocket: (itemId: string, socketIndex: number) => void;
}) {
  const [showGemList, setShowGemList] = useState(false);
  const maxSockets = getSocketCount(rarity);

  return (
    <div className="panel p-2 space-y-2">
      <p className="text-xs font-bold text-gray-400">
        소켓 ({socketedGems.length}/{maxSockets}) | 보유 젬: <span className="text-purple-400">{playerGems}</span>
      </p>
      <div className="flex gap-2">
        {Array.from({ length: maxSockets }).map((_, i) => {
          const gemId = socketedGems[i];
          const gem = gemId ? GEMS.find((g) => g.id === gemId) : null;
          return (
            <div
              key={i}
              className={`flex-1 rounded border-2 p-1.5 text-center text-[10px] ${
                gem
                  ? 'border-purple-500/60 bg-purple-500/10'
                  : 'border-gray-600/40 border-dashed bg-dungeon-bg/30'
              }`}
            >
              {gem ? (
                <div>
                  <p className="text-purple-300 font-bold">{gem.name}</p>
                  <p className="text-gray-500">{gem.description}</p>
                  <button
                    type="button"
                    onClick={() => onUnsocket(itemId, i)}
                    className="text-red-400 hover:text-red-300 mt-0.5"
                  >
                    제거
                  </button>
                </div>
              ) : (
                <span className="text-gray-600">빈 소켓</span>
              )}
            </div>
          );
        })}
      </div>
      {socketedGems.length < maxSockets && (
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowGemList(!showGemList)}
            className="w-full"
          >
            {showGemList ? '닫기' : '보석 장착'}
          </Button>
          {showGemList && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {GEMS.map((gem) => (
                <button
                  key={gem.id}
                  type="button"
                  disabled={playerGems < gem.cost}
                  onClick={() => { onSocket(itemId, gem.id); setShowGemList(false); }}
                  className={`w-full flex justify-between items-center p-2 rounded text-xs transition-colors ${
                    playerGems >= gem.cost
                      ? 'hover:bg-purple-500/10 text-gray-300'
                      : 'opacity-40 cursor-not-allowed text-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <span className="text-purple-300 font-bold">{gem.name}</span>
                    <span className="text-gray-500 ml-2">{gem.description}</span>
                  </div>
                  <span className="text-purple-400 font-bold">{gem.cost} 젬</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Equipped item detail modal ──

function EquippedDetailModal({
  isOpen,
  onClose,
  slot,
  onUnequip,
  gold,
  onGoldEnhance,
  socketedGems,
  playerGems,
  onSocket,
  onUnsocket,
  itemOptions,
  onReroll,
  lockedOptions,
  onToggleLock,
}: {
  isOpen: boolean;
  onClose: () => void;
  slot: EquippedSlotInfo | null;
  onUnequip: (slotName: string) => void;
  gold: number;
  onGoldEnhance: (itemId: string) => void;
  socketedGems: string[];
  playerGems: number;
  onSocket: (itemId: string, gemId: string) => void;
  onUnsocket: (itemId: string, socketIndex: number) => void;
  itemOptions: RandomOption[];
  onReroll: (itemId: string, lockedIndices?: number[]) => void;
  lockedOptions: Set<number>;
  onToggleLock: (idx: number) => void;
}) {
  const { updateSaveData } = useAuth();
  if (!slot?.data) return null;

  const RARITY_BASE_GEM: Record<string, number> = { common: 5, uncommon: 10, rare: 15, epic: 25, legendary: 30, mythic: 50 };
  const target = slot.enhanceLevel + 1;
  const enhanceCostGold = Math.min(1000, (RARITY_BASE_GEM[slot.data.rarity] ?? 10) * target);
  const enhanceRate = target <= 5 ? 50 : Math.max(5, 50 - (target - 5) * 1.5);
  const canEnhance = slot.enhanceLevel < 99;

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

        {slot.data.procEffect && (
          <div className="mt-1 p-1.5 bg-rose-900/20 border border-rose-500/30 rounded text-xs text-rose-300">
            ⚡ {slot.data.procEffect.description}
          </div>
        )}

        {/* Random options with lock + reroll */}
        {(() => {
          const baseCost = REROLL_COSTS[slot.data.rarity] ?? 10000;
          const lockCount = lockedOptions.size;
          const cost = Math.round(baseCost * (1 + lockCount * 0.5));
          return (
            <>
              <RandomOptionsDisplay
                options={itemOptions}
                rarity={slot.data.rarity}
                lockedIndices={lockedOptions}
                onToggleLock={onToggleLock}
                showLock={itemOptions.length > 0}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={gold < cost}
                onClick={() => onReroll(slot.data!.id, Array.from(lockedOptions))}
                className="w-full mt-1"
              >
                옵션 리롤 ({cost.toLocaleString()} 골드{lockCount > 0 ? ` / 잠금 ${lockCount}개` : ''})
              </Button>
            </>
          );
        })()}

        {/* Gem sockets */}
        <GemSocketSection
          itemId={slot.data.id}
          rarity={slot.data.rarity}
          socketedGems={socketedGems}
          playerGems={playerGems}
          onSocket={onSocket}
          onUnsocket={onUnsocket}
        />

        {/* Gold enhance */}
        {canEnhance && (
          <div className="panel p-2 text-center space-y-1">
            <p className="text-xs text-gray-400">젬 강화 (+{slot.enhanceLevel} &rarr; +{target})</p>
            <p className="text-sm">
              <span className="text-yellow-400 font-bold">{enhanceCostGold.toLocaleString()} 젬</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className={`font-bold ${enhanceRate >= 50 ? 'text-green-400' : enhanceRate >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                성공률 {enhanceRate.toFixed(1)}%
              </span>
            </p>
            <Button
              variant="primary"
              size="sm"
              disabled={gold < enhanceCostGold}
              onClick={() => onGoldEnhance(slot.data!.id)}
              className="w-full"
            >
              {gold < enhanceCostGold ? '젬 부족' : '젬 강화'}
            </Button>
          </div>
        )}

        {/* Enhancement stone usage */}
        {canEnhance && (() => {
          const stoneTypes = [
            { id: 'enhance_stone_mythic', name: '신화', exp: 500, color: 'text-rose-400' },
            { id: 'enhance_stone_legendary', name: '전설', exp: 100, color: 'text-yellow-400' },
            { id: 'enhance_stone_epic', name: '영웅', exp: 30, color: 'text-purple-400' },
            { id: 'enhance_stone_rare', name: '희귀', exp: 10, color: 'text-blue-400' },
            { id: 'enhance_stone_uncommon', name: '고급', exp: 3, color: 'text-green-400' },
            { id: 'enhance_stone_common', name: '일반', exp: 1, color: 'text-gray-400' },
          ];
          return (
            <div className="panel p-2 space-y-1">
              <p className="text-xs text-gray-400">강화석 사용</p>
              <div className="flex gap-1 flex-wrap">
                {stoneTypes.map((st) => (
                  <button key={st.id} type="button"
                    onClick={async () => {
                      try {
                        const res = await axios.post('/api/inventory/use-enhance-stone', { stoneId: st.id, targetItemId: slot.data!.id, quantity: 999 });
                        if (res.data.success) {
                          updateSaveData(res.data.saveData);
                          const d = res.data;
                          const lvlUp = d.afterLevel > d.beforeLevel ? ` → +${d.afterLevel} (레벨업!)` : '';
                          toast.success(`강화석 사용! +${d.beforeLevel}${lvlUp} (경험치 ${d.currentExp}/${d.nextCost ?? 'MAX'})`);
                        }
                      } catch (err: any) { toast.error(err.response?.data?.message || '사용 실패'); }
                    }}
                    className={`text-[10px] px-2 py-1 rounded bg-dungeon-bg border border-dungeon-border hover:border-dungeon-accent ${st.color} transition-colors`}
                  >{st.name} (전부)</button>
                ))}
              </div>
            </div>
          );
        })()}

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
  onSell,
  onGoldEnhance,
  goldEnhanceInfo,
  gold,
  socketedGems,
  playerGems,
  onSocket,
  onUnsocket,
  itemOptions,
  onReroll,
  onDismantle,
  lockedOptions,
  onToggleLock,
}: {
  item: Item | null;
  enhanceLevel: number;
  currentEquipped: EquippedSlotInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (itemId: string) => void;
  onEquip: (itemId: string, slot: string) => void;
  onSell: (itemId: string) => void;
  onGoldEnhance: (itemId: string) => void;
  goldEnhanceInfo: { cost: number; rate: number } | null;
  gold: number;
  socketedGems: string[];
  playerGems: number;
  onSocket: (itemId: string, gemId: string) => void;
  onUnsocket: (itemId: string, socketIndex: number) => void;
  itemOptions: RandomOption[];
  onReroll: (itemId: string, lockedIndices?: number[]) => void;
  onDismantle: (itemId: string) => void;
  lockedOptions: Set<number>;
  onToggleLock: (idx: number) => void;
}) {
  const { updateSaveData } = useAuth();
  if (!item) return null;

  const isEquipType = ['weapon', 'shield', 'offhand', 'helm', 'shoulders', 'chest', 'gloves', 'belt', 'legs', 'boots', 'accessory'].includes(item.type);
  const equipSlot = item.type === 'shield' ? 'offhand' : item.type;
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
                <CompareStatLine label="치명타율" newVal={(item.stats.critRate ?? 0)} oldVal={(equippedStats?.critRate ?? 0)} color="text-yellow-400" isPercent />
                <CompareStatLine label="치명타 피해" newVal={(item.stats.critDamage ?? 0)} oldVal={(equippedStats?.critDamage ?? 0)} color="text-purple-400" isPercent />
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

        {item.procEffect && (
          <div className="mt-1 p-1.5 bg-rose-900/20 border border-rose-500/30 rounded text-xs text-rose-300">
            ⚡ {item.procEffect.description}
          </div>
        )}

        {enhanceLevel > 0 && (
          <p className="text-xs text-gray-500">
            강화 배율: x{1 + enhanceLevel} (기본 스탯의 {(1 + enhanceLevel) * 100}%)
          </p>
        )}

        {/* Gem sockets */}
        {isEquipType && (
          <GemSocketSection
            itemId={item.id}
            rarity={item.rarity}
            socketedGems={socketedGems}
            playerGems={playerGems}
            onSocket={onSocket}
            onUnsocket={onUnsocket}
          />
        )}

        {/* Random options + Reroll with locks */}
        {isEquipType && (() => {
          const opts = itemOptions ?? [];
          const baseCost = REROLL_COSTS[item.rarity] ?? 10000;
          const lockCount = lockedOptions.size;
          const rerollCost = Math.round(baseCost * (1 + lockCount * 0.5));
          return (
            <>
              <RandomOptionsDisplay
                options={opts}
                rarity={item.rarity}
                lockedIndices={lockedOptions}
                onToggleLock={onToggleLock}
                showLock={opts.length > 0}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={gold < rerollCost}
                onClick={() => onReroll(item.id, Array.from(lockedOptions))}
                className="w-full mt-1"
              >
                옵션 리롤 ({rerollCost.toLocaleString()} 골드{lockCount > 0 ? ` / 잠금 ${lockCount}개` : ''})
              </Button>
            </>
          );
        })()}

        {/* Gold enhance */}
        {isEquipType && goldEnhanceInfo && (
          <div className="panel p-2 text-center space-y-1">
            <p className="text-xs text-gray-400">젬 강화 (+{enhanceLevel} → +{enhanceLevel + 1})</p>
            <p className="text-sm">
              <span className="text-yellow-400 font-bold">{goldEnhanceInfo.cost.toLocaleString()} 젬</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className={`font-bold ${goldEnhanceInfo.rate >= 50 ? 'text-green-400' : goldEnhanceInfo.rate >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                성공률 {goldEnhanceInfo.rate.toFixed(1)}%
              </span>
            </p>
            <Button
              variant="primary"
              size="sm"
              disabled={gold < goldEnhanceInfo.cost}
              onClick={() => onGoldEnhance(item.id)}
              className="w-full"
            >
              {gold < goldEnhanceInfo.cost ? '젬 부족' : '젬 강화'}
            </Button>
          </div>
        )}

        {/* Enhancement stone usage for inventory items */}
        {isEquipType && enhanceLevel < 99 && (() => {
          const stoneTypes = [
            { id: 'enhance_stone_mythic', name: '신화', exp: 500, color: 'text-rose-400' },
            { id: 'enhance_stone_legendary', name: '전설', exp: 100, color: 'text-yellow-400' },
            { id: 'enhance_stone_epic', name: '영웅', exp: 30, color: 'text-purple-400' },
            { id: 'enhance_stone_rare', name: '희귀', exp: 10, color: 'text-blue-400' },
            { id: 'enhance_stone_uncommon', name: '고급', exp: 3, color: 'text-green-400' },
            { id: 'enhance_stone_common', name: '일반', exp: 1, color: 'text-gray-400' },
          ];
          return (
            <div className="panel p-2 space-y-1">
              <p className="text-xs text-gray-400">강화석 사용</p>
              <div className="flex gap-1 flex-wrap">
                {stoneTypes.map((st) => (
                  <button key={st.id} type="button"
                    onClick={async () => {
                      try {
                        const res = await axios.post('/api/inventory/use-enhance-stone', { stoneId: st.id, targetItemId: item.id, quantity: 999 });
                        if (res.data.success) {
                          updateSaveData(res.data.saveData);
                          const d = res.data;
                          const lvlUp = d.afterLevel > d.beforeLevel ? ` → +${d.afterLevel} (레벨업!)` : '';
                          toast.success(`강화석 사용! +${d.beforeLevel}${lvlUp} (경험치 ${d.currentExp}/${d.nextCost ?? 'MAX'})`);
                        }
                      } catch (err: any) { toast.error(err.response?.data?.message || '사용 실패'); }
                    }}
                    className={`text-[10px] px-2 py-1 rounded bg-dungeon-bg border border-dungeon-border hover:border-dungeon-accent ${st.color} transition-colors`}
                  >{st.name} (전부)</button>
                ))}
              </div>
            </div>
          );
        })()}

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
          {isEquipType && (
            <Button variant="danger" size="sm" onClick={async () => {
              if (await confirm(`${item.name}을(를) 분해하시겠습니까? 강화석을 획득합니다.`)) {
                onDismantle(item.id); onClose();
              }
            }} className="flex-1">
              분해
            </Button>
          )}
          {item.sellPrice > 0 && item.type !== 'material' && (
            <Button variant="danger" size="sm" onClick={async () => {
              if (await confirm(`${item.name}을(를) ${item.sellPrice}G에 판매하시겠습니까?`)) {
                onSell(item.id); onClose();
              }
            }} className="flex-1">
              판매 ({item.sellPrice}G)
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
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const {
    equipmentItems, nonEquipmentItems, equippedSlots,
    getEnhanceLevel, getEnhanceExp, totalGold, totalGems,
    useItem, equipItem, unequipItem, sellItem, SLOT_LABELS,
  } = useInventory();

  const [tab, setTab] = useState<'equip' | 'bag'>('equip');
  const [equipFilter, setEquipFilter] = useState<string>('all');
  const [equipSort, setEquipSort] = useState<'name' | 'power'>('power');
  const [selectedItem, setSelectedItem] = useState<ResolvedItem | null>(null);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState<EquippedSlotInfo | null>(null);
  const [equipSelectSlot, setEquipSelectSlot] = useState<string | null>(null);
  const [lockedOptionsMap, setLockedOptionsMap] = useState<Record<string, Set<number>>>({});

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Calculate item total power (all stats summed with enhance multiplier)
  const getItemPower = useCallback((item: ResolvedItem) => {
    const s = item.data.stats;
    if (!s) return 0;
    const mult = 1 + getEnhanceLevel(item.data.id);
    return ((s.attack ?? 0) + (s.defense ?? 0) + (s.hp ?? 0) + (s.mp ?? 0) +
      (s.speed ?? 0)) * mult + (s.critRate ?? 0) * 500 + (s.critDamage ?? 0) * 200;
  }, [getEnhanceLevel]);

  // Filtered + sorted equipment list
  const filteredEquipment = useMemo(() => {
    let list = equipmentItems;

    // Filter by type
    if (equipFilter !== 'all') {
      if (equipFilter === 'offhand') {
        list = list.filter((i) => i.data.type === 'shield' || i.data.type === 'offhand');
      } else {
        list = list.filter((i) => i.data.type === equipFilter);
      }
    }

    // Sort
    if (equipSort === 'power') {
      list = [...list].sort((a, b) => getItemPower(b) - getItemPower(a));
    } else {
      list = [...list].sort((a, b) => a.data.name.localeCompare(b.data.name));
    }

    return list;
  }, [equipmentItems, equipFilter, equipSort, getItemPower]);

  const FILTER_OPTIONS = [
    { key: 'all', label: '전체' },
    { key: 'weapon', label: '무기' },
    { key: 'offhand', label: '보조' },
    { key: 'helm', label: '투구' },
    { key: 'shoulders', label: '견갑' },
    { key: 'chest', label: '흉갑' },
    { key: 'gloves', label: '장갑' },
    { key: 'belt', label: '허리' },
    { key: 'legs', label: '다리' },
    { key: 'boots', label: '장화' },
    { key: 'accessory', label: '장신구' },
  ];

  // Candidates for equip selection (items in inventory matching the slot type)
  const equipCandidates = useMemo(() => {
    if (!equipSelectSlot || !saveData) return [];
    if (equipSelectSlot === 'offhand') {
      return equipmentItems.filter((i) => i.data.type === 'shield' || i.data.type === 'offhand');
    }
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

  const handleSocketGem = useCallback(async (itemId: string, gemId: string) => {
    try {
      const res = await axios.post('/api/inventory/socket-gem', { itemId, gemId });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        // Force refresh modals
        setSelectedItem((prev) => prev ? { ...prev } : null);
        setSelectedEquipSlot((prev) => prev ? { ...prev } : null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '보석 장착 실패');
    }
  }, [updateSaveData]);

  const handleUnsocketGem = useCallback(async (itemId: string, socketIndex: number) => {
    try {
      const res = await axios.post('/api/inventory/unsocket-gem', { itemId, socketIndex });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        setSelectedItem((prev) => prev ? { ...prev } : null);
        setSelectedEquipSlot((prev) => prev ? { ...prev } : null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '보석 제거 실패');
    }
  }, [updateSaveData]);

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

  const handleReroll = useCallback(async (itemId: string, lockedIndices?: number[]) => {
    try {
      const lockCount = lockedIndices?.length ?? 0;
      const ok = await confirm(`랜덤 옵션을 리롤하시겠습니까?${lockCount > 0 ? ` (잠금 ${lockCount}개 유지)` : ' 기존 옵션이 변경됩니다.'}`);
      if (!ok) return;
      const res = await axios.post('/api/inventory/reroll', { itemId, lockedIndices });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        toast.success(`리롤 완료! (${res.data.goldSpent.toLocaleString()} 골드 소모)`);
        // 잠금 유지 (서버에서 잠긴 옵션 위치 보존됨)
        setSelectedItem((prev) => prev ? { ...prev } : null);
        setSelectedEquipSlot((prev) => prev ? { ...prev } : null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '리롤 실패');
    }
  }, [updateSaveData]);

  const handleDismantle = useCallback(async (itemId: string) => {
    try {
      const res = await axios.post('/api/inventory/dismantle', { itemId });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        toast.success('분해 완료! 강화석을 획득했습니다.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '분해 실패');
    }
  }, [updateSaveData]);

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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
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

          {/* Total stats + Set bonuses */}
          {(() => {
            const equippedIds = equippedSlots.map((s) => s.itemId).filter(Boolean) as string[];
            const character = CHARACTERS.find((c) => c.id === saveData?.characterId);
            if (!character || !saveData) return null;

            // Base + equip stats
            const levelBonus = saveData.level - 1;
            let totalAtk = character.baseStats.attack + levelBonus * 3;
            let totalDef = character.baseStats.defense + levelBonus * 2;
            let totalHp = character.baseStats.maxHp + levelBonus * 15;
            let totalMp = character.baseStats.maxMp + levelBonus * 5;
            let totalSpd = character.baseStats.speed + levelBonus * 1;
            let totalCrit = character.baseStats.critRate;
            let totalCritDmg = character.baseStats.critDamage;

            for (const id of equippedIds) {
              const item = ITEMS.find((i) => i.id === id);
              if (!item?.stats) continue;
              const mult = 1 + (saveData.enhanceLevels?.[id]?.level ?? 0);
              totalAtk += (item.stats.attack ?? 0) * mult;
              totalDef += (item.stats.defense ?? 0) * mult;
              totalHp += (item.stats.hp ?? 0) * mult;
              totalMp += (item.stats.mp ?? 0) * mult;
              totalSpd += (item.stats.speed ?? 0) * mult;
              totalCrit += (item.stats.critRate ?? 0);
              totalCritDmg += (item.stats.critDamage ?? 0);
            }

            // Add random option flat stats to totals
            let randOptAtkPercent = 0, randOptHpPercent = 0;
            let randOptGoldPct = 0, randOptExpPct = 0;
            let randLifesteal = 0, randReflect = 0, randHpRegen = 0;
            for (const id of equippedIds) {
              const opts = saveData.itemOptions?.[id] ?? [];
              for (const opt of opts) {
                switch (opt.stat) {
                  case 'atk_flat': totalAtk += opt.value; break;
                  case 'atk_percent': randOptAtkPercent += opt.value; break;
                  case 'def_flat': totalDef += opt.value; break;
                  case 'hp_flat': totalHp += opt.value; break;
                  case 'hp_percent': randOptHpPercent += opt.value; break;
                  case 'speed': totalSpd += opt.value; break;
                  case 'crit_rate': totalCrit += opt.value / 100; break;
                  case 'crit_damage': totalCritDmg += opt.value / 100; break;
                  case 'gold_percent': randOptGoldPct += opt.value; break;
                  case 'exp_percent': randOptExpPct += opt.value; break;
                  case 'lifesteal': randLifesteal += opt.value; break;
                  case 'reflect': randReflect += opt.value; break;
                  case 'hp_regen': randHpRegen += opt.value; break;
                }
              }
            }

            // Add socketed gem stats to totals
            for (const id of equippedIds) {
              const sockets = saveData.socketedGems?.[id] ?? [];
              for (const gemId of sockets) {
                const gem = GEMS.find((g) => g.id === gemId);
                if (!gem) continue;
                if (gem.stat === 'attack') totalAtk += gem.value;
                else if (gem.stat === 'defense') totalDef += gem.value;
                else if (gem.stat === 'hp') totalHp += gem.value;
                else if (gem.stat === 'mp') totalMp += gem.value;
                else if (gem.stat === 'speed') totalSpd += gem.value;
                else if (gem.stat === 'critRate') totalCrit += gem.value;
                else if (gem.stat === 'critDamage') totalCritDmg += gem.value;
              }
            }

            // Set bonuses
            const activeSets: { name: string; count: number; total: number; bonuses: { desc: string; active: boolean }[] }[] = [];
            for (const set of SETS) {
              const count = set.pieces.filter((p) => equippedIds.includes(p)).length;
              if (count === 0) continue;
              const bonuses = set.bonuses.map((b) => ({
                desc: `(${b.requiredCount}세트) ${b.description}`,
                active: count >= b.requiredCount,
              }));
              activeSets.push({ name: set.name, count, total: set.pieces.length, bonuses });

              // Apply % to totals
              for (const b of set.bonuses) {
                if (count >= b.requiredCount && b.stats) {
                  totalAtk = Math.round(totalAtk * (1 + (b.stats.atkPercent ?? 0) / 100));
                  totalDef = Math.round(totalDef * (1 + (b.stats.defPercent ?? 0) / 100));
                  totalHp = Math.round(totalHp * (1 + (b.stats.hpPercent ?? 0) / 100));
                  totalMp = Math.round(totalMp * (1 + (b.stats.mpPercent ?? 0) / 100));
                  totalCrit += b.stats.critRateFlat ?? 0;
                  totalCritDmg *= (1 + (b.stats.critDmgPercent ?? 0) / 100);
                }
              }
            }

            // Prestige bonus
            const prestigeBonus = 1 + (saveData.prestigeLevel ?? 0) * 0.02;
            totalHp = Math.round(totalHp * prestigeBonus);
            totalMp = Math.round(totalMp * prestigeBonus);
            totalAtk = Math.round(totalAtk * prestigeBonus);
            totalDef = Math.round(totalDef * prestigeBonus);

            // Talent bonuses
            const tp = saveData.talentPoints ?? {};
            const talentAtkP = (tp['off_atk'] ?? 0) * 3;
            const talentDefP = (tp['def_def'] ?? 0) * 3;
            const talentHpP = (tp['def_hp'] ?? 0) * 5;
            const talentMpP = (tp['util_mp'] ?? 0) * 5;
            totalAtk = Math.round(totalAtk * (1 + talentAtkP / 100));
            totalDef = Math.round(totalDef * (1 + talentDefP / 100));
            totalHp = Math.round(totalHp * (1 + talentHpP / 100));
            totalMp = Math.round(totalMp * (1 + talentMpP / 100));
            totalCrit += (tp['off_crit'] ?? 0) * 0.01;
            totalCritDmg *= (1 + (tp['off_critdmg'] ?? 0) * 5 / 100);

            // Title bonus
            const titleId = saveData.equippedTitle ?? '';
            if (titleId) {
              const title = TITLES.find((t) => t.id === titleId);
              if (title?.bonus) {
                if (title.bonus.stat === 'atkPercent') totalAtk = Math.round(totalAtk * (1 + title.bonus.value / 100));
                if (title.bonus.stat === 'defPercent') totalDef = Math.round(totalDef * (1 + title.bonus.value / 100));
                if (title.bonus.stat === 'hpPercent') totalHp = Math.round(totalHp * (1 + title.bonus.value / 100));
              }
            }

            // Pet bonus
            if (saveData.activePet) {
              const pet = PETS.find((p) => p.id === saveData.activePet);
              if (pet) {
                for (const b of pet.bonus) {
                  if (b.stat === 'atkPercent') totalAtk = Math.round(totalAtk * (1 + b.value / 100));
                  if (b.stat === 'defPercent') totalDef = Math.round(totalDef * (1 + b.value / 100));
                  if (b.stat === 'hpPercent') totalHp = Math.round(totalHp * (1 + b.value / 100));
                  if (b.stat === 'mpPercent') totalMp = Math.round(totalMp * (1 + b.value / 100));
                  if (b.stat === 'critRateFlat') totalCrit += b.value;
                }
              }
            }

            // Artifact bonus
            const arts = saveData.artifacts ?? {};
            let bonusGold = 0, bonusExp = 0, bonusDrop = 0;
            for (const art of ARTIFACTS) {
              const lv = arts[art.id] ?? 0;
              if (lv <= 0) continue;
              const val = art.effectPerLevel * lv;
              if (art.effectType === 'hpPercent') totalHp = Math.round(totalHp * (1 + val / 100));
              if (art.effectType === 'mpPercent') totalMp = Math.round(totalMp * (1 + val / 100));
              if (art.effectType === 'atkPercent') totalAtk = Math.round(totalAtk * (1 + val / 100));
              if (art.effectType === 'defPercent') totalDef = Math.round(totalDef * (1 + val / 100));
              if (art.effectType === 'goldPercent') bonusGold += val;
              if (art.effectType === 'expPercent') bonusExp += val;
              if (art.effectType === 'dropRatePercent') bonusDrop += val;
            }
            // talent gold bonus
            bonusGold += (tp['util_gold'] ?? 0) * 5;

            // Random option percent bonuses
            if (randOptAtkPercent > 0) totalAtk = Math.round(totalAtk * (1 + randOptAtkPercent / 100));
            if (randOptHpPercent > 0) totalHp = Math.round(totalHp * (1 + randOptHpPercent / 100));
            bonusGold += randOptGoldPct;
            bonusExp += randOptExpPct;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total stats */}
                <Card className="p-4">
                  <h2 className="text-sm font-bold text-gray-400 mb-3">종합 전투력</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">HP</span><span className="text-red-400 font-bold">{totalHp.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">MP</span><span className="text-blue-400 font-bold">{totalMp.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">공격력</span><span className="text-red-400 font-bold">{totalAtk.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">방어력</span><span className="text-blue-400 font-bold">{totalDef.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">속도</span><span className="text-green-400 font-bold">{totalSpd}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">치명타율</span><span className="text-yellow-400 font-bold">{Math.round(totalCrit * 100)}%</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-gray-500">치명타 피해</span><span className="text-purple-400 font-bold">x{totalCritDmg.toFixed(2)}</span></div>
                  </div>
                  {(bonusGold > 0 || bonusExp > 0 || bonusDrop > 0 || randLifesteal > 0 || randReflect > 0 || randHpRegen > 0) && (
                    <div className="mt-2 pt-2 border-t border-dungeon-border grid grid-cols-3 gap-1 text-[10px]">
                      {bonusExp > 0 && <div className="text-center"><span className="text-gray-500">경험치</span><br/><span className="text-green-400">+{bonusExp}%</span></div>}
                      {bonusGold > 0 && <div className="text-center"><span className="text-gray-500">골드</span><br/><span className="text-yellow-400">+{bonusGold}%</span></div>}
                      {bonusDrop > 0 && <div className="text-center"><span className="text-gray-500">드랍률</span><br/><span className="text-purple-400">+{bonusDrop}%</span></div>}
                      {randLifesteal > 0 && <div className="text-center"><span className="text-gray-500">흡혈</span><br/><span className="text-red-400">+{randLifesteal.toFixed(1)}%</span></div>}
                      {randReflect > 0 && <div className="text-center"><span className="text-gray-500">반사</span><br/><span className="text-blue-400">+{randReflect.toFixed(1)}%</span></div>}
                      {randHpRegen > 0 && <div className="text-center"><span className="text-gray-500">턴HP회복</span><br/><span className="text-pink-400">+{randHpRegen.toFixed(1)}%</span></div>}
                    </div>
                  )}
                </Card>

                {/* Set bonuses */}
                <Card className="p-4">
                  <h2 className="text-sm font-bold text-gray-400 mb-3">세트 효과</h2>
                  {activeSets.length === 0 ? (
                    <p className="text-xs text-gray-600">활성화된 세트가 없습니다</p>
                  ) : (
                    <div className="space-y-3">
                      {activeSets.map((set) => (
                        <div key={set.name}>
                          <p className="text-sm font-bold text-yellow-400">
                            {set.name} <span className="text-xs text-gray-500">({set.count}/{set.total})</span>
                          </p>
                          {set.bonuses.map((b, i) => (
                            <p key={i} className={`text-[11px] ml-2 ${b.active ? 'text-green-400' : 'text-gray-600'}`}>
                              {b.active ? '\u2713 ' : '\u2717 '}{b.desc}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            );
          })()}

          {/* Equipment inventory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-400">
                보유 장비 ({filteredEquipment.length}{equipFilter !== 'all' ? `/${equipmentItems.length}` : ''})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEquipSort(equipSort === 'power' ? 'name' : 'power')}
                  className="text-[10px] px-2 py-1 rounded bg-dungeon-panel border border-dungeon-border text-gray-400 hover:text-gray-200"
                >
                  {equipSort === 'power' ? '성능순' : '이름순'}
                </button>
              </div>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1 mb-3 flex-wrap">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setEquipFilter(opt.key)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${
                    equipFilter === opt.key
                      ? 'bg-dungeon-accent/20 text-dungeon-accent border border-dungeon-accent/40'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {filteredEquipment.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                {equipmentItems.length === 0 ? '보유한 장비가 없습니다' : '해당 부위 장비가 없습니다'}
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {filteredEquipment.map((item) => (
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
        onSell={(itemId) => { sellItem(itemId, 1); }}
        gold={totalGems}
        goldEnhanceInfo={(() => {
          if (!selectedItem) return null;
          const rarity = selectedItem.data.rarity;
          const level = getEnhanceLevel(selectedItem.data.id);
          if (level >= 99) return null;
          const RARITY_BASE_GEM: Record<string, number> = { common: 5, uncommon: 10, rare: 15, epic: 25, legendary: 30, mythic: 50 };
          const target = level + 1;
          const cost = Math.min(1000, (RARITY_BASE_GEM[rarity] ?? 10) * target);
          const rate = target <= 5 ? 50 : Math.max(5, 50 - (target - 5) * 1.5);
          return { cost, rate };
        })()}
        socketedGems={selectedItem ? (saveData?.socketedGems?.[selectedItem.data.id] ?? []) : []}
        playerGems={totalGems}
        onSocket={handleSocketGem}
        onUnsocket={handleUnsocketGem}
        itemOptions={selectedItem ? (saveData?.itemOptions?.[selectedItem.data.id] ?? []) : []}
        onReroll={handleReroll}
        onDismantle={handleDismantle}
        lockedOptions={selectedItem ? (lockedOptionsMap[selectedItem.data.id] ?? new Set()) : new Set()}
        onToggleLock={(idx) => {
          if (!selectedItem) return;
          const id = selectedItem.data.id;
          setLockedOptionsMap((prev) => {
            const cur = prev[id] ?? new Set();
            const next = new Set(cur);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return { ...prev, [id]: next };
          });
        }}
        onGoldEnhance={async (itemId) => {
          try {
            const res = await axios.post('/api/inventory/enhance-gold', { itemId });
            if (res.data.success) {
              updateSaveData(res.data.saveData);
              if (res.data.enhanced) {
                toast.success(`강화 성공! (${res.data.goldSpent.toLocaleString()} 젬 소모)`);
              } else {
                toast.error(`강화 실패... (${res.data.goldSpent.toLocaleString()} 젬 소모)`);
              }
              // Re-select to refresh info
              const updated = res.data.saveData;
              if (updated) {
                setSelectedItem((prev) => prev ? { ...prev } : null);
              }
            }
          } catch (err: any) {
            toast.error(err.response?.data?.message || '강화 실패');
          }
        }}
      />

      <EquippedDetailModal
        isOpen={selectedEquipSlot !== null}
        onClose={handleCloseEquipped}
        slot={selectedEquipSlot}
        onUnequip={handleUnequip}
        gold={totalGems}
        socketedGems={selectedEquipSlot?.data ? (saveData?.socketedGems?.[selectedEquipSlot.data.id] ?? []) : []}
        playerGems={totalGems}
        onSocket={handleSocketGem}
        onUnsocket={handleUnsocketGem}
        itemOptions={selectedEquipSlot?.data ? (saveData?.itemOptions?.[selectedEquipSlot.data.id] ?? []) : []}
        onReroll={handleReroll}
        lockedOptions={selectedEquipSlot?.data ? (lockedOptionsMap[selectedEquipSlot.data.id] ?? new Set()) : new Set()}
        onToggleLock={(idx) => {
          if (!selectedEquipSlot?.data) return;
          const id = selectedEquipSlot.data.id;
          setLockedOptionsMap((prev) => {
            const cur = prev[id] ?? new Set();
            const next = new Set(cur);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return { ...prev, [id]: next };
          });
        }}
        onGoldEnhance={async (itemId) => {
          try {
            const res = await axios.post('/api/inventory/enhance-gold', { itemId });
            if (res.data.success) {
              updateSaveData(res.data.saveData);
              if (res.data.enhanced) {
                toast.success(`강화 성공! (${res.data.goldSpent.toLocaleString()} 젬 소모)`);
              } else {
                toast.error(`강화 실패... (${res.data.goldSpent.toLocaleString()} 젬 소모)`);
              }
              // Re-select to refresh info
              if (res.data.saveData) {
                setSelectedEquipSlot((prev) => {
                  if (!prev) return null;
                  const newLevel = res.data.saveData.enhanceLevels?.[prev.itemId ?? '']?.level ?? prev.enhanceLevel;
                  return { ...prev, enhanceLevel: newLevel };
                });
              }
            }
          } catch (err: any) {
            toast.error(err.response?.data?.message || '강화 실패');
          }
        }}
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
