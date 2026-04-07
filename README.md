# 어둠의 던전 - 턴제 RPG 웹 게임

다크 판타지 세계관의 싱글 플레이어 턴제 던전 RPG.

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript
- **공유 모듈**: 클라이언트/서버 공유 타입 및 게임 데이터

## 실행 방법

```bash
# 1. 의존성 설치
npm run install:all

# 2. 개발 서버 실행 (클라이언트 + 백엔드 동시 실행)
npm run dev
```

- Frontend: http://localhost:3333
- Backend API: http://localhost:4444

## 개별 실행

```bash
npm run dev:client    # 프론트엔드만 실행
npm run dev:server    # 백엔드만 실행
```

## 빌드

```bash
npm run build                   # 클라이언트 프로덕션 빌드
cd server && npm run build      # 서버 컴파일
```

## 게임 플레이 방법

1. http://localhost:3333 접속
2. **새로운 모험** 클릭 → 캐릭터 선택 → 모험가 이름 입력
3. 발급된 **세이브 코드를 반드시 기록** (재접속 시 필요)
4. 홈 화면에서 **던전 진입** → 던전 선택 → 전투
5. 전투에서 스킬을 사용하여 몬스터 처치
6. 승리 시 경험치/골드/아이템 자동 획득 및 저장
