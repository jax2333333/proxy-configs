import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srRoot = path.join(root, 'shadowrocket');
const moduleDir = path.join(srRoot, 'toolkit', 'modules');
const scriptDir = path.join(srRoot, 'toolkit', 'scripts');
const toolkitReadmePath = path.join(srRoot, 'toolkit', 'README.md');
const mobilePath = path.join(srRoot, 'Jax-shadowrocket-v6.conf');
const homePath = path.join(srRoot, 'Jax-shadowrocket-home-clean.conf');

const errors = [];
const notes = [];

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    errors.push(`缺少或无法读取文件: ${rel(file)} (${error.message})`);
    return '';
  }
}

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out.sort();
}

function activeLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assignment(text, key) {
  const re = new RegExp(`^${escapeRegExp(key)}\\s*=\\s*(.*)$`);
  for (const line of activeLines(text)) {
    const match = line.match(re);
    if (match) return match[1].trim();
  }
  return null;
}

function expectAssignment(text, key, expected, label) {
  const actual = assignment(text, key);
  if (actual !== expected) {
    errors.push(`${label}: ${key} 应为 "${expected}"，当前为 ${actual === null ? '缺失' : `"${actual}"`}`);
  }
}

function forbidAssignment(text, key, label) {
  const actual = assignment(text, key);
  if (actual !== null) errors.push(`${label}: 不应存在 ${key}，当前值为 "${actual}"`);
}

function hasNormalizedLine(text, expected) {
  const target = expected.replace(/\s+/g, '');
  return activeLines(text).some((line) => line.replace(/\s+/g, '') === target);
}

const mobile = read(mobilePath);
const home = read(homePath);
const toolkitReadme = read(toolkitReadmePath);

// 1) 正式配置长期不变量：Mobile。
expectAssignment(mobile, 'ipv6', 'false', 'Mobile');
expectAssignment(mobile, 'prefer-ipv6', 'false', 'Mobile');
expectAssignment(mobile, 'dns-direct-system', 'false', 'Mobile');
expectAssignment(mobile, 'dns-fallback-system', 'false', 'Mobile');
expectAssignment(mobile, 'dns-direct-fallback-proxy', 'false', 'Mobile');
expectAssignment(mobile, 'hijack-dns', ':53', 'Mobile');
expectAssignment(mobile, 'udp-policy-not-supported-behaviour', 'REJECT', 'Mobile');
expectAssignment(
  mobile,
  'update-url',
  'https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-v6.conf',
  'Mobile',
);
if (!hasNormalizedLine(mobile, 'FINAL,🚀 策略选择')) {
  errors.push('Mobile: 最终兜底必须保持 FINAL,🚀 策略选择');
}
const tiktokIndex = mobile.indexOf('DOMAIN-SUFFIX,tiktok.com,🎵 TikTok');
const douyinIndex = mobile.indexOf('DOMAIN-SUFFIX,amemv.com,🌐 全球直连');
if (tiktokIndex < 0 || douyinIndex < 0 || tiktokIndex >= douyinIndex) {
  errors.push('Mobile: TikTok 明确规则必须位于抖音 amemv.com DIRECT 规则之前');
}

// 2) 正式配置长期不变量：Home Clean。
expectAssignment(home, 'ipv6', 'false', 'Home Clean');
expectAssignment(home, 'prefer-ipv6', 'false', 'Home Clean');
expectAssignment(home, 'dns-server', 'system', 'Home Clean');
expectAssignment(home, 'fallback-dns-server', 'system', 'Home Clean');
expectAssignment(
  home,
  'update-url',
  'https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-home-clean.conf',
  'Home Clean',
);
forbidAssignment(home, 'hijack-dns', 'Home Clean');
forbidAssignment(home, 'direct-dns-server', 'Home Clean');
forbidAssignment(home, 'proxy-dns-server', 'Home Clean');
if (/^\s*\[Proxy Group\]\s*$/mi.test(home)) {
  errors.push('Home Clean: 不应包含 [Proxy Group]');
}
if (!hasNormalizedLine(home, 'FINAL,DIRECT')) {
  errors.push('Home Clean: 最终兜底必须保持 FINAL,DIRECT');
}
const homeExcluded = assignment(home, 'tun-excluded-routes') || '';
if (homeExcluded.split(',').map((item) => item.trim()).includes('198.18.0.0/15')) {
  errors.push('Home Clean: tun-excluded-routes 禁止加入 198.18.0.0/15');
}

