# API 엔드포인트

## Auth (`/api/auth`)
| Method | Path | 설명 |
|--------|------|------|
| POST | /login | 세이브 코드 로그인 |
| POST | /new-game | 새 게임 생성 |
| POST | /save | 진행 저장 |

## Combat (`/api/combat`)
| Method | Path | 설명 |
|--------|------|------|
| POST | /start | 일반 던전 시작 |
| POST | /action | 스킬 사용 |
| POST | /use-item | 전투 중 아이템 사용 |
| POST | /abyss/start | 무한던전 시작 |
| POST | /abyss/action | 무한던전 액션 |
| POST | /weekly-boss/start | 주간 보스 시작 |
| POST | /weekly-boss/action | 주간 보스 액션 |

## Game (`/api/game`)
| Method | Path | 설명 |
|--------|------|------|
| GET | /characters | 캐릭터 목록 |
| GET | /dungeons | 던전 목록 |
| GET | /skills/:characterId | 스킬 목록 |
| POST | /skill-upgrade | 스킬 레벨업 (골드) |
| POST | /talent-invest | 특성 투자 |
| POST | /talent-reset | 특성 리셋 (10,000G) |
| POST | /equip-title | 칭호 장착 |
| POST | /prestige | 환생 |
| POST | /appearance | 외형 변경 |
| POST | /artifact-upgrade | 유물 업그레이드 (젬) |

## Inventory (`/api/inventory`)
| Method | Path | 설명 |
|--------|------|------|
| POST | /use | 소비 아이템 사용 |
| POST | /equip | 장비 착용 |
| POST | /unequip | 장비 해제 |
| POST | /sell | 아이템 판매 |
| POST | /enhance-gold | 골드 강화 |
| GET | /enhance-info/:itemId | 강화 정보 |
| POST | /socket-gem | 보석 장착 |
| POST | /unsocket-gem | 보석 제거 |

## Shop (`/api/shop`)
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 상점 목록 |
| POST | /buy-potion | 포션 구매 |
| POST | /buy-equipment | 장비 구매 |

## Craft (`/api/craft`)
| Method | Path | 설명 |
|--------|------|------|
| GET | /recipes | 제작법 목록 |
| POST | /make | 아이템 제작 |

## Pets (`/api/pets`)
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 펫 목록 |
| POST | /summon | 펫 소환 (젬) |
| POST | /equip | 펫 장착 |

## Daily (`/api/daily`)
| Method | Path | 설명 |
|--------|------|------|
| GET | /status | 일일 보상 상태 |
| POST | /claim | 보상 수령 |

## Ranking (`/api/ranking`)
| Method | Path | 설명 |
|--------|------|------|
| GET | /abyss | 심연 랭킹 Top 20 |
