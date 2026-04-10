import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ITEMS } from '@shared/data';
import type { ShopItem } from '@shared/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import axios from 'axios';

const rarityTextColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const rarityBorders: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

const typeLabels: Record<string, string> = {
  weapon: '무기', shield: '방패', helm: '투구', shoulders: '견갑',
  chest: '흉갑', gloves: '장갑', belt: '허리띠', legs: '다리',
  boots: '장화', accessory: '장신구', consumable: '소비',
};

interface PotionShopItem {
  itemId: string;
  price: number;
}

function ShopScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const [potions, setPotions] = useState<PotionShopItem[]>([]);
  const [equipment, setEquipment] = useState<ShopItem[]>([]);
  const [refreshAt, setRefreshAt] = useState('');
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [potionQty, setPotionQty] = useState<Record<string, number>>({});
  const [selectedEquip, setSelectedEquip] = useState<ShopItem | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/', { replace: true }); return; }
    loadShop();
  }, [isAuthenticated, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!refreshAt) return;
    const tick = () => {
      const diff = new Date(refreshAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown('갱신 가능'); loadShop(); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [refreshAt]);

  const loadShop = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/shop');
      if (res.data.success) {
        setPotions(res.data.potions);
        setEquipment(res.data.equipment);
        setRefreshAt(res.data.refreshAt);
        setGold(res.data.gold);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const handleBuyPotion = useCallback(async (itemId: string) => {
    const qty = potionQty[itemId] || 1;
    try {
      const res = await axios.post('/api/shop/buy-potion', { itemId, quantity: qty });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        setGold(res.data.saveData.gold);
        showMessage(`구매 완료! (x${qty})`, 'success');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || '구매 실패', 'error');
    }
  }, [potionQty, updateSaveData, showMessage]);

  const handleBuyEquipment = useCallback(async (itemId: string) => {
    try {
      const res = await axios.post('/api/shop/buy-equipment', { itemId });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        setGold(res.data.saveData.gold);
        setEquipment((prev) => prev.map((e) => e.itemId === itemId ? { ...e, sold: true } : e));
        setSelectedEquip(null);
        showMessage(res.data.enhanced ? '구매 완료! (자동 강화 적용)' : '구매 완료! (새 장비 획득)', 'success');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || '구매 실패', 'error');
    }
  }, [updateSaveData, showMessage]);

  const handleBack = useCallback(() => navigate('/home'), [navigate]);

  if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-400">상점</h1>
          <p className="text-sm text-yellow-400 mt-1">G {gold.toLocaleString()}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>돌아가기</Button>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`text-center text-sm py-2 px-4 rounded mb-4 ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Potions section */}
      <Card className="mb-6 p-4">
        <h2 className="text-lg font-bold text-gray-300 mb-3">소비 아이템</h2>
        <div className="space-y-3">
          {potions.map((p) => {
            const item = ITEMS.find((i) => i.id === p.itemId);
            if (!item) return null;
            const qty = potionQty[p.itemId] || 1;
            return (
              <div key={p.itemId} className="flex items-center gap-3 panel p-3">
                <div className="w-10 h-10 bg-dungeon-bg rounded flex items-center justify-center flex-shrink-0">
                  <img src={item.iconUrl} alt={item.name} className="w-8 h-8 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-200">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-dungeon-border rounded">
                    <button type="button" onClick={() => setPotionQty((prev) => ({ ...prev, [p.itemId]: Math.max(1, qty - 1) }))}
                      className="px-2 py-1 text-gray-400 hover:text-white">-</button>
                    <span className="px-2 text-sm text-gray-200 min-w-[24px] text-center">{qty}</span>
                    <button type="button" onClick={() => setPotionQty((prev) => ({ ...prev, [p.itemId]: Math.min(99, qty + 1) }))}
                      className="px-2 py-1 text-gray-400 hover:text-white">+</button>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => handleBuyPotion(p.itemId)}
                    disabled={gold < p.price * qty}>
                    {(p.price * qty).toLocaleString()}G
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Equipment section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-300">장비 상점</h2>
          <span className="text-xs text-gray-500">갱신까지: {countdown}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {equipment.map((shopItem, idx) => {
            const item = ITEMS.find((i) => i.id === shopItem.itemId);
            if (!item) return null;
            return (
              <button
                key={`${shopItem.itemId}-${idx}`}
                type="button"
                disabled={shopItem.sold}
                onClick={() => setSelectedEquip(shopItem)}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  shopItem.sold
                    ? 'border-gray-700 opacity-40'
                    : `${rarityBorders[item.rarity]} hover:bg-dungeon-panel/50`
                }`}
              >
                <div className="w-12 h-12 mx-auto bg-dungeon-bg rounded-lg mb-2 flex items-center justify-center">
                  <img src={item.iconUrl} alt={item.name} className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <p className={`text-xs font-bold text-center truncate ${rarityTextColors[item.rarity]}`}>
                  {item.name}
                </p>
                <p className="text-[10px] text-gray-500 text-center">{typeLabels[item.type]}</p>
                <p className="text-xs text-yellow-400 text-center mt-1">
                  {shopItem.sold ? '판매됨' : `${shopItem.price.toLocaleString()}G`}
                </p>
                <span className={`absolute top-1 right-1 text-[9px] px-1 rounded ${rarityTextColors[item.rarity]} bg-dungeon-bg`}>
                  {rarityLabels[item.rarity]}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Equipment detail modal */}
      {selectedEquip && (() => {
        const item = ITEMS.find((i) => i.id === selectedEquip.itemId);
        if (!item) return null;
        const enhLevel = saveData?.enhanceLevels?.[item.id]?.level ?? 0;
        const ownsItem = saveData?.inventory.some((s) => s.itemId === item.id) ||
          Object.values(saveData?.equippedItems ?? {}).some((id) => id === item.id);
        return (
          <Modal isOpen onClose={() => setSelectedEquip(null)} title={item.name}>
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
                  {item.stats.attack ? <div className="flex justify-between panel py-1 px-2"><span className="text-gray-500">공격력</span><span className="text-red-400">+{item.stats.attack}</span></div> : null}
                  {item.stats.defense ? <div className="flex justify-between panel py-1 px-2"><span className="text-gray-500">방어력</span><span className="text-blue-400">+{item.stats.defense}</span></div> : null}
                  {item.stats.hp ? <div className="flex justify-between panel py-1 px-2"><span className="text-gray-500">HP</span><span className="text-red-400">+{item.stats.hp}</span></div> : null}
                  {item.stats.critRate ? <div className="flex justify-between panel py-1 px-2"><span className="text-gray-500">치명타율</span><span className="text-yellow-400">+{Math.round(item.stats.critRate * 100)}%</span></div> : null}
                  {item.stats.critDamage ? <div className="flex justify-between panel py-1 px-2"><span className="text-gray-500">치명타 피해</span><span className="text-purple-400">+{Math.round(item.stats.critDamage * 100)}%</span></div> : null}
                </div>
              )}

              {ownsItem && (
                <p className="text-xs text-blue-400">
                  이미 보유 중 (강화 +{enhLevel}) — 구매 시 자동 강화 경험치로 전환됩니다
                </p>
              )}

              <p className="text-lg font-bold text-yellow-400 text-center">
                {selectedEquip.price.toLocaleString()} G
              </p>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleBuyEquipment(selectedEquip.itemId)}
                  disabled={gold < selectedEquip.price}
                  className="flex-1"
                >
                  {gold < selectedEquip.price ? 'Gold 부족' : '구매하기'}
                </Button>
                <Button variant="secondary" size="md" onClick={() => setSelectedEquip(null)} className="flex-1">
                  닫기
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

export default ShopScreen;
