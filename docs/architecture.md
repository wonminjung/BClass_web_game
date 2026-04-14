# 아키텍처

```
web_game/
├── shared/
│   ├── types/           # TypeScript 인터페이스
│   │   ├── auth.ts          # SaveData, ShopItem, DropRecord
│   │   ├── character.ts     # Character, CharacterClass, EquipSlot (10부위)
│   │   ├── combat.ts        # BattleState, BattleFighter, BattleStats
│   │   ├── item.ts          # Item, ItemType, Gem, InventorySlot
│   │   ├── monster.ts       # Monster, Dungeon, Drop
│   │   └── skill.ts         # Skill, SkillState, StatusEffect
│   └── data/                # 게임 데이터
│       ├── characters.ts        # 5종
│       ├── skills.ts            # 26개
│       ├── monsters.ts          # 32종
│       ├── dungeons.ts          # 13개
│       ├── items/               # 장비 (클래스별 분리)
│       ├── sets.ts, gems.ts, achievements.ts, talents.ts
│       ├── titles.ts, pets.ts, artifacts.ts, recipes.ts
│       └── index.ts             # 통합 export
├── client/src/
│   ├── stores/          # Zustand (authStore, gameStore, combatStore)
│   ├── hooks/           # useAuth, useCombat, useInventory
│   └── components/
│       ├── common/          # Button, Modal, StatBar, Card, Toast
│       ├── auth/            # AuthScreen, CharacterSelect
│       ├── home/            # HomeScreen, DungeonSelect
│       ├── battle/          # BattleScreen, SkillBar, BattleResult
│       ├── inventory/       # InventoryScreen
│       ├── shop/            # ShopScreen (포션/장비/제작)
│       ├── skills/          # SkillScreen
│       ├── talents/         # TalentScreen
│       ├── pets/            # PetScreen
│       ├── artifacts/       # ArtifactScreen
│       ├── achievement/     # AchievementScreen (업적+칭호)
│       ├── ranking/         # RankingScreen
│       └── bestiary/        # BestiaryScreen (도감+드랍히스토리)
└── server/src/
    ├── services/
    │   ├── AuthService.ts           # SQLite, HMAC 토큰
    │   ├── CombatService.ts         # 전투, 웨이브, 무한던전, 주간보스
    │   ├── GameService.ts           # 경험치, 인벤토리, 강화
    │   ├── ShopService.ts           # 상점
    │   └── AchievementService.ts    # 업적 체크
    ├── routes/
    │   ├── auth.ts, combat.ts, game.ts, inventory.ts
    │   ├── shop.ts, craft.ts, pets.ts, daily.ts, ranking.ts
    └── middleware/validate.ts
```

## 데이터 규모

| 항목 | 수량 |
|------|------|
| 캐릭터 | 5종 |
| 스킬 | 26개 |
| 몬스터 | 32종 (일반 18 + 보스 14) |
| 던전 | 13 + 무한 + 주간보스 |
| 장비 | ~260개 (클래스별 ~50) |
| 세트 7 / 보석 10 / 펫 9 / 유물 7 / 특성 9 / 칭호 7 / 업적 17 / 제작 4 |
| SVG 아이콘 | 260개 |
| API 엔드포인트 | 36개 |
