# CLAUDE.md

턴제 던전 RPG 웹 게임 ("어둠의 던전"). 다크 판타지 싱글 플레이어.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios
- **Backend**: Node.js, Express, TypeScript (tsx), SQLite (better-sqlite3)
- **DB**: `server/data/game.db` (WAL 모드)

## Commands

```bash
npm run install:all   # 의존성 설치
npm run dev           # 클라이언트(5173) + 서버(4444) 동시 실행
npm run dev:client    # Vite dev server
npm run dev:server    # Express server
```

## Key Rules

- 모든 비즈니스 로직은 서버 검증. 클라이언트는 UI 전용.
- 장비 ID는 클래스 접두어 필수 (dk_, sm_, hn_, pr_, as_)
- 보너스 적용 순서: 기본+장비+강화 → 보석 → 세트 → 환생 → 특성 → 칭호 → 펫 → 유물
- alert/confirm 금지 → `toast.success/error/info` + `confirm()` 사용
- Path Aliases: `@/` → `src/`, `@shared/` → `shared/`

## References

- [아키텍처 상세](docs/architecture.md)
- [API 엔드포인트](docs/api.md)
- [게임 시스템](docs/game-systems.md)
- [프로젝트 분석](docs/project-analysis.md)