// 3) Toolkit 数量与 README 必须同步。
const moduleFiles = walk(moduleDir, (file) => /\.(?:sgmodule|module)$/.test(file));
const scriptFiles = walk(scriptDir, (file) => file.endsWith('.js'));
const countMatch = toolkitReadme.match(/当前共\s*\*\*(\d+)\s*个模块\*\*、\*\*(\d+)\s*个脚本\*\*/);
if (!countMatch) {
  errors.push('Toolkit README: 找不到“当前共 **N 个模块**、**N 个脚本**”统计行');
} else {
  const documentedModules = Number(countMatch[1]);
  const documentedScripts = Number(countMatch[2]);
  if (documentedModules !== moduleFiles.length) {
    errors.push(`Toolkit README: 模块统计为 ${documentedModules}，实际为 ${moduleFiles.length}`);
  }
  if (documentedScripts !== scriptFiles.length) {
    errors.push(`Toolkit README: 脚本统计为 ${documentedScripts}，实际为 ${scriptFiles.length}`);
  }
}

// 4) 模块名称唯一、禁止全局 MITM、禁止把本机 CA 材料写入仓库运行文件。
const moduleNames = new Map();
for (const file of moduleFiles) {
  const text = read(file);
  const nameMatch = text.match(/^#!name\s*=\s*(.+)$/m);
  if (!nameMatch) {
    errors.push(`${rel(file)}: 缺少 #!name=`);
  } else {
    const name = nameMatch[1].trim();
    if (moduleNames.has(name)) {
      errors.push(`${rel(file)}: 模块名称与 ${rel(moduleNames.get(name))} 重复: ${name}`);
    } else {
      moduleNames.set(name, file);
    }
  }

  for (const line of activeLines(text)) {
    const match = line.match(/^hostname\s*=\s*(.*)$/i);
    if (!match) continue;
    const value = match[1].replace(/^%APPEND%\s*/i, '');
    const hosts = value.split(',').map((host) => host.trim()).filter(Boolean);
    if (hosts.includes('*')) errors.push(`${rel(file)}: 禁止 hostname=* 全局 MITM`);
  }

  if (/^\s*ca-(?:p12|passphrase)\s*=/mi.test(text)) {
    errors.push(`${rel(file)}: 仓库模块禁止包含 ca-p12 / ca-passphrase，本机证书必须仅保存在设备内`);
  }
}

for (const file of [mobilePath, homePath]) {
  const text = read(file);
  if (/^\s*ca-(?:p12|passphrase)\s*=/mi.test(text)) {
    errors.push(`${rel(file)}: 正式配置禁止包含 ca-p12 / ca-passphrase`);
  }
}

// 5) 仓库自托管 Raw 引用必须能映射到当前 checkout 中的真实文件。
const runtimeFiles = [
  mobilePath,
  homePath,
  ...walk(path.join(srRoot, 'rules'), (file) => file.endsWith('.list')),
  ...moduleFiles,
  ...scriptFiles,
];
const ownRawPrefix = 'https://raw.githubusercontent.com/jax2333333/proxy-configs/main/';
const ownRawRegex = /https:\/\/raw\.githubusercontent\.com\/jax2333333\/proxy-configs\/main\/([^\s,)'"<>]+)/g;
for (const file of runtimeFiles) {
  const text = read(file);
  for (const match of text.matchAll(ownRawRegex)) {
    const referenced = match[1].replace(/[?#].*$/, '');
    const local = path.join(root, referenced);
    if (!fs.existsSync(local)) {
      errors.push(`${rel(file)}: 自托管 Raw 引用不存在 -> ${referenced}`);
    }
  }

  // Toolkit 的远程 script-path 必须继续使用本仓库自托管脚本。
  if (moduleFiles.includes(file)) {
    for (const line of activeLines(text)) {
      const scriptMatch = line.match(/(?:^|,)script-path=(https?:\/\/[^,\s]+)/i);
      if (scriptMatch && !scriptMatch[1].startsWith(ownRawPrefix)) {
        errors.push(`${rel(file)}: script-path 必须自托管，发现外部脚本 ${scriptMatch[1]}`);
      }
    }
  }
}

notes.push('正式配置: 2');
notes.push(`Toolkit 模块: ${moduleFiles.length}`);
notes.push(`Toolkit 脚本: ${scriptFiles.length}`);
notes.push(`模块 #!name 唯一数: ${moduleNames.size}`);

console.log('JAX Shadowrocket CI');
for (const note of notes) console.log(`  ✓ ${note}`);

if (errors.length > 0) {
  console.error(`\n发现 ${errors.length} 个问题:`);
  errors.forEach((error, index) => console.error(`  ${index + 1}. ${error}`));
  process.exit(1);
}

console.log('\n✓ 所有 Shadowrocket 自动检查通过。');
