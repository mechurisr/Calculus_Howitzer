# 개발 환경 구축 기록

에이전트 역할 표기: 메인 세션(기획·구현), 리서치 세션, 검토 에이전트(스펙 검토·PR 크로스체크), 사람(최종 판단·머지).

## 1단계: 현황 분석 (2026-10-24)

- 박격포(미적분 자주포)는 `index.html` 한 파일(845줄)에 HTML·CSS·JS가 모두 있었음. 바닐라 JS + Canvas 2D, 빌드·테스트·배포 설정 없음
- 재사용 후보: 테마 토큰(라이트/다크), 한/영 i18n, 고정 Δt 루프, 고해상도 캔버스, 튜토리얼 엔진(단계 gate/auto/on/enter/exit + 퀴즈 + 코치마크), 툴팁, 슬라이더·세그먼트 버튼
- 문제점: 수학과 UI가 섞여 단위 테스트 불가, `Math.random` 직접 사용으로 재현 불가, 공기저항 계수 근거 없음, ± 버튼 36px
- 설치 현황: git 2.56, gh 2.102(로그인됨), node 26.7, pnpm 12.14, python 3.14.8, opencode 2.1.4, herdr 0.9.1 있음. pipx·spec-kitty 없음(PyPI 이름 `spec-kitty-cli`, 3.2.7 존재, 최신 4.1.5). `spec-kitty init --ai`는 쉼표로 여러 개 지정 가능
- 결정 사항 (사람 승인)
  - 레포: 기존 `Calculus_Howitzer` 레포를 모노레포로 전환 (이력 유지)
  - 스택: Vite + TypeScript(프레임워크 없음) + pnpm workspaces + Vitest + Playwright
  - DeepSeek(검토 에이전트)은 리서치 아이디어를 내지 않고, 채택 전 Issue의 수치·출처 팩트체크를 맡음
  - 스펙의 "정답·검증 공식"은 `answers.md`로 분리 (검토 에이전트가 답을 보기 전에 직접 풀 수 있게)
  - 이름은 howitzer로 통일 (`episodes/01-calculus-howitzer`)

## 2단계: 모노레포 구성 (2026-10-24, 브랜치 `setup/monorepo`)

### 구조

```
engine/        @series/engine — math, sim, ui(CSS 포함), i18n, tutorial + tests/
episodes/01-calculus-howitzer/   src/model(순수 계산) · src/view(그리기) · game.ts · missions.ts · main.ts · tests/
episodes/_template/              새 에피소드 뼈대 (배포 빌드에서는 제외, 개발 서버에서만 열림)
site/          랜딩. 각 episode.json에서 status가 published인 것만 목록에 표시
e2e/           Playwright. legacy/howitzer.html = 이전 전 원본(비교 기준)
scripts/check-boundaries.mjs     의존 규칙 검사
```

- 빌드: Vite 멀티페이지 한 번으로 `dist/`(랜딩 `/`, 에피소드 `/episodes/<slug>/`). 엔진 코드·CSS는 공통 청크로 한 번만 받음
- 엔진 범위는 박격포가 실제로 쓰는 것만 옮김. 차트·전장 그리기는 아직 박격포 전용으로 둠(두 번째 에피소드가 필요로 할 때 엔진으로 올림)
- 저장 키: `series:lang`(언어, 시리즈 공통), `series:<id>:tutDone`(튜토리얼 완료). 기존 `supojaLang`/`supojaTutDone`은 새 도메인이라 이어받지 않음
- 버튼 클래스 이름 일반화: `.fire` → `.btn-primary`, `.sec` → `.btn-sec`

### 물리값 근거 정리 (`episodes/01-calculus-howitzer/src/model/constants.ts`)

- g = 9.8 m/s²: 표준중력 9.80665를 반올림 (튜토리얼 "0.5초에 4.9씩"의 전제)
- 공기저항 k = 0.00042 /m: **게임용 값**으로 표시. 실제 155 mm 포탄으로 계산하면 약 8.0×10⁻⁵ (이 값의 1/5). 실탄 C_d는 마하수에 따라 크게 변하므로 "검증 필요"
- 장약 포구속도 60·75·93·115 m/s: **게임용 값** (실제 자주포는 수백 m/s)
- 적분기: 실제로는 semi-implicit(symplectic) Euler. 화면 문구는 "오일러 방법" 그대로 둠 → 스펙 검토 때 다룰 후보

### 검증 결과

| 검사 | 결과 |
|---|---|
| `pnpm typecheck` (TypeScript 7.0.2 strict) | 통과 |
| `pnpm check:boundaries` | 통과. 다른 에피소드를 import하는 코드를 일부러 넣으면 두 경로(상대 경로, 패키지 이름) 모두 잡아냄 |
| 단위 테스트 (Vitest) | 4 파일 39개 통과. 수치적분 vs 해석해(사거리 1 m 안쪽), 근의 공식, 리만 합 오차 ½gTh, 할선 기울기, "모든 목표에 닿는 장약이 있다"는 기존 주석 주장(진공) 확인 |
| 이전 전후 비교 `e2e/parity.spec.ts` | 5개 통과. 같은 시드에서 원본과 새 빌드를 같은 조작으로 돌려 비교 |
| 모바일 `e2e/mobile.spec.ts` | 5개 통과. 390×844 터치로 장약·각도·발사·튜토리얼, 가로 스크롤 없음 |

