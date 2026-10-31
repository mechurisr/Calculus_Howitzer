#!/usr/bin/env node
// spec-kitty 진행 대시보드 (TUI). 미션이 흐름(docs/agents/main.md)의 어느 단계에 있는지 터미널에서 보여 줌
//   scripts/kitty-dashboard.mjs          실시간 화면 (↑↓·PgUp/PgDn 스크롤, r 새로 고침, q 종료)
//   scripts/kitty-dashboard.mjs --once   한 번 출력 (색 없음, 폭은 COLUMNS 또는 80)
//
// Spec Kitty 상태(status.json)는 쓰지 않음: 구현을 기능 브랜치에서 직접 하므로 비어 있음 (docs/setup-log.md 막힌 지점 5).
// 대신 실제 흔적에서 단계를 계산함 — 산출물 파일(작업 폴더 + mission/* 브랜치), 브랜치 커밋, PR·Issue 라벨(gh), 검토 기록(logs/*.meta)
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { promisify, stripVTControlCharacters } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const LOCAL_MS = 3_000;   // 파일·git 다시 읽는 간격
const GH_MS = 60_000;     // GitHub 다시 읽는 간격
const run = promisify(execFile);

const color = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`;
const [bold, dim, red, green, yellow, cyan] = [1, 2, 31, 32, 33, 36].map(color);

// 이슈 라벨 → 표시 이름 (사람이 먼저 봐야 하는 순서)
const LABELS = [['needs-clarification', '질문 대기'], ['review', '리뷰'], ['building', '구현'], ['spec-ready', '스펙 완료'], ['idea', '아이디어']];

const sh = async (cmd, args) => (await run(cmd, args, { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 })).stdout;
// 다른 세션이 같은 작업 폴더에서 git 을 쓰므로 인덱스 잠금을 잡지 않음
const git = (...args) => sh('git', ['--no-optional-locks', ...args]).catch(() => '');

// ── 데이터 ─────────────────────────────────────────────

function workTreeMissions() {
  const dir = join(ROOT, 'kitty-specs');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((slug) => existsSync(join(dir, slug, 'meta.json'))).map((slug) => {
    const base = join(dir, slug);
    const names = readdirSync(base);
    if (existsSync(join(base, 'tasks'))) names.push(...readdirSync(join(base, 'tasks')).map((n) => `tasks/${n}`));
    return { slug, files: new Set(names), read: async (f) => readFileSync(join(base, f), 'utf8') };
  });
}

async function branchMissions(ref) {
  const bySlug = new Map();
  for (const path of (await git('ls-tree', '-r', '--name-only', ref, 'kitty-specs/')).split('\n')) {
    const [, slug, ...rest] = path.split('/');
    if (!slug || !rest.length) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, new Set());
    bySlug.get(slug).add(rest.join('/'));
  }
  return [...bySlug].map(([slug, files]) => ({ slug, files, read: (f) => git('show', `${ref}:kitty-specs/${slug}/${f}`) }));
}

// 같은 미션이 여러 곳에 있으면 파일은 합치고, 내용은 작업 폴더(최신)를 먼저 읽음
async function loadMissions() {
  const refs = (await git('for-each-ref', '--format=%(refname:short)', 'refs/heads/mission/', 'refs/remotes/origin/mission/')).split('\n').filter(Boolean);
  const sources = [...workTreeMissions(), ...(await Promise.all(refs.map(branchMissions))).flat()];
  const merged = new Map();
  for (const s of sources) {
    const m = merged.get(s.slug) ?? { slug: s.slug, files: new Set(), sources: [] };
    s.files.forEach((f) => m.files.add(f));
    m.sources.push(s);
    merged.set(s.slug, m);
  }
  const read = async (m, f) => {
    for (const s of m.sources) if (s.files.has(f)) return s.read(f);
    return '';
  };
  return Promise.all([...merged.values()].filter((m) => m.files.has('meta.json')).map(async (m) => {
    const meta = JSON.parse(await read(m, 'meta.json'));
    const branch = meta.target_branch;
    const ref = refs.includes(branch) ? branch : refs.includes(`origin/${branch}`) ? `origin/${branch}` : null;
    const subjects = ref ? (await git('log', `main..${ref}`, '--format=%s')).split('\n').filter(Boolean) : [];
    const doneWps = new Set(subjects.flatMap((s) => s.match(/^feat\((WP\d+)\)/)?.[1] ?? []));
    const wps = await Promise.all([...m.files].filter((f) => /^tasks\/WP\d+-[^/]+\.md$/.test(f)).sort().map(async (f) => ({
      id: f.match(/WP\d+/)[0],
      title: (await read(m, f)).match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? '',
    })));
    return {
      slug: m.slug, branch, title: meta.friendly_name ?? m.slug,
      issues: [...(meta.purpose_context ?? '').matchAll(/Issue #(\d+)/g)].map((x) => Number(x[1])),
      files: m.files, review: m.files.has('spec-review.md') ? await read(m, 'spec-review.md') : '',
      subjects, wps: wps.map((w) => ({ ...w, done: doneWps.has(w.id) })),
    };
  }));
}

function loadReviews() {
  const dir = join(ROOT, 'logs');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => n.endsWith('.meta')).map((n) => {
    const fields = readFileSync(join(dir, n), 'utf8').split('\n').map((l) => l.split(' '));
    const get = (k) => fields.find((f) => f[0] === k);
    return { kind: get('kind')?.[1], target: get('target')?.slice(1).join(' '), done: !!get('done'), running: !get('end') };
  });
}

async function loadGitHub() {
  const [issues, prs] = await Promise.all([
    sh('gh', ['issue', 'list', '--state', 'all', '--limit', '200', '--json', 'number,title,state,labels']),
    sh('gh', ['pr', 'list', '--state', 'all', '--limit', '200', '--json', 'number,state,headRefName,mergedAt,closingIssuesReferences,statusCheckRollup']),
  ]);
  return { issues: JSON.parse(issues).map((i) => ({ ...i, labels: i.labels.map((l) => l.name) })), prs: JSON.parse(prs) };
}

// ── 단계 계산 ──────────────────────────────────────────

function ciState(pr) {
  const checks = pr.statusCheckRollup ?? [];
  if (!checks.length) return null;
  if (checks.some((c) => ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ERROR'].includes(c.conclusion ?? c.state))) return 'fail';
  return checks.every((c) => ['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(c.conclusion ?? c.state)) ? 'pass' : 'running';
}

function describe(m, { issues, prs }, reviews) {
  const mine = prs.filter((p) => p.headRefName === m.branch);
  const pr = mine.find((p) => p.state === 'OPEN') ?? mine.find((p) => p.state === 'MERGED') ?? mine[0] ?? null;
  // PR 이 닫는 Issue 가 기준. PR 전에는 미션 설명에 적힌 열린 Issue (설명에는 지나간 Issue 도 언급됨)
  const closing = (pr?.closingIssuesReferences ?? []).map((i) => i.number);
  const numbers = closing.length ? closing : m.issues.filter((n) => issues.some((i) => i.number === n && i.state === 'OPEN'));
  const linked = issues.filter((i) => numbers.includes(i.number));
  const light = linked.some((i) => i.labels.includes('light'));
  const merged = pr?.state === 'MERGED';
  const specRuns = reviews.filter((r) => r.kind === 'spec' && r.target?.includes(m.slug));
  const prRuns = pr ? reviews.filter((r) => r.kind === 'pr-check' && r.target === String(pr.number)) : [];
  const allWps = m.wps.length > 0 && m.wps.every((w) => w.done);
  const steps = [
    ['스펙', { done: m.files.has('spec.md'), who: '메인 세션' }],
    ['검토', { done: !!m.review && !m.review.includes('(2차에서 작성)'), skip: light,
      who: specRuns.some((r) => r.running) ? '검토 에이전트 실행 중' : '검토 요청 대기' }],
    ['계획', { done: m.files.has('plan.md'), skip: light, who: '사람이 지적 선택 → 메인 세션' }],
    ['작업', { done: m.files.has('tasks.md'), skip: light, who: '메인 세션' }],
    ['구현', { done: !!pr || allWps, who: '메인 세션' }],
    ['PR', { done: !!pr, who: '메인 세션' }],
    ['크로스체크', { done: prRuns.some((r) => r.done), who: prRuns.some((r) => r.running) ? '검토 에이전트 실행 중' : '검토 요청 대기' }],
    ['머지', { done: merged, who: '사람' }],
  ].map(([name, s]) => ({ name, ...s, done: merged || s.done }));
  const current = steps.find((s) => !s.done && !s.skip) ?? null;
  return { ...m, pr, numbers, light, merged, steps, current, ci: pr ? ciState(pr) : null,
    closed: pr?.state === 'CLOSED', question: linked.some((i) => i.labels.includes('needs-clarification')) };
}

// ── 화면 ───────────────────────────────────────────────

const isWide = (cp) => (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3)
  || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe6f) || (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0x1f300 && cp <= 0x1faff);
const widthOf = (s) => [...stripVTControlCharacters(s)].reduce((n, ch) => n + (isWide(ch.codePointAt(0)) ? 2 : 1), 0);

// 색 코드를 살린 채 폭에 맞춰 자름
function fit(line, w) {
  if (widthOf(line) <= w) return line;
  let out = '', used = 0;
  for (const part of line.split(/(\x1b\[[0-9;]*m)/)) {
    if (part.startsWith('\x1b')) { out += part; continue; }
    for (const ch of part) {
      const n = widthOf(ch);
      if (used + n > w - 1) return `${out}…\x1b[0m`;
      out += ch; used += n;
    }
  }
  return out;
}

const bar = (cur, max, w = 12) => {
  const n = max ? Math.min(w, Math.floor((cur * w) / max)) : 0;
  return green('█'.repeat(n)) + dim('░'.repeat(w - n));
};

// 낱말 묶음을 폭에 맞춰 여러 줄로
function wrap(tokens, w, indent) {
  const lines = [];
  let line = indent;
  for (const t of tokens) {
    if (widthOf(line) + widthOf(t) > w && line !== indent) { lines.push(line.trimEnd()); line = indent; }
    line += `${t} `;
  }
  lines.push(line.trimEnd());
  return lines;
}

const stepToken = (s, current) => {
  if (s.skip) return dim(`–${s.name}`);
  if (s.done) return green(`✓${s.name}`);
  return s === current ? bold(yellow(`●${s.name}`)) : dim(`·${s.name}`);
};
const refs = (m) => m.numbers.map((n) => `#${n}`).join(' ');

function activeLines(m, w) {
  const lines = [fit(`${yellow('●')} ${bold(m.title)} ${dim(`${refs(m)} ${m.light ? '가벼운' : '정식'}`)}`, w)];
  lines.push(...wrap(m.steps.map((s) => stepToken(s, m.current)), w, '  '));
  if (m.question) lines.push(`  ${red('⚠ 질문 대기 — 사람이 답해야 진행')}`);
  const ci = { pass: green('CI 통과'), fail: red('CI 실패'), running: yellow('CI 진행 중') }[m.ci] ?? '';
  const pr = m.pr ? `PR #${m.pr.number}${ci ? ` ${ci}` : ''} · ` : '';
  lines.push(`  ${pr}지금: ${cyan(m.current.name)} ${dim(`(${m.current.who})`)}`);
  if (m.wps.length) {
    const done = m.wps.filter((w_) => w_.done).length;
    lines.push(`  WP ${bar(done, m.wps.length)} ${done}/${m.wps.length}`);
    for (const wp of m.wps) lines.push(fit(`    ${wp.done ? green('✓') : dim('·')} ${wp.id} ${dim(wp.title)}`, w));
  } else if (m.subjects.length && !m.pr) {
    lines.push(`  브랜치 커밋 ${m.subjects.length}개`);
  }
  return lines;
}

function body(state, w) {
  const { missions, gh, reviews, ghError } = state;
  const lines = [];
  const running = reviews.filter((r) => r.running);
  if (running.length) lines.push(...running.map((r) => `${yellow('◌')} 검토 실행 중: ${r.kind} ${r.target}`), '');
  if (!gh) {
    lines.push(ghError ? red(`GitHub 정보를 못 받아 단계를 판단할 수 없음: ${ghError}`) : dim('GitHub 정보 불러오는 중…'));
    lines.push(`${dim('미션')} ${missions.length}개`);
    return lines.map((l) => fit(l, w));
  }
  const all = missions.map((m) => describe(m, gh, reviews));
  const active = all.filter((m) => !m.merged && !m.closed).sort((a, b) => a.slug.localeCompare(b.slug));
  const done = all.filter((m) => m.merged).sort((a, b) => b.pr.mergedAt.localeCompare(a.pr.mergedAt));
  const closed = all.filter((m) => m.closed);

  lines.push(bold(`진행 중 미션 ${active.length}`));
  if (!active.length) lines.push(dim('  없음'));
  active.forEach((m, i) => lines.push(...(i ? [''] : []), ...activeLines(m, w)));

  const open = gh.issues.filter((i) => i.state === 'OPEN');
  const counts = LABELS.map(([label, name]) => [name, open.filter((i) => i.labels.includes(label)).length]);
  const deployed = gh.issues.filter((i) => i.labels.includes('deployed')).length;
  lines.push('', bold('Issue'), ...wrap([...counts.map(([n, c]) => (c ? `${n} ${bold(c)}` : dim(`${n} 0`))), dim(`배포 ${deployed}`)], w, '  '));
  for (const [label, name] of LABELS) {
    for (const i of open.filter((x) => x.labels.includes(label))) {
      lines.push(fit(`  ${label === 'needs-clarification' ? red('⚠') : dim('·')} #${i.number} ${dim(name)} ${i.title.replace(/^\[[^\]]*\]\s*/, '')}`, w));
    }
  }
  const unlabeled = open.filter((i) => !LABELS.some(([l]) => i.labels.includes(l)));
  for (const i of unlabeled) lines.push(fit(`  ${dim('·')} #${i.number} ${dim('라벨 없음')} ${i.title}`, w));

  lines.push('', bold(`완료 미션 ${done.length}`));
  for (const m of done) lines.push(fit(`  ${green('✓')} ${dim(m.pr.mergedAt.slice(5, 10))} ${m.title} ${dim(`PR #${m.pr.number}`)}`, w));
  for (const m of closed) lines.push(fit(`  ${red('✗')} ${m.title} ${dim(`PR #${m.pr.number} 머지 없이 닫힘`)}`, w));
  return lines;
}

const clock = (d) => d.toTimeString().slice(0, 8);

function header(state, w) {
  const left = bold('Spec Kitty 진행 상황');
  const right = dim(clock(new Date()));
  return left + ' '.repeat(Math.max(1, w - widthOf(left) - widthOf(right))) + right;
}

// 웹 대시보드 주소 (터미널이 지원하면 OSC 8 로 클릭 가능, 아니면 글자 그대로 보임)
function linkLine(w) {
  const file = join(ROOT, '.kittify/.dashboard');
  const url = existsSync(file) ? readFileSync(file, 'utf8').split('\n')[0].trim() : '';
  if (!url) return dim('웹 대시보드 꺼짐 (spec-kitty dashboard)');
  const label = '웹 대시보드 ';
  if (widthOf(label + url) > w) return fit(cyan(url), w);
  return `${dim(label)}\x1b]8;;${url}\x1b\\${cyan(url)}\x1b]8;;\x1b\\`;
}

function footer(state, w, more) {
  const gh = state.ghError && state.gh ? red(`gh 실패(${clock(state.ghAt)} 기준)`) : state.ghAt ? dim(`gh ${clock(state.ghAt)}`) : '';
  return fit([more ? yellow('↓ 더 있음') : '', gh, dim('r 갱신 · q 종료')].filter(Boolean).join(dim(' · ')), w);
}

// ── 실행 ───────────────────────────────────────────────

const state = { missions: [], reviews: [], gh: null, ghAt: null, ghError: null };

async function refreshLocal() {
  state.missions = await loadMissions();
  state.reviews = loadReviews();
}

async function refreshGitHub() {
  try {
    state.gh = await loadGitHub();
    state.ghAt = new Date();
    state.ghError = null;
  } catch (e) {
    state.ghError = (e.stderr || e.message).trim().split('\n')[0];
  }
}

if (process.argv.includes('--once') || !process.stdout.isTTY) {
  await Promise.all([refreshLocal(), refreshGitHub()]);
  const w = Number(process.env.COLUMNS) || process.stdout.columns || 80;
  console.log(stripVTControlCharacters([header(state, w), ...body(state, w), linkLine(w), footer(state, w, false)].join('\n')));
  process.exit(0);
}

let scroll = 0;
let lastFrame = '';

function draw() {
  const { columns: cols = 80, rows = 24 } = process.stdout;
  const w = Math.max(20, cols - 1);
  const lines = body(state, w);
  const h = Math.max(1, rows - 3);
  scroll = Math.max(0, Math.min(scroll, lines.length - h));
  const visible = lines.slice(scroll, scroll + h);
  const frame = [header(state, w), ...visible, ...Array(h - visible.length).fill(''), linkLine(w), footer(state, w, scroll + h < lines.length)]
    .map((l) => `${l}\x1b[K`).join('\r\n');
  if (frame === lastFrame) return;
  lastFrame = frame;
  process.stdout.write(`\x1b[H${frame}`);
}

let leaving = false;
function leave() {
  if (leaving) return;
  leaving = true;
  process.stdout.write('\x1b[?25h\x1b[?1049l');
  process.stdin.setRawMode(false);
  process.exit(0);
}

process.stdout.write('\x1b[?1049h\x1b[?25l\x1b[2J');
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, leave);
process.stdout.on('resize', () => { lastFrame = ''; process.stdout.write('\x1b[2J'); draw(); });

const tickLocal = () => refreshLocal().then(draw, () => {});
const tickGitHub = () => refreshGitHub().then(draw);

emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (_, key = {}) => {
  const page = Math.max(1, (process.stdout.rows ?? 24) - 4);
  if (key.name === 'q' || (key.ctrl && key.name === 'c')) leave();
  else if (key.name === 'r') { tickLocal(); tickGitHub(); }
  else if (key.name === 'up' || key.name === 'k') { scroll -= 1; draw(); }
  else if (key.name === 'down' || key.name === 'j') { scroll += 1; draw(); }
  else if (key.name === 'pageup') { scroll -= page; draw(); }
  else if (key.name === 'pagedown') { scroll += page; draw(); }
});

draw();
await Promise.all([tickLocal(), tickGitHub()]);
setInterval(tickLocal, LOCAL_MS);
setInterval(tickGitHub, GH_MS);
setInterval(draw, 1_000);   // 시계
