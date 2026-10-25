# 배포: Cloudflare Pages (Git 연동)

main에 머지되면 Cloudflare Pages가 자동으로 빌드·배포합니다. PR마다 미리보기 주소도 생깁니다.

## 레포에 들어 있는 설정

| 파일 | 내용 |
|---|---|
| `wrangler.toml` | 프로젝트 이름 `math-role-sims`, 출력 폴더 `./dist`, `compatibility_date` |
| `.node-version` | Node 26 (Cloudflare 빌드 이미지와 CI가 같이 읽음) |
| `package.json` | `pnpm build` → `dist/` (랜딩 `/`, 에피소드 `/episodes/<slug>/`, `404.html`) |
| `.github/workflows/ci.yml` | PR·main마다 `pnpm check` + `pnpm test:e2e` |
| `.github/workflows/label-deployed.yml` | PR이 main에 머지되면 닫는 Issue에 `deployed` 라벨 |

pnpm 버전은 파일로 지정할 수 없어서(Cloudflare 기본값 10.11.1) 아래 3번에서 환경 변수로 넣어야 합니다.

## 계정 연결 (사람이 할 일)

> 순서 주의: main에 모노레포 구조가 머지되기 전에는 main 빌드가 실패합니다(예전 main에는 `package.json`이 없음).
> 설정 PR을 먼저 연 다음 연결하면, 그 PR의 미리보기 빌드로 설정을 확인할 수 있습니다.

1. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHub 권한을 주고 `mechurisr/Math-Role-Simulations` 선택 (2026-10-25 `Calculus_Howitzer`에서 이름 변경)
3. 빌드 설정
   - Project name: **`math-role-sims`** (`wrangler.toml`의 `name`과 같아야 함. 다른 이름을 쓰면 `wrangler.toml`도 고쳐 주세요)
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Root directory: 비워 둠
   - Environment variables (Production·Preview 둘 다): `PNPM_VERSION` = `12.14.0`
4. **Save and Deploy**
5. Settings → Builds → Branch control: Preview branches를 "All non-Production branches"로 두면 PR마다 미리보기 주소가 생깁니다

빌드 로그에서 확인할 것: Node 26.x, pnpm 12.14.0, `✓ built`, 출력 `dist`.

## 권장: main 보호 (선택)

GitHub → Settings → Branches → `main` 규칙: "Require a pull request before merging", "Require status checks to pass" → `check` (CI 잡 이름).
헌장 규칙(PR로만 main에 들어감, CI 통과 후 머지)을 GitHub가 강제하게 됩니다. 혼자 운영하므로 "Require approvals"는 끄세요(헌장: 승인 수 요구 없음).

## 라벨 흐름

`idea` → (스펙 검토 반영) `spec-ready` → `building` → (PR) `review` → (머지) `deployed`.
스펙에 수학 오류·모호함이 있으면 언제든 `needs-clarification`.
`deployed`만 워크플로가 자동으로 달고, 나머지는 메인 세션이 `gh issue edit`로 바꿉니다.
