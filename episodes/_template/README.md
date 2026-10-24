# 에피소드 템플릿

새 에피소드는 이 폴더를 복사해서 시작합니다.

```bash
cp -r episodes/_template episodes/NN-slug
```

1. `package.json`의 `name`을 `@series/episode-NN-slug`로 바꾸고 `pnpm install`
2. `episode.json`: `id`(저장 키에 쓰임), `number`, `slug`(폴더 이름), 제목·역할·소개, `concepts`, `difficulty`(1~5).
   공개할 때 `status`를 `"published"`로 바꾸면 랜딩 목록과 배포 빌드에 들어갑니다
3. `src/model/`: 순수 계산만 둡니다. 모든 수식·물리값 옆에 근거(공식, 출처)를 주석으로 남기고, `tests/`에 단위 테스트를 씁니다
4. `src/main.ts`: 화면 연결, 문구(`defineStrings`), 미션(`TUT`)
5. 확인: `pnpm dev` 후 `/episodes/NN-slug/`, `pnpm check`

규칙: `@series/engine`만 import 합니다. 다른 에피소드 파일은 import 하지 않습니다(`pnpm check:boundaries`가 검사).
