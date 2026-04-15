# 어둠의 던전 - 턴제 RPG 웹 게임

다크 판타지 세계관의 싱글 플레이어 턴제 던전 RPG.

## 주요 특징

- **5개 클래스**: 암흑 기사, 그림자 마법사, 사냥꾼, 성직자, 암살자
- **13개 던전** (Lv1~60) + **무한던전** (999층) + **주간 보스**
- **장비 시스템**: 10부위, +99 강화(젬), 보석 소켓, 랜덤 옵션(리롤/잠금), 12개 세트 보너스
- **신화 등급**: 클래스별 10개 신화 장비, 발동형(proc) 효과, 전용 세트
- **가챠**: 장비 가챠 (300/2700젬) + 펫 가챠 (500/4500젬), 천장 시스템
- **자동 전투**: 광역기 우선 AI, 자동 포션, 속도 조절 (x1/x2/x3)
- **환생**: 영구 보너스 (스탯/경험치/골드/드랍률), 유물 보존
- **유물**: 13종 영구 강화 (영혼의 불꽃: 무한 레벨)
- **특성 트리**: 9개 일반 + 3개 프리미엄(젬) 특성
- **펫**: 14종 (9일반 + 5신화), 전투 참여, 강화 시스템
- **업적/칭호/랭킹**: 수집 & 경쟁 요소
- **상점/제작**: 포션, 장비 구매, 일일 보상
- **픽셀아트 전투 화면**: DungeonTileset II 스프라이트 애니메이션

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Shared**: 클라이언트/서버 공유 타입 및 게임 데이터
- **Assets**: DungeonTileset II (CC0), Kyrise RPG Icon Pack (CC BY 4.0)

## 시작하기

```bash
# 의존성 설치
npm run install:all

# 개발 서버 실행 (클라이언트 + 서버)
npm run dev
```

- 클라이언트: http://localhost:3333
- 서버 API: http://localhost:4444

## 게임 시스템

### 전투
턴제 전투. 3웨이브 자동 진행. 상태이상(독/화상/출혈/기절/버프). 크리티컬 시스템. 픽셀아트 스프라이트 애니메이션.

데미지 공식: `raw² / (raw + 방어력)` (비율 감소 방식, 방어력이 항상 유의미)

### 장비
10부위 장착. 7등급 (common ~ mythic). 젬으로 +99 강화. 등급별 보석 소켓(1~3). 랜덤 옵션 리롤(골드)/잠금. 발동형 효과(신화 무기/악세서리).

### 무한던전 (심연의 나락)
0~999층. 선형 스케일링. 전 등급 장비 드랍. 10층마다 보스. 사망 시 -10층.

### 환생 (Prestige)
Lv60 이상에서 리셋. 환생마다 영구 보너스 누적. 장비/강화/업적/유물 유지.

### 유물
13종. 젬으로 영구 강화. 영혼의 불꽃(전체 스탯 +1%, 무한 레벨).

### 가챠
장비 가챠: 1회(300젬)/11회(2700젬). 펫 가챠: 1회(500젬)/11회(4500젬). 천장(pity) 시스템.

## 프로젝트 구조

```
shared/          # 공유 타입 + 게임 데이터 (items, monsters, skills, etc.)
client/          # React SPA
  src/config/    # 스프라이트 매핑 등 설정
  public/assets/ # 게임 에셋 (스프라이트, 아이콘)
server/          # Express API + SQLite
  data/          # game.db (SQLite)
docs/            # 프로젝트 문서
```

자세한 내용은 [CLAUDE.md](CLAUDE.md) 참고.

## 라이선스

게임 에셋:
- DungeonTileset II by 0x72 - CC0 (Public Domain)
- Kyrise's Free 16x16 RPG Icon Pack - CC BY 4.0 (Credit: Kyrise/Gabie Nory)
