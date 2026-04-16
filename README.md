# 어둠의 던전 - 턴제 RPG 웹 게임

다크 판타지 세계관의 싱글 플레이어 턴제 던전 RPG.

## 주요 특징

- **5개 클래스**: 암흑 기사, 그림자 마법사, 사냥꾼, 성직자, 암살자
- **13개 던전** (Lv1~60) + **무한던전** (999층) + **주간 보스**
- **장비 시스템**: 10부위, +99 강화(젬), 보석 소켓, 랜덤 옵션(리롤/잠금), 12개 세트 보너스
- **신화 등급**: 클래스별 10개 신화 장비, 발동형(proc) 효과, 전용 세트
- **가챠**: 장비 가챠 (신화 or 강화석) + 펫 가챠, 천장 시스템
- **패시브 트리**: 201개 노드 별자리 UI, 10개 핵심 특수효과 (비례형), SVG 팬/줌
- **자동 전투**: 광역기 우선 AI, 자동 포션, 속도 조절 (x1/x2/x3)
- **환생**: 맥스레벨(300+환생횟수) 도달 시 영구 보너스 누적
- **유물**: 13종 영구 강화 (영혼의 불꽃: 무한 레벨)
- **펫**: 14종 (9일반 + 5신화), 전투 참여, 강화 시스템
- **스킬 강화**: +1/+10/+100 다중 강화, 맥스 = 플레이어 레벨
- **픽셀아트 전투 화면**: 스프라이트 애니메이션, 스킬별 이펙트, 공격/피격 모션

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Shared**: 클라이언트/서버 공유 타입, 게임 데이터, 스탯 계산 함수
- **Assets**: DungeonTileset II (CC0), Kyrise RPG Icon Pack (CC BY 4.0)

## 시작하기

```bash
npm run install:all   # 의존성 설치
npm run dev           # 개발 서버 실행
```

- 클라이언트: http://localhost:3333
- 서버 API: http://localhost:4444

## 전투 시스템

- 턴제 전투, 3웨이브 자동 진행, 상태이상, 크리티컬
- 데미지 공식: `raw² / (raw + 방어력)` (비율 감소, 방어력 항상 유의미)
- 패시브 트리 특수효과 전투 발동 (처형자, 흡혈귀, 관통, 철벽 등)
- 발동형(proc) 효과 (신화 무기/악세서리)

## 프로젝트 구조

```
shared/          # 공유 타입 + 게임 데이터 + 스탯 계산 (calcStats.ts)
client/          # React SPA
  src/config/    # 스프라이트 매핑
  public/assets/ # 게임 에셋 (스프라이트, 아이콘)
server/          # Express API + SQLite
  data/          # game.db
```

## 라이선스

- DungeonTileset II by 0x72 - CC0 (Public Domain)
- Kyrise's Free 16x16 RPG Icon Pack - CC BY 4.0 (Credit: Kyrise/Gabie Nory)
