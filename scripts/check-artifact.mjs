import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root='dist/client',html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const base=process.env.CLOSEFIT_BASE_PATH||'/';
assert.match(html,/id="root"/);const bundles=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(x=>x[1]);assert.equal(bundles.length,2);
for(const url of bundles){assert.ok(url.startsWith(base+'assets/'),url);assert.ok(fs.statSync(path.join(root,url.slice(base.length))).size>100)}
for(const name of ['closefit-logo.png','ai-autumn-model.png','ai-textile-closeup.png','hanger-shirt.png','hanger-catalog.png','image-provenance.json'])assert.ok(fs.statSync(path.join(root,'assets',name)).size>100);
const bundle=fs.readFileSync(path.join(root,bundles.find(x=>x.endsWith('.js')).slice(base.length)),'utf8');
assert.ok(bundle.includes('closefit-demo-v1'));assert.ok(!bundle.includes('/signin-with-chatgpt'));assert.ok(!bundle.includes('/signout-with-chatgpt'));
for(const name of ['editorial.jpg','reference-hero.jpg',...Array.from({length:8},(_,i)=>'product-'+i+'.webp')])assert.equal(fs.existsSync(path.join(root,'assets',name)),false);
assert.equal(fs.existsSync(path.join(root,'.local')),false);assert.equal(fs.existsSync(path.join(root,'worker')),false);
console.log('Static portfolio: deploy base, hashed bundles, mock API and approved images passed.');
