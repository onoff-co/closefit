import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/index.mjs';
export function createLocalDatabase(directory=path.resolve('.local')){
 fs.mkdirSync(directory,{recursive:true});
 const connection=new DatabaseSync(path.join(directory,'closefit.sqlite'));
 connection.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS __local_migrations (name TEXT PRIMARY KEY);');
 for(const name of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort()){
  if(connection.prepare('SELECT name FROM __local_migrations WHERE name=?').get(name))continue;
  connection.exec('BEGIN');try{connection.exec(fs.readFileSync(path.join('drizzle',name),'utf8'));connection.prepare('INSERT INTO __local_migrations (name) VALUES (?)').run(name);connection.exec('COMMIT')}catch(error){connection.exec('ROLLBACK');throw error}
 }
 const prepare=sql=>({args:[],bind(...values){this.args=values;return this},async first(){return connection.prepare(sql).get(...this.args)||null},async all(){return {results:connection.prepare(sql).all(...this.args)}},async run(){const result=connection.prepare(sql).run(...this.args);return {meta:{changes:result.changes,last_row_id:Number(result.lastInsertRowid)}}}});
 return {prepare,async batch(statements){connection.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());connection.exec('COMMIT');return results}catch(error){connection.exec('ROLLBACK');throw error}},close:()=>connection.close()};
}
function safeReturn(value){if(!value||!value.startsWith('/')||value.startsWith('//'))return '/account';const url=new URL(value,'http://local.test');return url.origin==='http://local.test'&&!['/signin-with-chatgpt','/signout-with-chatgpt'].includes(url.pathname)?url.pathname+url.search:'/account'}
export function localApi(){
 let database;
 function install(server){
  database??=createLocalDatabase();
  server.middlewares.use(async(req,res,next)=>{
   const url=new URL(req.url,'http://'+req.headers.host);
   if(['/signin-with-chatgpt','/signout-with-chatgpt'].includes(url.pathname)){
    const login=url.pathname==='/signin-with-chatgpt';
    res.statusCode=302;res.setHeader('Set-Cookie','closefit-local-auth='+(login?'1':'')+'; HttpOnly; SameSite=Lax; Path=/'+(login?'':'; Max-Age=0'));
    res.setHeader('Location',safeReturn(url.searchParams.get('return_to')));res.end();return;
   }
   if(!url.pathname.startsWith('/api/')){next();return}
   try{
    const headers=new Headers();for(const [name,value] of Object.entries(req.headers))if(value&&!name.startsWith('oai-authenticated-'))headers.set(name,Array.isArray(value)?value.join(', '):value);
    const email='developer@closefit.test';
    if(/(?:^|;\s*)closefit-local-auth=1(?:;|$)/.test(req.headers.cookie||'')){headers.set('oai-authenticated-user-id','local-developer');headers.set('oai-authenticated-user-email',email)}
    const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>30000){res.statusCode=413;res.end(JSON.stringify({error:'요청이 너무 큽니다.'}));return}chunks.push(chunk)}
    const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
    const response=await worker.fetch(request,{DB:database,ADMIN_EMAIL:email},{});
    res.statusCode=response.status;for(const [name,value] of response.headers)res.setHeader(name,value);res.end(Buffer.from(await response.arrayBuffer()));
   }catch(error){console.error('Local API error:',error.message);res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'로컬 API 요청을 처리하지 못했습니다.'}))}
  });
 }
 return {name:'closefit-local-api',configureServer:install,configurePreviewServer:install};
}
