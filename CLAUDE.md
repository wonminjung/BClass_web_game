# CLAUDE.md

턴제 던전 RPG 웹 게임 ("어둠의 던전"). 다크 판타지 싱글 플레이어.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios
- **Backend**: Node.js, Express, TypeScript (tsx), SQLite (better-sqlite3)
- **DB**: `server/data/game.db` (WAL 모드)

## Commands

```bash
npm run install:all   # 의존성 설치
npm run dev           # 클라이언트(3333) + 서버(4444) 동시 실행
npm run dev:client    # Vite dev server
npm run dev:server    # Express server
```

## Key Rules

- 모든 비즈니스 로직은 서버 검증. 클라이언트는 UI 전용.
- 장비 ID는 클래스 접두어 필수 (dk_, sm_, hn_, pr_, as_)
- 스탯 계산은 `shared/utils/calcStats.ts`의 `calculateTotalStats()` 공통 함수 사용 (메인/인벤/전투 통일)
- 보너스 적용 순서: 기본+레벨 → 장비+강화 → 보석 → 랜옵flat → 세트 → 환생 → 패시브트리 → 칭호 → 펫(레벨배율) → 유물(합산1회) → 랜옵%
- critRate/critDamage는 강화 배수(mult) 미적용
- 데미지 공식: `raw² / (raw + def)` (비율 감소 방식)
- 옵션 리롤: 골드 / 강화: 젬
- 맥스 레벨: 300 + 환생횟수
- alert/confirm 금지 → `toast.success/error/info` + `confirm()` 사용
- Path Aliases: `@/` → `src/`, `@shared/` → `shared/`

## Battle Graphics

- 에셋: DungeonTileset II (CC0) + Kyrise RPG Icon Pack (CC BY 4.0)
- 스프라이트 매핑: `client/src/config/spriteMap.ts`
- 애니메이션: `client/src/components/battle/AnimatedSprite.tsx`
- 전투 이펙트: `client/src/components/battle/BattleEffect.tsx`
- 좌우 배치: 플레이어(좌) + 펫 vs 적(우, 세로)

## Passive Tree

- 201개 노드 (시작1 + 잔가지170 + 준핵심20 + 핵심10)
- 데이터: `shared/data/passiveTree.ts`
- 특수효과 전투 발동: CombatService에서 `battleKeystoneMap`으로 비례 적용
- 다중 투자: minor 3회, notable 10회, keystone 5회
- 환생 시 초기화, 프리셋 저장/로드 가능

## References

- [아키텍처 상세](docs/architecture.md)
- [API 엔드포인트](docs/api.md)
- [게임 시스템](docs/game-systems.md)
