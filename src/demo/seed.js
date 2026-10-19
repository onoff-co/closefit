import {initialProducts} from '../../worker/catalog.mjs';
export const demoCustomerId='demo-customer';
export const demoAdminId='demo-admin';
const stamp=(offset=0)=>new Date(Date.now()-offset*86400000).toISOString().slice(0,19).replace('T',' ');
export function createDemoData(){
 const products=initialProducts.map(p=>({...p,image:p.id===8?'/assets/hanger-shirt.png':'/assets/hanger-catalog.png',stock:50,active:1,updated_at:stamp()}));
 const members=[{id:demoCustomerId,name:'김클로',email:'customer@example.test',created_at:stamp(14)},{id:demoAdminId,name:'관리자',email:'admin@example.test',created_at:stamp(30)},{id:'demo-member-2',name:'이핏',email:'member@example.test',created_at:stamp(7)}];
 const statuses=['paid','shipping','completed','pending','cancelled','paid'];
 const orders=statuses.map((status,i)=>{const p=products[(i+2)%products.length];return {id:'demo-order-'+(i+1),user_id:i<4?demoCustomerId:'demo-member-2',customer:i<4?'김클로':'이핏',email:i<4?'customer@example.test':'member@example.test',items:[{id:p.id,name:p.name,price:p.price,color:p.colors[0],size:'L',qty:1}],total:p.price,status,note:'',created_at:stamp(i),updated_at:stamp(i)}});
 const visits=Array.from({length:14},(_,i)=>({id:'sample-visit-'+i,visitor:'sample-visitor-'+i,path:i%2?'/shop':'/',device:i%3?'mobile':'desktop',created_at:stamp(i),sample:true,views:32+(i*17)%63,visitors:20+(i*7)%30}));
 return {version:1,session:null,products,members,orders,visits,audit:[{id:'sample-audit',actor:demoAdminId,action:'demo.initialized',target:'portfolio',created_at:stamp()}],payments:{}};
}