이전 전후 비교 방법:
- `Math.random`을 고정 시드로 바꾸고, 시계를 멈춘 뒤 `requestAnimationFrame`을 테스트가 16 ms씩 직접 돌림
- 자유 플레이(진공·공기 × 장약 4 × 각도 3, 힌트, ± 버튼, 비행 중 정지·0.5초 진행·계속, 언어 전환, 새 목표)를 라이트·다크 두 번 → 매 단계 모든 문구·버튼 상태·**캔버스 픽셀**이 같음
- 튜토리얼 22단계를 자동으로 끝까지 진행하면서 매 단계 비교 → 같음
- 데스크톱(1280×900)·휴대폰(390×844) 전체 화면 스크린샷 **픽셀 단위로 같음**
- 비교에서 제외한 의도적 차이: 버튼 클래스 이름, 엔진이 만든 DOM의 태그 사이 공백, CSS 압축이 소문자로 바꾼 색 코드(`#C5CEC6` → `#c5cec6`)

테스트를 만들며 알게 된 점 (에이전트가 다시 겪지 않도록):
- Playwright 가짜 시계는 `install`만 하면 실제 시간도 흐름 → `pauseAt` 필요
- 가짜 시계의 rAF는 실제 렌더링에 따라 프레임이 합쳐져 같은 파일끼리도 결과가 흔들림 → rAF를 테스트가 직접 돌림(`e2e/helpers.ts` `advance`)
- 한글 웹폰트는 유니코드 구간별 지연 로딩이라, 캔버스 비교 전에 `document.fonts.ready` 후 한 프레임 다시 그려야 함
- 부드러운 스크롤은 가짜 시계와 무관하게 움직임 → 튜토리얼 테스트는 `reducedMotion: 'reduce'`

### 남은 일 (다음 단계 후보)

- 권장 터치 크기 44×44 px보다 작은 조작 요소: 언어 버튼(65×30), ± 버튼(36×36), 각도 슬라이더 높이(28), 장약·모드 버튼 높이(41). 이전 검증을 위해 그대로 둠 → 헌장의 모바일 규칙이 정해지면 고칠 항목
- 브라우저가 자동으로 요청하는 `favicon.ico`가 404 (원본도 같음)
- CI(GitHub Actions)에서 `pnpm check`와 e2e 돌리기 → 5단계에서 배포와 함께 설정

## 3단계: Spec Kitty 세팅 (2026-10-24)

### 설치

- `sudo pacman -S --needed python-pipx` (사람이 별도 터미널에서 실행. 지문·비밀번호 인증이 필요해 에이전트 세션에서는 불가)
- `pipx install spec-kitty-cli==3.2.7` → `~/.local/share/pipx/venvs/spec-kitty-cli`, 실행 파일 `~/.local/bin/spec-kitty`
- `spec-kitty upgrade --agent-check --json` → `none` (3.2.7 고정)

### 초기화: `spec-kitty init --ai claude,opencode --non-interactive`

- init은 이미 초기화된 폴더에서 다시 실행하면 아무것도 하지 않음 → 두 번 나눠 실행하지 않고 쉼표로 한 번에 지정
- 레포에 생긴 것(커밋함): `.kittify/`(config, metadata, charter), `AGENTS.md`(OpenCode가 읽는 안내), `.claudeignore`, `.gitattributes`(kitty-specs 이벤트 로그 머지 드라이버), `.gitignore` 추가분
- 레포에 생겼지만 **gitignore 대상**(커밋 안 됨): `.claude/`(CLAUDE.md, settings.json 훅, agents, skills 81개), `.agents/skills/`(OpenCode용 스킬 81개). 새로 clone하면 `spec-kitty init --ai claude,opencode --non-interactive`를 다시 실행해야 함
  - `.claude/settings.json`에 훅이 추가됨: SessionStart → `spec-kitty session-start`, Stop → `spec-kitty session-stop`
  - 4단계 역할 지시문은 `.claude/`가 아닌 커밋되는 위치에 둬야 함
- `verify-setup` 통과 (Managed Skills 162개 정상)

### ⚠ 전역 설치 (예상하지 못한 동작)

spec-kitty 3.2.7은 **어떤 명령이든 실행할 때마다** (`--version` 포함) 지원하는 모든 에이전트의 사용자 전역 폴더에 슬래시 명령·스킬을 설치하고, 없거나 버전이 다르면 다시 만든다 (`specify_cli/__init__.py` main_callback → `ensure_global_agent_commands()` / `ensure_global_agent_skills()`, ADR 2026-04-07-1). 끄는 옵션·환경 변수는 없음. 첫 실행(21:05:31) 때 생긴 것:

- 새 폴더: `~/.kittify/`, `~/.spec-kitty/`, `~/.qwen/`, `~/.kilocode/`, `~/.gemini/`, `~/.github/prompts/`, `~/.cursor/commands/`, `~/.windsurf/`, `~/.augment/`, `~/.amazonq/`, `~/.kiro/`, `~/.agent/`, `~/.claude/commands/`, `~/.config/opencode/commands/`
- 기존 폴더에 추가: `~/.claude/skills/`(spec-kitty 스킬 56개), `~/.agents/skills/`
- 영향: 다른 프로젝트의 Claude Code 세션에도 `/spec-kitty.*` 명령과 spec-kitty 스킬이 보임

### 헌장

`/spec-kitty.charter` 절차(대화 인터뷰 → `answers.yaml` → `charter generate`)로 작성.

