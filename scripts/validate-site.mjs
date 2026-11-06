import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const baseUrl = 'https://samersaada1996.github.io/SummitQuizLegal';
const failures = [];

async function load(relativePath) {
  try {
    return await readFile(resolve(root, relativePath), 'utf8');
  } catch (error) {
    failures.push(`${relativePath}: ${error.code ?? error.message}`);
    return '';
  }
}

function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) failures.push(label);
}

function forbidMatch(source, pattern, label) {
  if (pattern.test(source)) failures.push(label);
}

const routes = [
  ['index.html', `${baseUrl}/`],
  ['privacy/index.html', `${baseUrl}/privacy/`],
  ['terms/index.html', `${baseUrl}/terms/`],
  ['support/index.html', `${baseUrl}/support/`],
];

for (const [file, canonical] of routes) {
  const html = await load(file);
  if (!html) continue;

  requireMatch(html, /<html\b[^>]*\blang="ar"[^>]*\bdir="rtl"/i, `${file}: Arabic RTL document root missing`);
  requireMatch(html, /<main\b/i, `${file}: semantic main landmark missing`);
  requireMatch(html, /data-language-switch/i, `${file}: keyboard language switch missing`);
  requireMatch(html, /data-lang-panel="ar"(?![^>]*\bhidden\b)/i, `${file}: visible Arabic panel missing`);
  requireMatch(html, /data-lang-panel="en"[^>]*\bhidden\b/i, `${file}: progressive English panel missing`);
  requireMatch(html, new RegExp(`<link[^>]+rel="canonical"[^>]+href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'), `${file}: canonical URL mismatch`);
  requireMatch(html, /href="\/SummitQuizLegal\/privacy\/"/i, `${file}: privacy navigation missing`);
  requireMatch(html, /href="\/SummitQuizLegal\/terms\/"/i, `${file}: terms navigation missing`);
  requireMatch(html, /href="\/SummitQuizLegal\/support\/"/i, `${file}: support navigation missing`);
  requireMatch(html, /src="\/SummitQuizLegal\/assets\/site\.js"/i, `${file}: local site script missing`);
  forbidMatch(html, /<script\b[^>]*\bsrc="https?:\/\//i, `${file}: remote executable script is forbidden`);
  forbidMatch(html, /googletag|fundingchoices|doubleclick|google-analytics|googletagmanager|\bgtag\s*\(/i, `${file}: tracking or consent tag is forbidden`);
}

const [home, privacy, terms, support, styles, script] = await Promise.all([
  load('index.html'),
  load('privacy/index.html'),
  load('terms/index.html'),
  load('support/index.html'),
  load('assets/styles.css'),
  load('assets/site.js'),
]);

requireMatch(home, /مركز الخصوصية والدعم/i, 'index.html: Arabic hub heading missing');
requireMatch(home, /Privacy (?:&amp;|&) Support Center/i, 'index.html: English hub heading missing');

for (const [needle, label] of [
  [/Google UMP/i, 'privacy/index.html: Google UMP disclosure missing'],
  [/AdMob/i, 'privacy/index.html: AdMob disclosure missing'],
  [/RevenueCat/i, 'privacy/index.html: RevenueCat disclosure missing'],
  [/مسح بيانات التطبيق/i, 'privacy/index.html: Arabic deletion guidance missing'],
  [/clear app data/i, 'privacy/index.html: English deletion guidance missing'],
]) requireMatch(privacy, needle, label);

requireMatch(terms, /لعبة مستقلة/i, 'terms/index.html: Arabic independent-game term missing');
requireMatch(terms, /independent game/i, 'terms/index.html: English independent-game term missing');
requireMatch(support, /samer\.s3da@gmail\.com/i, 'support/index.html: support email missing');
requireMatch(support, /استعادة المشتريات/i, 'support/index.html: Arabic purchase support missing');
requireMatch(support, /Restore purchases/i, 'support/index.html: English purchase support missing');
requireMatch(styles, /\[dir="rtl"\]/i, 'assets/styles.css: RTL-specific styling missing');
requireMatch(script, /document\.documentElement\.dir/i, 'assets/site.js: document direction update missing');
forbidMatch(script, /fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/i, 'assets/site.js: network behavior is forbidden');

if (failures.length) {
  console.error(`Static-site validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Static-site validation passed (${routes.length} routes).`);
