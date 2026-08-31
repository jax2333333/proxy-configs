import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const upstream = {
  repo: 'cmliu/edgetunnel',
  commit: 'fb3212257e3527447d7368010b378f7e449444b4',
  workerPath: '_worker.js',
  workerGitBlobSha: '551bdc740a920b63279da9111f9f6058cb684147',
  licensePath: 'LICENSE',
  licenseGitBlobSha: 'd159169d1050894d3ea3b98e1c965c4058208fe1',
};

function gitBlobSha(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`);
  return createHash('sha1').update(header).update(bytes).digest('hex');
}

async function downloadPinned(path, expectedBlobSha) {
  const url = `https://raw.githubusercontent.com/${upstream.repo}/${upstream.commit}/${path}`;
  const response = await fetch(url, {
    headers: { 'user-agent': 'jax-cf-edgetunnel-builder/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${path}: HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const actualBlobSha = gitBlobSha(bytes);
  if (actualBlobSha !== expectedBlobSha) {
    throw new Error(
      `${path} integrity check failed: expected ${expectedBlobSha}, got ${actualBlobSha}`,
    );
  }
  return bytes;
}

await mkdir('dist', { recursive: true });

const worker = await downloadPinned(upstream.workerPath, upstream.workerGitBlobSha);
const license = await downloadPinned(upstream.licensePath, upstream.licenseGitBlobSha);

await writeFile('dist/_worker.js', worker);
await writeFile('dist/LICENSE', license);

console.log(`Pinned upstream: ${upstream.repo}@${upstream.commit}`);
console.log(`Verified _worker.js Git blob: ${upstream.workerGitBlobSha}`);
console.log('Cloudflare Pages output written to dist/');
