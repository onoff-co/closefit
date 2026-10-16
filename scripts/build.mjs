import fs from 'node:fs';import path from 'node:path';import {build} from 'vite';
await build();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json'};
const assets={};
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else assets['/'+path.relative('dist/client',file).replaceAll('\\','/')]=[mime[path.extname(file)]||'application/octet-stream',fs.readFileSync(file).toString('base64')]}}
walk('dist/client');
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
const server=fs.readFileSync('worker/index.mjs','utf8').replace("import { initialProducts } from './catalog.mjs';",fs.readFileSync('worker/catalog.mjs','utf8').replace('export const','const'));
fs.writeFileSync('dist/server/index.js','const ASSETS = '+JSON.stringify(assets)+';\n'+server);
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built React client and CLOSEFIT Worker with '+Object.keys(assets).length+' local assets.');
