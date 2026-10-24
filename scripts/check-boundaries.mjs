// 의존 규칙 검사 (헌장: "에피소드는 엔진만 import, 에피소드끼리 의존 금지")
//   episodes/<이름>/ : 자기 폴더 안 상대 경로와 @series/engine 만 허용
//   engine/          : 엔진 밖(에피소드·사이트) import 금지
//   site/            : 에피소드는 episode.json 메타데이터만 읽을 수 있음
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = /\.(ts|js|mjs|html)$/;
const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(?\s*['"]([^'"]+)['"]|import\.meta\.glob(?:<[^>]*>)?\(\s*['"]([^'"]+)['"]|<script[^>]+src=["']([^"']+)["']/g;

function* files(dir) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === 'dist') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* files(p); else if (SRC.test(n)) yield p;
  }
}
const inside = (p, dir) => p === dir || p.startsWith(dir + sep);
const errors = [];

function check(file, allowed, allowPackage, label) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(IMPORT)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (/^(https?:)?\/\//.test(spec)) continue;
    let ok;
    if (spec.startsWith('.') || spec.startsWith('/')) {
      const target = spec.startsWith('/') ? join(ROOT, spec) : resolve(dirname(file), spec);
      ok = allowed(target);
    } else ok = allowPackage(spec);
    if (!ok) errors.push(`${relative(ROOT, file)}: '${spec}' — ${label}`);
  }
}

const isNodeBuiltin = s => s.startsWith('node:');
const engineDir = join(ROOT, 'engine'), episodesDir = join(ROOT, 'episodes');
for (const f of files(engineDir))
  check(f, t => inside(t, engineDir), s => isNodeBuiltin(s) || s === 'vitest', '엔진은 엔진 밖을 import 할 수 없음');
for (const ep of readdirSync(episodesDir)) {
  const dir = join(episodesDir, ep);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of files(dir))
    check(f, t => inside(t, dir), s => s === '@series/engine' || s.startsWith('@series/engine/') || s === 'vitest',
      `에피소드 ${ep}는 자기 폴더와 @series/engine 만 import 할 수 있음`);
}
for (const f of files(join(ROOT, 'site')))
  check(f, t => inside(t, join(ROOT, 'site')) || (inside(t.replace(/\*/g, 'x'), episodesDir) && t.endsWith('episode.json')),
    s => s.startsWith('@series/engine/'), '사이트는 엔진과 각 에피소드의 episode.json 만 쓸 수 있음');

if (errors.length) { console.error('의존 규칙 위반:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('의존 규칙 OK');
