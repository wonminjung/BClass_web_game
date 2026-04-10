# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

턴제 던전 RPG 웹 게임 ("어둠의 던전"). 다크 판타지 세계관의 싱글 플레이어 턴제 전투 게임.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand (상태 관리), Axios
- **Backend**: Node.js, Express, TypeScript (tsx로 실행)
- **Shared**: 클라이언트/서버 공유 타입 및 게임 데이터 (`shared/`)

## Commands

```bash
# 전체 의존성 설치
npm run install:all

# 클라이언트 + 서버 동시 실행
npm run dev

# 개별 실행
npm run dev:client    # Vite dev server (port 3000)
npm run dev:server    # Express server (port 4000)

# 빌드
npm run build         # client production build
cd server && npm run build  # server tsc compile
```

## Architecture

```
web_game/
├── shared/           # 클라이언트/서버 공유 코드
│   ├── types/        # TypeScript 인터페이스 (Character, Skill, Monster, Item, Combat, Auth)
│   └── data/         # 게임 데이터 (캐릭터 5종, 스킬 25개, 몬스터 5종, 던전 4개, 아이템 16개)
├── client/           # React SPA
│   └── src/
│       ├── stores/   # Zustand 스토어 (authStore, gameStore, combatStore)
│       ├── hooks/    # 커스텀 훅 (useAuth, useCombat, useInventory)
│       └── components/
│           ├── common/    # Button, Modal, StatBar, Card
│           ├── auth/      # AuthScreen, CharacterSelect
│           ├── home/      # HomeScreen, DungeonSelect
│           ├── battle/    # BattleScreen, SkillBar, BattleResult
│           ├── inventory/ # InventoryScreen
│           └── bestiary/  # BestiaryScreen
└── server/           # Express API
    └── src/
        ├── services/     # AuthService, CombatService, GameService
        ├── routes/       # /api/auth, /api/combat, /api/game
        └── middleware/   # validate (입력값 검증 + sanitize)
```

## Key Design Decisions

- **Anti-Cheat**: 모든 비즈니스 로직(데미지 계산, 전투 판정, 인벤토리 조작)은 서버에서 검증. 클라이언트는 UI 렌더링 전용.
- **세이브 코드 인증**: SQLite (`server/data/game.db`) + HMAC-SHA256 토큰. SECRET은 DB에 영속 저장.
- **Action Queue**: 전투 이벤트를 큐 방식으로 순차 처리 (공격 → 데미지 → 상태이상 → 사망 판정).
- **UI/로직 분리**: useCombat, useAuth, useInventory 훅으로 UI와 비즈니스 로직 철저히 분리.
- **Path Aliases**: 클라이언트에서 `@/` → `src/`, `@shared/` → `shared/` (vite.config.ts + tsconfig.json).

## API Endpoints

- `POST /api/auth/login` - 세이브 코드로 로그인
- `POST /api/auth/new-game` - 새 게임 생성
- `POST /api/auth/save` - 진행 상황 저장
- `POST /api/combat/start` - 전투 시작
- `POST /api/combat/action` - 스킬 사용 (플레이어 턴 → 적 턴 자동 처리)
- `GET /api/game/characters` - 캐릭터 목록
- `GET /api/game/dungeons` - 던전 목록
- `GET /api/game/skills/:characterId` - 캐릭터별 스킬
- `POST /api/inventory/use` - 소비 아이템 사용
- `POST /api/inventory/equip` - 장비 착용
- `POST /api/inventory/unequip` - 장비 해제
- `GET /api/inventory/enhance-info/:itemId` - 강화 정보
- `POST /api/combat/abyss/start` - 무한던전 시작
- `POST /api/combat/abyss/action` - 무한던전 전투 액션

## Damage Formula

`(attack * skillMultiplier - defense * 0.5) * (isCrit ? critDamage : 1)`, 최소 1

## References

- [프로젝트 종합 분석](docs/project-analysis.md) - 완성도, 게임 데이터, 문제점/개선사항 (2026-04-10)
