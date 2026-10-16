import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {validateProduct,api} from '../worker/index.mjs';
test('only supplied logo and generated raster images are shipped',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/assets/image-provenance.json','utf8'));
 const approved=new Set(manifest.assets.map(x=>x.file));
 const raster=fs.readdirSync('public/assets').filter(x=>/\.(png|jpg|jpeg|webp|avif)$/i.test(x));
 assert.deepEqual(new Set(raster),approved);
 for(const x of manifest.assets)if(x.kind!=='brand-logo'){assert.equal(x.origin,'image_gen.imagegen');assert.equal(x.reference_images_used,false)}
 for(const name of ['editorial.jpg','reference-hero.jpg',...Array.from({length:8},(_,i)=>'product-'+i+'.webp')])assert.equal(fs.existsSync('public/assets/'+name),false);
 const html=fs.readFileSync('src/pages/home/HomePage.jsx','utf8');assert.ok(html.includes('/assets/ai-autumn-model.png'));assert.ok(html.includes('/assets/ai-textile-closeup.png'));assert.ok(!html.includes('/assets/editorial.jpg'));
});
test('administrator cannot choose removed photography',()=>{
 const p={name:'상품',sub:'',price:10000,stock:20,category:'SHIRTS',tag:'NEW',colors:['#aabbcc'],image:'/assets/product-0.webp'};
 assert.throws(()=>validateProduct(p));assert.doesNotThrow(()=>validateProduct({...p,image:'/assets/hanger-shirt.png'}));
});
test('legacy database image paths normalize to generated images',async()=>{
 const rows=[{id:0,name:'기존 상품',image:'/assets/product-0.webp',colors:'["#aabbcc"]'},{id:8,name:'셔츠',image:'/assets/hanger-shirt.png',colors:'["#aabbcc"]'}];
 const DB={prepare(sql){return {bind(){return this},async first(){return {n:2}},async all(){return {results:rows}}}}};
 const response=await api(new Request('https://closefit.test/api/products'),{DB});
 const body=await response.json();assert.equal(body.products[0].image,'/assets/hanger-catalog.png');assert.equal(body.products[1].image,'/assets/hanger-shirt.png');
});
