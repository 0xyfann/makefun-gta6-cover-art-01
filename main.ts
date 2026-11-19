import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(output, { recursive: true });
cpSync(resolve(root, 'app'), resolve(output, 'app'), { recursive: true });
cpSync(resolve(root, 'screenshots'), resolve(output, 'screenshots'), { recursive: true });
const dossierBytes = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
if (dossierBytes.byteLength > 1572864) throw new Error('Dossier exceeds the 1.5 MiB competition limit');
writeFileSync(resolve(output, 'dossier.json'), dossierBytes);
console.log(`Afterglow dossier ready: ${dossierBytes.byteLength} bytes`);
