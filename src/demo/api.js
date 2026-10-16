import {createDemoData,demoCustomerId,demoAdminId} from './seed.js';
const KEY='closefit-demo-v1';let memory;
const clone=value=>structuredClone(value);
const now=()=>new Date().toISOString().slice(0,19).replace('T',' ');
const id=()=>crypto.randomUUID();
const fail=(status,message)=>{const e=Error(message);e.status=status;throw e};
function load(){try{const raw=localStorage.getItem(KEY);if(raw){const value=JSON.parse(raw);if(value.version===1&&Array.isArray(value.products)&&Array.isArray(value.members)&&Array.isArray(value.orders)&&Array.isArray(value.visits)&&Array.isArray(value.audit))return value}}catch{}return memory?clone(memory):createDemoData()}
function save(data){memory=clone(data);try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
function member(data){return data.members.find(m=>m.id===data.session)}
function account(data){const profile=member(data);return profile?{id:profile.id,email:profile.email,admin:profile.id===demoAdminId,profile:clone(profile)}:null}
function requireUser(data){const user=account(data);if(!user)fail(401,'체험 계정으로 로그인해주세요.');return user}
function requireAdmin(data){const user=requireUser(data);if(!user.admin)fail(403,'관리자 체험 계정으로 전환해주세요.');return user}
function log(data,action,target){data.audit.unshift({id:id(),actor:data.session,action,target:String(target),created_at:now()})}
export function resetDemo(){memory=undefined;for(const key of [KEY,'closefit-cart','closefit-wish','closefit-visitor','onoff-cart','onoff-wish'])try{localStorage.removeItem(key)}catch{}save(createDemoData())}
export function setDemoSession(role){const data=load();data.session=role==='admin'?demoAdminId:role==='customer'?demoCustomerId:null;if(data.session&&!member(data)){const original=createDemoData().members.find(m=>m.id===data.session);data.members.push(original)}save(data);return account(data)}
export async function demoRequest(path,method='GET',body,options={}){
 if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
 const data=load();let result;const write=method!=='GET';
 if(path==='/api/me'&&method==='GET')result={user:account(data)};
 else if(path==='/api/demo/login'&&method==='POST'){if(!['customer','admin'].includes(body?.role))fail(422,'체험 계정을 선택해주세요.');return {user:setDemoSession(body.role)}}
 else if(path==='/api/demo/logout'&&method==='POST'){data.session=null;result={ok:true}}
 else if(path==='/api/profile'&&method==='POST'){
  const name=typeof body?.name==='string'?body.name.trim().slice(0,40):'';if(!name||body.consent!==true)fail(422,'닉네임과 데모 데이터 저장 동의를 확인해주세요.');
  let profile=member(data);if(profile)profile.name=name;else{profile={id:id(),name,email:'guest-'+id().slice(0,8)+'@example.test',created_at:now()};data.members.push(profile);data.session=profile.id}result={ok:true};
 }
 else if(path==='/api/products'&&method==='GET')result={products:data.products.filter(p=>p.active)};
 else if(path==='/api/visits'&&method==='POST'){if(typeof body?.path==='string'&&body.path.startsWith('/')&&typeof body.visitor==='string'){const key=new Date().toISOString().slice(0,10)+':'+body.visitor+':'+body.path;if(!data.visits.some(v=>v.id===key))data.visits.push({id:key,visitor:body.visitor,path:body.path,device:body.device||'desktop',created_at:now()})}result={ok:true}}
 else if(path==='/api/orders'){
  const user=requireUser(data);
  if(method==='GET')result={orders:data.orders.filter(o=>o.user_id===user.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))};
  else if(method==='POST'){
   const key=body?.paymentId;if(typeof key!=='string'||key.length<8)fail(422,'결제를 다시 확인해주세요.');data.payments||={};
   if(data.payments[key]){const prior=data.orders.find(o=>o.id===data.payments[key]&&o.user_id===user.id);if(!prior)fail(409,'결제 식별자를 다시 생성해주세요.');return clone(prior)}
   if(!['card','transfer'].includes(body.method)||!Array.isArray(body.items)||!body.items.length||body.items.length>20)fail(422,'결제 정보를 확인해주세요.');
   const quantities=new Map();
   const items=body.items.map(x=>{const p=data.products.find(p=>p.id===x.id&&p.active);if(!p||!Number.isInteger(x.qty)||x.qty<1||x.qty>99||!['M','L','XL'].includes(x.size)||!p.colors.includes(x.color))fail(422,'상품 옵션을 확인해주세요.');const quantity=(quantities.get(p.id)||0)+x.qty;quantities.set(p.id,quantity);if(quantity>p.stock)fail(409,'상품의 예시 재고가 부족합니다.');return {id:p.id,name:p.name,price:p.price,color:x.color,size:x.size,qty:x.qty}});
   const order={id:id(),user_id:user.id,customer:user.profile.name,email:user.email,items,total:items.reduce((sum,x)=>sum+x.price*x.qty,0),status:'paid',note:'포트폴리오 가상 결제 · '+(body.method==='card'?'카드':'계좌이체'),created_at:now(),updated_at:now()};
   for(const [pid,qty] of quantities)data.products.find(p=>p.id===pid).stock-=qty;
   data.orders.unshift(order);data.payments[key]=order.id;result=order;
  }else fail(405,'지원하지 않는 요청입니다.');
 }
 else if(path.startsWith('/api/admin/')){
  requireAdmin(data);
  if(path==='/api/admin/dashboard'&&method==='GET'){
   const series=Array.from({length:14},(_,i)=>{const day=new Date(Date.now()-(13-i)*86400000).toISOString().slice(0,10),visits=data.visits.filter(v=>v.created_at.startsWith(day));return {day,views:visits.reduce((n,v)=>n+(v.sample?v.views:1),0),visitors:visits.reduce((n,v)=>n+(v.sample?v.visitors:1),0)}});
   result={stats:{orders:data.orders.length,revenue:data.orders.filter(o=>['paid','shipping','completed'].includes(o.status)).reduce((n,o)=>n+o.total,0),pending:data.orders.filter(o=>o.status==='pending').length,members:data.members.length,views:series.reduce((n,x)=>n+x.views,0),visitors:series.reduce((n,x)=>n+x.visitors,0)},series};
  }else if(path==='/api/admin/visits'&&method==='GET')result={visits:[...data.visits].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,200)};
  else if(path==='/api/admin/audit'&&method==='GET')result={logs:data.audit.slice(0,200)};
  else{
   const match=path.match(/^\/api\/admin\/(products|orders|members)(?:\/([^/]+))?$/);if(!match)fail(404,'데모 항목을 찾을 수 없습니다.');
   const [,kind,rawId]=match,key=rawId?decodeURIComponent(rawId):null,list=data[kind],index=key===null?-1:list.findIndex(x=>String(x.id)===key);
   if(method==='GET'&&key===null)result={[kind]:kind==='products'?[...list].sort((a,b)=>b.id-a.id):list};
   else if(method==='POST'&&key===null&&kind==='products'){
    const p=validateProduct(body);p.id=Math.max(-1,...list.map(p=>p.id))+1;p.active=1;p.updated_at=now();list.push(p);log(data,'product.create',p.id);result={id:p.id};
   }else if(method==='POST'&&key===null&&kind==='orders'){
    if(!body?.customer?.trim()||!Number.isInteger(body.total)||body.total<0||!validStatus(body.status)||!/^.+@.+\..+$/.test(body.email||''))fail(422,'예시 주문 정보를 확인해주세요.');
    const order={id:id(),user_id:null,customer:body.customer.slice(0,40),email:body.email.slice(0,150),items:[],total:body.total,status:body.status,note:String(body.note||'').slice(0,500),created_at:now(),updated_at:now()};list.unshift(order);log(data,'order.create',order.id);result={id:order.id};
   }else if(['PATCH','DELETE'].includes(method)&&key!==null){
    if(index<0)fail(404,'항목이 없습니다.');const row=list[index];
    if(method==='PATCH'){
     if(kind==='products')Object.assign(row,validateProduct(body),{active:body.active===false?0:1,updated_at:now()});
     else if(kind==='orders'){if(!validStatus(body.status))fail(422,'주문 상태를 확인해주세요.');Object.assign(row,{status:body.status,note:String(body.note||'').slice(0,500),updated_at:now()})}
     else{const name=String(body.name||'').trim().slice(0,40);if(!name)fail(422,'이름을 입력해주세요.');row.name=name}
    }else if(kind==='products')row.active=0;
    else if(kind==='orders'){if(row.status!=='cancelled')fail(409,'취소된 예시 주문만 삭제할 수 있습니다.');list.splice(index,1)}
    else{if(row.id===demoAdminId)fail(409,'관리자 체험 계정은 유지됩니다.');list.splice(index,1);for(const order of data.orders)if(order.user_id===row.id)order.user_id=null;if(data.session===row.id)data.session=null}
    log(data,kind.slice(0,-1)+'.'+method.toLowerCase(),key);result={ok:true};
   }else fail(405,'지원하지 않는 요청입니다.');
  }
 }else fail(404,'데모 요청을 찾을 수 없습니다.');
 if(write)save(data);return clone(result);
}
function validStatus(s){return ['pending','paid','shipping','completed','cancelled'].includes(s)}
function validateProduct(body){
 const p={name:String(body?.name||'').trim().slice(0,100),sub:String(body?.sub||'').slice(0,250),price:body?.price,stock:body?.stock,category:body?.category,tag:String(body?.tag||'NEW').slice(0,20),colors:body?.colors,image:body?.image};
 if(!p.name||!Number.isInteger(p.price)||p.price<0||p.price>10000000||!Number.isInteger(p.stock)||p.stock<0||p.stock>1000000||!['OUTER','TOP','SHIRTS','PANTS','SUIT','SHOES','BAG & ACC'].includes(p.category)||!Array.isArray(p.colors)||!p.colors.length||p.colors.length>10||p.colors.some(c=>!/^#[a-f0-9]{6}$/i.test(c))||!['/assets/hanger-shirt.png','/assets/hanger-catalog.png'].includes(p.image))fail(422,'상품 정보를 확인해주세요.');return p;
}