- 인터뷰 결정: 모바일 = 360px 폭 + 터치 대상 44px, 머지 조건 = CI 통과 + 검토 에이전트 크로스체크에 미해결 [치명적] 없음(GitHub 승인 수 요구 없음), 커밋 = Conventional Commits, 문구 = 한국어·영어 필수
- `.kittify/charter/charter.yaml`: 정책의 기준. `governance`(테스트·품질·커밋·브랜치 규칙)와 프로젝트 규칙 `PRJ-001`~`PRJ-010`을 직접 작성. 기본 제공 규칙 8개(DIRECTIVE_001, 010, 024, 030, 033, 045, 046, 050)와 패러다임 2개(specification-by-example, trunk-based) 선택
- `.kittify/charter/charter.md`: 사람이 읽는 요약. `## Policy Summary` 항목 8개가 각 단계 첫 로드 때 프롬프트에 들어감(확인함)
- 알게 된 점: `charter generate`는 `governance`·`directives`를 채우지 않음(직접 작성해야 함). 3.2.7 스키마는 `directives: {directives: [...]}` 형태이고 `applies_to` 필드가 없음 — 스킬 문서의 예시(리스트 + applies_to)대로 쓰면 로드에 실패해 규칙이 조용히 빠짐. 적용 단계는 설명 문장 안에 적음
- `charter lint`: 2건(MEDIUM) — 선택하지 않은 기본 규칙 DIRECTIVE_035·039의 카탈로그 연결 문제로, 이 프로젝트와 무관

### 에피소드 스펙 템플릿

- `.kittify/overrides/missions/software-dev/templates/spec-template.md` (resolver가 OVERRIDE 계층으로 선택하는 것 확인)
- 기본 템플릿 앞에 "Episode Design" 필수 섹션 추가: 역할 설정, 수학 개념, 학습 목표(3개 이내), 핵심 인터랙션, 단계별 미션, 정답·검증(→ answers.md), 참고 자료, 난이도
- 기존 에피소드를 고치는 작은 미션은 바뀌는 항목만 쓰고 나머지는 "N/A — 이유"

## 4단계: 역할별 지시문 (2026-10-24)

`.claude/`, `.opencode/`는 Spec Kitty가 gitignore로 관리하므로 지시문은 모두 커밋되는 위치에 둠. 전체 표: `docs/agents/README.md`

| 역할 | 자동으로 읽는 것 | 지시문 | 강제 장치 |
|---|---|---|---|
| 메인 세션 (Claude Code) | 루트 `CLAUDE.md` → `@docs/agents/main.md` import | `docs/agents/main.md` | — |
| 리서치 세션 (Claude Code) | `CLAUDE.md` + `--append-system-prompt-file docs/agents/research.md` | `docs/agents/research.md` | `--settings docs/agents/research.settings.json` (Edit·Write·NotebookEdit, git commit/add/push, gh pr, Issue 닫기·삭제 거부) |
| 검토 에이전트 (OpenCode) | `AGENTS.md`(Spec Kitty 블록 아래에 추가), 루트 `opencode.json` | `docs/agents/review-spec.md`, `review-pr.md`, `review-factcheck.md` | `opencode.json`의 agent별 `permission` |

검토 에이전트 agent 4개 (모델 `hive/deepseek-ai/deepseek-v4.1-flash-1017`, 사람이 전역 설정에 Hive AI provider로 등록함):
- `spec-review` (1차): `answers.md` 읽기 거부, `grep` 거부, `kitty-specs/*/spec-review.md`만 쓰기 허용, bash는 `ls`·`date`·`python3 -c`만
- `spec-compare` (2차): `answers.md` 읽기 허용, 쓰기는 `spec-review.md`만
- `pr-check`: 쓰기 거부, bash는 `gh pr view/diff/checks/comment`, `gh issue view`, `git fetch/log/diff/show`만. PR 브랜치를 체크아웃하지 않음(메인 세션과 같은 폴더)
- `fact-check`: 쓰기 거부, bash는 `gh issue view/comment`만, webfetch 허용
- 스펙 검토 지시 (b)는 원문 그대로 넣고, "정답을 보지 말고 먼저 풀기"는 1차·2차 분리 + 읽기 권한으로 강제. 1차가 `python3 -c`로 파일을 여는 우회는 막지 못함(지시로만 금지)

실행: `scripts/review-agent.sh spec|pr-check|fact-check <대상>` (TUI에서는 `/spec-review` 등)

검증:
- `opencode debug agents`: 4개 agent와 지시문 프롬프트 로드 확인
- 권한 시험(DeepSeek 실제 호출, 임시 폴더 사용 후 삭제): `spec-review`는 answers.md 읽기·다른 파일 쓰기·`cat answers.md` 거부, spec-review.md 쓰기 성공. `pr-check`는 파일 쓰기·`git push`·`gh pr merge` 거부, `git log` 성공
- 리서치 세션(`acceptEdits` 모드로 시험): 편집 도구가 제공되지 않음, 역할을 "리서치"로 인식. `git commit`은 지시문 규칙 때문에 시도하지 않아 거부 규칙 자체는 미확인

알게 된 점:
- DeepSeek 호출이 TUI에서도 "Authorization header missing"으로 실패했음. 원인: 전역 설정의 `"apiKey": "{env:HIVE_API_KEY}"`는 `~/.bashrc`가 `~/.config/hive/env`를 불러올 때만 값이 생기는데, 백그라운드 opencode 서비스와 런처로 연 TUI는 `.bashrc`를 거치지 않아 변수가 없었음 (TUI도 이 서비스에 접속)
- 근본 해결 (2026-10-24): 사람이 `opencode auth login hive`로 키를 OpenCode 인증 저장소에 등록(`opencode auth list` → Hive AI stored) → 전역 `~/.config/opencode/opencode.json`에서 `apiKey` 줄 삭제(백업 `opencode.json.bak-20261024-212723`) → `opencode service restart`. 환경 변수 없이 기본 모드 `opencode run`으로 호출 성공 확인. `~/.config/hive/env`와 `.bashrc` 줄은 그대로 둠
- `AGENTS.md`의 추가 절은 Spec Kitty 표시 블록(`spec-kitty:orientation`) 밖에 있음. `spec-kitty init`·`upgrade` 뒤 지워지지 않았는지 확인할 것

