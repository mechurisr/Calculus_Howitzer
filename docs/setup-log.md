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
