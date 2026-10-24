import { defineConfig, type Plugin } from 'vite';
import { existsSync, readdirSync, renameSync, rmdirSync } from 'node:fs';

// 배포할 에피소드: episodes/ 아래 index.html이 있는 폴더 중 _로 시작하지 않는 것 (_template은 개발 서버에서만 열림)
const episodes = readdirSync('episodes').filter(d => !d.startsWith('_') && existsSync(`episodes/${d}/index.html`));

// 랜딩(site/)을 사이트 루트(/)에 둠: 빌드 결과의 site/index.html·404.html → 루트, 개발 서버의 / → /site/
function siteAtRoot(): Plugin {
  return {
    name: 'site-at-root',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => { if (req.url === '/' || req.url === '/index.html') req.url = '/site/index.html'; next(); });
    },
    // HTML의 자원 경로는 /assets/...처럼 절대 경로라 파일만 옮기면 됨
    closeBundle() {
      // 404.html 은 Cloudflare Pages 가 없는 주소에 보여 줌 (없으면 모든 주소에 랜딩을 보여 줌)
      for (const f of ['index.html', '404.html']) if (existsSync(`dist/site/${f}`)) renameSync(`dist/site/${f}`, `dist/${f}`);
      if (existsSync('dist/site')) rmdirSync('dist/site');
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [siteAtRoot()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { site: 'site/index.html', notFound: 'site/404.html', ...Object.fromEntries(episodes.map(e => [e, `episodes/${e}/index.html`])) },
    },
  },
});