## 5단계: GitHub와 배포 (2026-10-24)

- Issue 폼 `.github/ISSUE_TEMPLATE/episode-idea.yml` (라벨 `idea` 자동). 항목은 리서치 세션 Issue 형식과 같음(역할 설정, 수학 개념, 학습 목표 3개 이내, 핵심 인터랙션, 실제 데이터·물리값 표, 참고 자료 필수, 기존 주제와의 차이, 난이도). `docs/agents/research.md`의 제목 수준을 폼 출력과 같은 `###`로 맞춤
- PR 템플릿 `.github/pull_request_template.md`: 구현 요약, 수학 검증 결과(표), 스크린샷(데스크톱·360px), 리뷰 요청 사항 + 헌장 확인 목록
- CI `.github/workflows/ci.yml`: PR·main push마다 `pnpm check` → Playwright 번들 Chromium으로 `pnpm test:e2e`(`PW_CHANNEL=""`), 실패 시 리포트 업로드. Action 버전은 최신 릴리스 조회로 결정: checkout@v7, setup-node@v7, pnpm/action-setup@v6(packageManager의 pnpm 12.14.0 사용), upload-artifact@v7
- `.github/workflows/label-deployed.yml`: PR이 main에 머지되면 그 PR이 닫는 Issue에 `deployed`, 진행 라벨 제거 (배포 성공 여부는 보지 않음)
- Cloudflare Pages: `wrangler.toml`(name `math-role-sims`, `pages_build_output_dir = "./dist"`), `.node-version`(26). pnpm 버전은 파일로 지정할 수 없어 대시보드 환경 변수 `PNPM_VERSION=12.14.0` 필요(기본 10.11.1). 연결 절차: `docs/deploy.md`
- `404.html` 추가: Cloudflare Pages는 404.html이 없으면 없는 주소마다 루트(랜딩)를 보여 줌(SPA 가정)
- 레포: 공개, Actions 켜짐, main 보호 없음 → 보호 규칙은 선택 사항으로 `docs/deploy.md`에 안내
- 로컬에서 확인 못 한 것: CI 워크플로 실제 실행(번들 Chromium에서 이전 비교 테스트), Cloudflare 빌드 → 설정 PR을 열면 확인

### 5단계 마무리: 배포 확인 (2026-10-24)

- PR #1(1~5단계) CI 통과(4분 14초, 단위 39개·브라우저 10개, Playwright 번들 Chromium에서도 이전 비교 일치) → 사람이 머지(`74dfec2`)
- Cloudflare: 대시보드의 Create application은 Workers가 기본. 화면 안의 Pages 링크로 들어가야 Pages 프로젝트가 됨 (`docs/deploy.md`)
- 연결 직후 빌드와 "Retry"는 예전 main 커밋 `a948d79`(package.json 없음)을 빌드해 실패. Retry는 같은 커밋을 다시 빌드하므로 머지 후에도 실패 — 무시. 머지 커밋 `74dfec2`는 자동 빌드·배포 성공
- 배포 확인: https://math-role-sims.pages.dev/ (200, 랜딩) · `/episodes/01-calculus-howitzer/` (200) · 없는 주소 404 페이지

## 6단계: herdr 작업 공간 (2026-10-24, 브랜치 `setup/workspace`)

