import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier, readAppTree } from '../vendor/makefun-app.ts';

const caps={text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},app_max_files:993,app_max_bytes:50331648};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function manifest(directory,prefix='') {
  return readdirSync(directory).sort().flatMap(name=>{
    const location=join(directory,name),relative=prefix+name;
    assert(!lstatSync(location).isSymbolicLink());
    return statSync(location).isDirectory()?manifest(location,relative+'/'):[{path:relative,bytes:statSync(location).size,sha256:digest(readFileSync(location))}];
  });
}
const tree=readAppTree('out/app',caps);
assert(statSync('out/app/index.html').size<=1048576);
const dossier=readFileSync('out/dossier.json');
assert.deepEqual(dossier,Buffer.from(buildDossier('out',caps)));
assert(dossier.length<=1572864);
const decoded=JSON.parse(dossier);
assert.equal(decoded.cover,0);assert.equal(decoded.images.length,4);
const files=manifest('out');
assert(files.length<=1000);assert(files.reduce((sum,file)=>sum+file.bytes,0)<=67108864);
const report={appFiles:tree.files.length,appDirectories:tree.directories.length,appEntries:tree.count,appBytes:tree.totalBytes,indexBytes:statSync('out/app/index.html').size,dossierBytes:dossier.length,dossierSha256:digest(dossier),cover:decoded.cover,images:decoded.images.length,outputFiles:files.length,outputBytes:files.reduce((sum,file)=>sum+file.bytes,0)};
mkdirSync('.verification/verification',{recursive:true});
if(process.argv.includes('--baseline'))writeFileSync('.verification/verification/first-build-manifest.json',JSON.stringify(files,null,2)+'\n');
else {
  assert.deepEqual(files,JSON.parse(readFileSync('.verification/verification/first-build-manifest.json','utf8')));
  report.byteIdenticalAcrossRuns=true;
  writeFileSync('.verification/verification/output-results.json',JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
