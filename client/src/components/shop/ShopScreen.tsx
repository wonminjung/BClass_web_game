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
  mythic: 'text-rose-400',
};

const rarityBorders: Record<string, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
  mythic: 'border-rose-500',
};

const rarityLabels: Record<string, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
  mythic: '신화',
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

interface RecipeStatus {
  id: string;
  name: string;
  description: string;
  resultItemId: string;
  resultQuantity: number;
  goldCost: number;
  materialsStatus: { itemId: string; itemName: string; required: number; owned: number; sufficient: boolean }[];
  canCraft: boolean;
}

function ShopScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, saveData, updateSaveData } = useAuth();
  const [shopTab, setShopTab] = useState<'potion' | 'equip' | 'craft'>('potion');
  const [potions, setPotions] = useState<PotionShopItem[]>([]);
  const [equipment, setEquipment] = useState<ShopItem[]>([]);
  const [refreshAt, setRefreshAt] = useState('');
  const [gold, setGold] = useState(0);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [potionQty, setPotionQty] = useState<Record<string, number>>({});
  const [selectedEquip, setSelectedEquip] = useState<ShopItem | null>(null);
  const [countdown, setCountdown] = useState('');
  const [recipes, setRecipes] = useState<RecipeStatus[]>([]);
  const [craftLoading, setCraftLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/', { replace: true }); return; }
    loadShop();
    loadRecipes();
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
        setGems(res.data.gems ?? saveData?.gems ?? 0);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [saveData?.gems]);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const loadRecipes = useCallback(async () => {
    try {
      const res = await axios.get('/api/craft/recipes');
      if (res.data.success) {
        setRecipes(res.data.recipes);
        setGold(res.data.gold);
        setGems(res.data.gems ?? 0);
      }
    } catch { /* */ }
  }, []);

  const handleCraft = useCallback(async (recipeId: string) => {
    try {
      setCraftLoading(true);
      const res = await axios.post('/api/craft/make', { recipeId });
      if (res.data.success) {
        updateSaveData(res.data.saveData);
        setGold(res.data.saveData.gold);
        setGems(res.data.saveData.gems ?? 0);
        showMessage(res.data.message, 'success');
        loadRecipes();
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || '제작 실패', 'error');
    } finally {
      setCraftLoading(false);
    }
  }, [updateSaveData, loadRecipes, showMessage]);

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

  const handleRefreshShop = useCallback(async () => {
    try {
      const res = await axios.post('/api/shop/refresh');
      if (res.data.success) {
        setEquipment(res.data.equipment);
        setRefreshAt(res.data.refreshAt);
        setGold(res.data.gold);
        setGems(res.data.gems ?? 0);
        if (res.data.saveData) updateSaveData(res.data.saveData);
        showMessage('장비 상점이 갱신되었습니다!', 'success');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || '갱신 실패', 'error');
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
          <div className="flex gap-4 text-sm mt-1">
            <span className="text-yellow-400">G {gold.toLocaleString()}</span>
            <span className="text-purple-400">&#9670; {gems.toLocaleString()}</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleBack}>돌아가기</Button>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`text-center text-sm py-2 px-4 rounded mb-4 ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {([
          { key: 'potion' as const, label: '포션' },
          { key: 'equip' as const, label: '장비' },
          { key: 'craft' as const, label: '제작' },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setShopTab(t.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${
              shopTab === t.key
                ? 'bg-dungeon-panel text-green-400 border-b-2 border-green-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Potions section */}
      {shopTab === 'potion' && <Card className="mb-6 p-4">
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
      </Card>}

      {/* Equipment section */}
      {shopTab === 'equip' && <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-300">장비 상점</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">갱신까지: {countdown}</span>
            <button
              type="button"
              onClick={handleRefreshShop}
              disabled={gems < 50}
              className="px-2 py-1 text-[10px] font-bold rounded bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              즉시 갱신 (50젬)
            </button>
          </div>
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
      </Card>}

      {/* Craft section */}
      {shopTab === 'craft' && (
        <div className="space-y-4">
          {recipes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">레시피를 불러오는 중...</p>
          ) : (
            recipes.map((recipe) => {
              const resultItem = recipe.resultItemId === '__gems__' ? null : ITEMS.find((i) => i.id === recipe.resultItemId);
              return (
                <Card key={recipe.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-200">{recipe.name}</h3>
                      <p className="text-[10px] text-gray-500">{recipe.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">결과</p>
                      <p className="text-sm font-bold text-green-400">
                        {recipe.resultItemId === '__gems__'
                          ? `젬 x${recipe.resultQuantity}`
                          : `${resultItem?.name ?? recipe.resultItemId} x${recipe.resultQuantity}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {recipe.materialsStatus.map((mat) => (
                      <div key={mat.itemId} className="flex justify-between text-xs panel py-1 px-2">
                        <span className="text-gray-400">{mat.itemName}</span>
                        <span className={mat.sufficient ? 'text-green-400' : 'text-red-400'}>
                          {mat.owned}/{mat.required}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs panel py-1 px-2">
                      <span className="text-gray-400">골드</span>
                      <span className={gold >= recipe.goldCost ? 'text-yellow-400' : 'text-red-400'}>
                        {recipe.goldCost.toLocaleString()}G
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!recipe.canCraft || craftLoading}
                    onClick={() => handleCraft(recipe.id)}
                    className="w-full"
                  >
                    {recipe.canCraft ? '제작' : '재료 부족'}
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      )}

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