- `scripts/workspace.sh`: herdr 작업 공간 `math-sims`에 4패널 — 메인 세션(Claude Code `ms-main`) / 리서치 세션(Claude Code `ms-research`, research.md + 권한 설정) / 검토 에이전트(OpenCode `ms-review`) / spec-kitty 대시보드. `--open`, `--close` 지원, 이미 있으면 그 작업 공간으로 이동. herdr 안(`HERDR_ENV=1`)에서만 실행
- herdr CLI는 `herdr --skill`과 각 명령 `--help`로 확인: `workspace create --label --cwd`, `pane split --direction`, `pane rename`, `agent start <이름> --kind claude|opencode --pane -- <인자>`, `pane run`
- 에이전트 이름은 herdr 전체에서 겹치면 안 되어 `ms-` 접두어
- 처음 실행 때 메인 패널의 Claude Code가 폴더 신뢰 확인에서 멈춤(`agent_not_ready`) → 사람이 한 번 허용. 스크립트는 멈춘 에이전트가 있어도 나머지를 띄우고 어느 패널에서 답해야 하는지 알려 주게 고침
- OpenCode 패널은 기본 agent가 Build(코드 수정 가능)로 열림 → 이 레포 `opencode.json`에서 내장 `build`·`plan`도 `edit: deny`, `bash: ask`로 덮어씀 (`opencode debug agents`로 반영 확인)
- `spec-kitty dashboard`는 백그라운드 서버를 띄우고 주소(http://127.0.0.1:9237)만 출력하고 끝남. 대시보드가 헌장 사전 점검 경고 "synthesized_drg missing"을 냄 → `spec-kitty charter synthesize` 실행(새 프로젝트용 최소 파일 `.kittify/doctrine/PROVENANCE.md`, `.kittify/charter/synthesis-manifest.yaml` 생성) → `charter preflight` 통과. 경고 기록 `.kittify/preflight-warning.json`은 gitignore
- OpenCode가 DeepSeek을 쓰는 설정: 사람이 완료(Hive AI provider, `opencode auth login hive`) — 4단계 기록 참고
- 시험: 작업 공간을 실제로 띄워 네 패널 확인 — 메인·리서치 Claude Code idle, OpenCode에 "DeepSeek V4.1 Flash Hive AI" 표시, 대시보드 주소 출력

## 7단계: 리허설 — 발사각 슬라이더 눈금 (2026-10-24~25, Issue #3, PR #5)

흐름 2~8을 작은 기능 하나로 한 바퀴. 미션 `kitty-specs/howitzer-angle-ticks-01M5Q3M8/`, 브랜치 `mission/howitzer-angle-ticks`.

### 단계별 결과

| 흐름 | 결과 |
|---|---|
| 1·2 아이디어·채택 | Issue #3 등록 → 검토 에이전트 팩트체크(7분) — 제가 쓴 "45°가 최대", "30°·60° 같은 거리"가 이 게임(포구 높이·지형·공기저항)에서는 틀렸다고 계산 근거와 함께 지적 → 사람 채택 |
| 3 스펙 | `/spec-kitty.specify` + `answers.md` 분리. 덮어쓰기 템플릿(Episode Design) 정상 적용 |
| 4 스펙 검토 | 1차·2차 [치명적] 0 · [권장] 17 · [사소함] 8. 2차가 제 스펙과 1차 풀이의 공통 오류(슬라이더 폭 210→206px, 브라우저 기본 margin 2px)를 세 엔진 UA 스타일시트로 확인해 찾음 |
| 5 반영·계획·작업 | 사람이 7묶음 모두 반영 선택 → plan(결정 R-1~R-7) → tasks(WP 3개) → analyze(ready) |
| 6 구현 | WP01은 Spec Kitty lane에서, WP02·03은 lane 충돌 때문에 기능 브랜치에서 직접 (아래 "브랜치 구조"). 단위 52개, 브라우저 Chromium 20개 + CI Firefox·WebKit |
| 7 크로스체크 | 3번째 실행에서 성공: [치명적] 0 · [권장] 4 · [사소함] 4 → 사람이 8개 모두 반영 선택 |
| 8 머지 | 사람 |

### 바뀐 도구·설정

- `opencode.json`: 검토 agent 4개 모두 `"*": "deny"` 기본 거부 + 필요한 도구만 허용. `execute`(Code Mode) 거부. `question` 거부(비대화식 실행에서 무한 대기). 크로스체크·팩트체크·2차 검토에 `grep` 도구와 `grep`/`head`/`wc` 허용 (OpenCode는 파이프로 이은 명령을 하나씩 검사 — 시험으로 확인). 1차 검토는 `grep` 계속 거부(answers.md 격리)
- `scripts/review-agent.sh`: `--standalone`(매 실행 별도 서버), 상세 로그 `logs/*.debug.log`, 단계별 시간 제한 30분, 실행 뒤 결과물 확인(댓글·spec-review.md) → 없으면 고유 제목으로 세션을 찾아 이어받기(최대 3번)
- `scripts/review-log.sh` 신규: 최근 검토 로그를 실시간 표시. `scripts/workspace.sh`의 검토 패널을 OpenCode TUI 대신 이 뷰어로
- `docs/agents/review-pr.md`: PR 범위만, `node_modules` 조사 금지, 도구 호출 약 40회, 마지막에 반드시 댓글
- `playwright.config.ts`: projects — chromium(전체) / firefox·webkit(눈금·모바일, CI만). `ci.yml`: 세 엔진 설치
- `e2e/helpers.ts`: 이전 비교는 페이지 스크립트 전에 `data-ticks`를 지워 원본 배치로 비교. 튜토리얼 자동 진행을 공용 함수 `walkTutorial`로
- `engine/src/tutorial`: 선택 콜백 `onEnd`

### 막힌 지점과 대응

1. **검토 에이전트 멈춤/조용한 종료 (OpenCode 2.1.4)**: 도구 실행 뒤 다음 모델 요청을 보내지 않고 멈추거나(Hive로 연결 없음 — 세션 기록·`ss`로 확인), 다음 단계 시작 직후 출력 없이 exit 0. 백그라운드 서비스·standalone 모두에서 발생, `execute` 사용 세션에서 잦음 → `execute` 거부, 시간 제한, 결과물 확인·이어받기로 대응. 근본 원인은 미확인 (Hive 대시보드 요청 기록으로 추가 확인 가능)
2. **클라이언트만 끈 세션이 서비스에서 계속 실행**: 멈춘 세션의 `opencode run`을 kill해도 백그라운드 서비스의 세션은 남아, 작업 공간 OpenCode 패널이 그 세션을 열자 다시 진행되며 정리된 `spec-review.md`를 덮어씀(spec-kitty 자동 커밋까지 됨) → 패널 Esc로 중단, `15908e5` 버전으로 복구(`9ec11c4`), 리허설 검토 세션 삭제. 이후 검토는 `--standalone`
3. **`execute`(Code Mode) 우회 경로**: 직접 파일 접근(require·Deno·file://)은 막혀 있지만 코드 안에서 `tools.read`로 다른 도구 호출 가능 → 거부
4. **`python3 -c`로 파일 쓰기 가능**: 2차 검토가 `python3 -c`로 spec-review.md를 씀. 1차에서는 편집 금지 우회가 될 수 있음 (미해결 — 1차의 `python3 -c` 제거 검토)
5. **브랜치 구조 (Spec Kitty 3.2.7 lane ↔ PR 흐름)**: Spec Kitty는 조정용 브랜치 `kitty/mission-…`에 WP 상태를 자동 커밋하고 lane 브랜치에 자동 rebase. 계획 문서를 기능 브랜치에 두고 거기에 직접 커밋하면 두 브랜치의 `kitty-specs/`가 갈라져, WP 이동마다 "lane 브랜치에 kitty-specs 변경 금지" 거부와 lane 할당 병합 충돌이 연쇄 → WP02부터 lane 없이 기능 브랜치에서 구현. 기능 브랜치의 Spec Kitty 상태(`status.json`)는 기준이 아님(비어 있음, WP02·03 lane 상태 미반영)
6. **분석 보고서 무효화**: analyze 뒤 spec·plan을 고치면 implement가 `stale_analysis_report`로 거부 → 재기록 필요
7. **WP 리뷰 점검 #1(죽은 코드)**: 계산만 담는 기반 WP는 운영 코드 호출처가 다음 WP에 있어 구조적으로 FAIL → 사람이 예외 승인. WP는 "계산 + 그 계산을 쓰는 화면"을 같이 묶는 편이 맞음
8. **Spec Kitty 기준선 테스트 오인**: 테스트 도구를 pytest로 판단해 "기준선 실패 1건" 기록 → 삭제
9. **CI 전 머지**: PR #2가 CI 완료 전에 머지됨(결과는 통과). main 보호 규칙이 없어서 가능
10. **로컬 테스트가 옛 서버를 재사용**: 사람에게 보여 주려고 띄운 `pnpm preview`의 node 프로세스가 남아 Playwright(`reuseExistingServer`)가 옛 빌드를 검사 → 프로세스 정리. `pnpm preview`를 끌 때 셸만 죽고 node가 남음
11. **라벨 `building` 누락**: 구현 시작 때 Issue 라벨 변경을 빠뜨림
12. **자동 커밋 메시지 형식**: Spec Kitty 자동 커밋(`Add plan for feature …` 등)은 Conventional Commits가 아님. `setup-plan`·`finalize-tasks`는 일부 파일만 커밋해 나머지를 따로 커밋해야 함

### 결론과 후속 조치 (2026-10-25, 사람 승인)

- 머지·배포 확인: PR #5 머지(`17e3465`) → main CI `check`·Cloudflare Pages 성공, Issue #3 `deployed`·닫힘, 배포 번들에 눈금 코드 포함
- **브랜치 구조 (막힌 지점 5)**: Spec Kitty는 specify·plan·tasks·analyze·상태 표시까지만. 구현은 기능 브랜치에서 직접, `/spec-kitty.implement`·`spec-kitty merge` 미사용 → `docs/agents/main.md` 6절 개정
- **WP 나누기 (막힌 지점 7)**: "계산 + 그 계산을 쓰는 화면"을 한 WP로 → main.md 5절
- **라벨 `building` (막힌 지점 11)**: main.md 6절에 구현 시작 체크리스트
- **main 보호 (막힌 지점 9)**: PR 필수, 필수 상태 체크 `check`, 승인 수 0, 관리자에게도 적용(`enforce_admins: true`)
- **`python3 -c` (막힌 지점 4)**: 1차 스펙 검토(`spec-review`)에서 제거. 1차는 식·근사로 풀고 근사를 표시, 2차가 `python3 -c`로 정밀 대조 (`docs/agents/review-spec.md`). 대안으로 `bc -l`(파일 입출력 없음)을 검토했으나 미설치
- 정리: worktree `-coord`·`-lane-a`, 브랜치 `kitty/mission-howitzer-angle-ticks-01M5Q3M8*`, `setup/monorepo`·`setup/workspace`·`mission/howitzer-angle-ticks`(로컬·원격) 삭제
- 미해결: 검토 에이전트 멈춤 근본 원인 (막힌 지점 1)

## 검토 실행 보완 (2026-10-25, Issue #4 스펙 검토 중)

1차 스펙 검토(`spec-review`)가 30분 제한에 걸려 `spec-review.md`를 요약과 1절 일부까지만 쓰고 끝남. 이어받기 실행은 시작 직후 멈춤.

| 증상 | 원인 (확인 방법) | 대응 (`scripts/review-agent.sh`) |
|---|---|---|
| 시간 제한(exit 124) 뒤 이어받기를 하지 않고 스크립트 종료 | `set -euo pipefail`에서 `oc`의 실패가 곧바로 스크립트를 끝냄 | `oc_try`: 실패 코드를 로그에 남기고 결과물 확인·이어받기로 진행 |
| 일부만 쓴 `spec-review.md`를 1차 완료로 판정 | 완료 판정이 파일 존재만 봄. 검토 에이전트는 `<!-- PART2 -->` 자리표시를 남기고 끊김 | 1차 완료 = 마지막 절 `## 4. 구현 가능성`·`## 반영 결과`가 있고 `<!-- PART`/`<!-- TODO` 주석이 없음 |
| `opencode run`이 서버에 요청을 보내지 않고 대기 (로그는 `cli starting`뿐) | stdin이 터미널이 아니면 EOF까지 읽어 메시지에 붙임. 에이전트 도구의 백그라운드 실행은 stdin이 열린 소켓이라 EOF가 오지 않음 (`ss -axp`로 클라이언트 fd 0 확인, `</dev/null`로 재실행하자 즉시 진행) | `oc`의 `opencode run`에 `</dev/null` |

- 시험: 가짜 `opencode`(stdin 경로 출력 후 exit 124)로 stdin = `/dev/null`, 124 뒤 이어받기 단계 진입, 일부만 쓴 파일 = 미완료 판정 확인
- 막힌 지점 1(멈춤)의 일부가 같은 stdin 원인이었을 수 있음 (미확인 — 7단계 실행은 대부분 사람 터미널에서 시작)

## 8단계: 첫 정식 미션 — 튜토리얼 실험 단계 각도 버튼 (2026-10-25, Issue #4, PR #11)

고친 흐름(main.md 3~8)으로 처음 한 바퀴. 미션 `kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7/`, 브랜치 `mission/howitzer-tutorial-angle-buttons`. 7단계와 달리 Spec Kitty lane·조정용 브랜치 충돌 없이 기능 브랜치에서 끝까지 진행.

### 단계별 결과

| 흐름 | 결과 |
|---|---|
| 3 스펙 | 사람 결정 2건(각도 버튼만 비활성, 표에 기록된 발사만 '쏜 각도')을 결정 기록으로. 44px 맞추기를 의도 요약에서 추가 승인 |
| 4 스펙 검토 | 1차가 30분 제한으로 끊김 → 이어받기 실행이 stdin 대기로 멈춤 (아래 "검토 실행 보완", PR #8). 수동 이어받기 후 2차 완료: [치명적] 0 · [권장] 11 · [사소함] 9 |
| 5 반영·계획·작업 | 사람이 전부 반영 선택(R3 관찰 문장은 기록에 맞춤, 나머지 버튼 44px는 #9) → plan(R-1~R-7) → tasks(WP 2개) → analyze ready(MEDIUM 1) |
| 6 구현 | WP01 계산+화면, WP02 e2e·CI·이전 비교. 단위 63개, 브라우저 24개 |
| 7 크로스체크 | [치명적] 1(CI 실패) · [권장] 2 · [사소함] 2 → 사람이 전부 반영 선택, 같은 PR에 2커밋 |
| 8 머지 | 사람. Issue #4 자동으로 닫힘·`deployed` |

### 막힌 지점과 대응

1. **WP 나누기와 소유 파일 겹침**: plan에서 "버튼 / 관찰 문장"으로 나누려 했으나 둘 다 `missions.ts`·모델·e2e를 건드려 finalize-tasks의 소유 파일 겹침 금지에 걸림 → "WP01 코드 전부(계산+화면) / WP02 테스트 전부"로. WP01만 커밋된 시점엔 이전 비교가 실패하므로 PR 전 `pnpm test:e2e`는 마지막 WP 뒤에 확인
2. **analyze 기록이 미추적 파일로 거부**: `record-analysis`가 커밋 안 된 `docs/handoff.md` 때문에 `DIRTY_WORKTREE`로 거부 → 파일을 잠시 밖으로 옮겼다 되돌림
3. **일시정지된 포탄이 다음 단계로 넘어옴**: 튜토리얼 자동 진행에서 앞 단계의 일시정지된 포탄이 15단계에서 착탄해 기록됨 (원본도 같은 동작이라 앱은 그대로) → 새 e2e는 14단계에서 먼저 떨어뜨리고 시작(`gotoExperimentStep`), 발사 도우미는 '계속'을 누름
4. **이전 비교의 자동 진행이 비활성 버튼에서 갈라짐**: 원본은 이미 쏜 각도 버튼을 눌러 같은 각도로 다시 쏘고, 새 버전은 버튼이 막혀 이전 각도로 쏨 → 19단계부터 진행 횟수가 달라짐. `walkTutorial`이 비활성 버튼의 각도를 슬라이더로 맞추도록(같은 input 경로) 수정. 마스킹은 `tutBody`뿐 아니라 본문을 품은 `#tut`에도 필요했음
5. **CI에서만 실패한 스크롤 단언**: `locator.focus()`가 화면 밖 슬라이더로 페이지를 스크롤함 (로컬 시스템 Chrome과 CI 번들 Chromium의 배치 차이로 CI에서만 화면 밖). 크로스체크는 CI 로그 권한이 없어 원인을 못 찾음 → 메인 세션이 `gh run view --log-failed`로 확인, `focus({ preventScroll: true })`로 수정
6. **조정용 worktree에 남은 상태 기록**: `spec-kitty agent tasks mark-status`가 조정용 worktree(`.worktrees/…-coord`)에 커밋 없이 기록 → 정리 때 `git worktree remove`가 거부. 내용이 WP 완료 기록뿐이라 `--force`로 삭제 (기능 브랜치의 Spec Kitty 상태는 기준이 아님 — 7단계 막힌 지점 5)
7. **`pkill -f` 가 자기 셸을 죽임**: 프로세스 정리에 `pkill -f "<패턴>"`을 쓰면 그 패턴이 든 명령을 실행한 셸까지 맞아 종료(exit 144) → 포트(`ss -ltnp`)나 PID로 정리

### 후속

- Issue #9: 15단계 외 튜토리얼 `.act` 버튼 44px (검토 R10)
- Issue #10: 튜토리얼 5단계 설명 순서·발사 전 안내 문구 (사람 제안)
- 인계 메모 `docs/handoff.md`(커밋 안 함)의 남은 일은 모두 처리: 로컬 폴더 이름 변경 완료(`~/Math-Role-Simulations`), Issue #4 완료 → 파일 삭제

## 9단계: 작은 개선 두 건과 절차 경량화 (2026-10-25, Issue #9·#10, PR #14·#16·#17·#18)

### 결과

| Issue | 내용 | PR | 검토 결과 |
|---|---|---|---|
| #9 | 튜토리얼 조작 버튼 `.act`·열기 버튼 `.tut-btn` 44px (엔진 공용 스타일, 사람 결정) | #14, #16 | 스펙 검토 [권장] 3·[사소함] 4 (카드 밖 `.tut-btn` 발견 → 포함, `.info`는 #13), 크로스체크 [권장] 1 |
| #10 | 튜토리얼 5단계 표 설명을 표 바로 아래로, 발사 전 문구 | #17 | 스펙 검토 [권장] 1·[사소함] 5, 크로스체크 [권장] 1·[사소함] 2 |
| — | 검토 진행 상태 표시 `scripts/review-status.sh` (사람 요청) | #18 | 크로스체크 생략 (스크립트) |

후속 Issue: #13 (힌트 해설 (i) 버튼 18px), #15 (404 페이지 링크 `.tut-btn`이 `<a>`라 최소 크기 미적용)

### 막힌 지점과 대응

1. **반영 커밋 push 전에 PR이 머지됨 (PR #14)**: 크로스체크 반영 테스트 커밋을 로컬에서 전체 테스트하는 동안 사람이 PR을 머지 → 반영 커밋은 후속 PR #16으로 cherry-pick. 이후 "push·CI 통과 뒤 머지 가능을 따로 알림"을 main.md 공통 규칙으로
2. **실행되지 않는 단언 (두 번 연속)**: #9 스크롤 깊이 단언이 조작 버튼이 나타나기 전에 돌아 항상 0, #10 음수 안내 순서 단언이 `if` 안에 있어 한 번도 실행 안 됨 → 둘 다 크로스체크가 발견. main.md 공통 규칙 "단언이 실제로 도는지"
3. **크로스체크의 계산 실수**: #10 크로스체크는 "11번째 진행에 조각이 음수"라 했으나 11번째는 vy가 음수가 되는 시점이고, 조각(시작·끝 평균 × 0.5)은 12번째에 음수 → 측정으로 확인 후 12번으로
4. **이전 비교: 가리기 대신 변환 후 정확 비교**: #10은 원본 5단계 스냅샷에 같은 문장 치환·순서 재배치를 적용해 글자까지 비교(`legacyStep5`). 스펙 검토가 짚은 함정 세 가지 — 라벨 `5 / 22`가 `15 / 22`와 섞임, 변환이 안 걸려도 통과, `#tut` 스냅샷 누락 — 을 막음
5. **머리말 크기 변경과 이전 비교**: `.tut-btn`이 2.75px 커져 페이지 배치가 밀림 → `open()` 옵션 `touch`로 이전 비교에서만 끔 (눈금 미션의 `data-ticks`와 같은 방식)
6. **`pkill -f`/`pgrep -f` 다시**: 셸 정리에 패턴 검색을 써서 자기 셸까지 종료 (메모리에 있던 실수 반복) → `ps -eo pid,args | grep "[p]attern"`로 PID를 골라 종료
7. **`mark-status`는 조정용 worktree에 미커밋 기록**: #9·#10은 `mark-status` 생략 → 정리 때 `--force` 불필요

### 절차 경량화 (사람 결정)

#10(문장 하나 + 문단 이동)이 스펙 검토 약 40분, 계획 3단계, 크로스체크 약 30분을 거쳐 절차가 변경보다 훨씬 무거웠음. 검토가 잡은 것은 대부분 테스트·화면 세부였고 수학 오류는 #4·#9·#10 모두 0건.
→ `docs/agents/main.md`에 **가벼운 경로**(라벨 `light`): 난이도 1·계산/물리값/학습 흐름 불변이면 `answers.md`·스펙 검토·plan/tasks/analyze 생략, 로컬은 바뀐 테스트만, 크로스체크는 유지. 경로는 채택 때 사람이 정함. 헌장(PRJ-001~010)은 변경 없음 — 흐름 규칙은 main.md에 있고, PRJ-006은 새 에피소드 대상, PRJ-008 머지 조건은 두 경로 모두 그대로

## TUI 진행 대시보드 (2026-10-31, 브랜치 `chore/workspace-kitty-tui`)

- `scripts/kitty-dashboard.mjs`: herdr 오른쪽 아래 패널의 TUI. 웹 대시보드(`spec-kitty dashboard`)는 주소만 출력하고 셸로 돌아와 패널이 비어 있었음 → 서버는 그대로 띄우고 패널에 TUI를 표시 (주소는 아래쪽 줄, 지원하는 터미널에서는 클릭 가능)
- 단계는 Spec Kitty 상태에서 읽지 않음: 기능 브랜치 구현이라 `status.json`이 비어 전부 0으로 나옴 (7단계 막힌 지점 5). 산출물 파일(작업 폴더 + `mission/*` 브랜치)·`feat(WPnn)` 커밋·PR·Issue 라벨·`logs/*.meta`에서 계산
- 미션 ↔ Issue: PR이 닫는 Issue가 기준. `purpose_context`에는 지나간 Issue도 언급되므로(`#4 #9`), PR 전에는 열린 Issue만 연결. 가벼운 경로 판정(`light`)이 여기에 달려 있음
- 의존성 없는 Node 스크립트. `--once`로 한 번 출력
