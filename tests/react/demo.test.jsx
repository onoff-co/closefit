import {beforeEach,it,expect,vi} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import App from '../../src/App.jsx';
import {StoreProvider} from '../../src/state/StoreContext.jsx';
import {demoRequest as request,resetDemo,setDemoSession} from '../../src/demo/api.js';
beforeEach(()=>resetDemo());
const mount=route=>render(<MemoryRouter initialEntries={[route]}><StoreProvider><App/></StoreProvider></MemoryRouter>);
it('uses no network and preserves mock identity after logout/login',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch');expect((await request('/api/me')).user).toBeNull();
 await request('/api/demo/login','POST',{role:'customer'});
 expect((await request('/api/me')).user.profile.name).toBe('김클로');
 await expect(request('/api/admin/products')).rejects.toMatchObject({status:403});
 await request('/api/demo/logout','POST');expect((await request('/api/me')).user).toBeNull();
 await expect(request('/api/orders')).rejects.toMatchObject({status:401});expect(fetch).not.toHaveBeenCalled();
});
it('registers a guest with a generated example email and persists its session',async()=>{
 await request('/api/profile','POST',{name:'체험고객',consent:true});
 const user=(await request('/api/me')).user;expect(user.profile.name).toBe('체험고객');expect(user.email).toMatch(/@example.test$/);
 expect(JSON.parse(localStorage.getItem('closefit-demo-v1')).session).toBe(user.id);
});
it('validates payment atomically, calculates prices, and prevents duplicate charges',async()=>{
 setDemoSession('customer');const p=(await request('/api/products')).products[8],items=[{id:p.id,qty:2,size:'L',color:p.colors[0],price:1}];
 await expect(request('/api/orders','POST',{items:[...items,{...items[0],qty:99}],method:'card',paymentId:'invalid-payment'})).rejects.toMatchObject({status:409});
 expect((await request('/api/products')).products[8].stock).toBe(50);
 const input={items,method:'card',paymentId:'payment-for-test'},order=await request('/api/orders','POST',input);
 expect(order.total).toBe(p.price*2);expect(order.status).toBe('paid');
 expect((await request('/api/orders','POST',input)).id).toBe(order.id);
 expect((await request('/api/products')).products[8].stock).toBe(48);
 expect((await request('/api/orders')).orders.filter(o=>o.id===order.id)).toHaveLength(1);
});
it('persists administrator CRUD and recomputes revenue',async()=>{
 setDemoSession('admin');
 const p=(await request('/api/admin/products')).products[0];
 const created=await request('/api/admin/products','POST',{...p,name:'목업 신상품'});
 await request('/api/admin/products/'+created.id,'PATCH',{...p,name:'수정 상품',active:true});
 expect((await request('/api/products')).products.find(p=>p.id===created.id).name).toBe('수정 상품');
 await request('/api/admin/products/'+created.id,'DELETE');expect((await request('/api/products')).products.some(p=>p.id===created.id)).toBe(false);
 const revenue=(await request('/api/admin/dashboard')).stats.revenue;
 const order=await request('/api/admin/orders','POST',{customer:'예시 고객',email:'sample@example.test',total:12000,status:'paid',note:'예시'});
 expect((await request('/api/admin/dashboard')).stats.revenue).toBe(revenue+12000);
 await request('/api/admin/orders/'+order.id,'PATCH',{status:'cancelled',note:'취소 체험'});
 await request('/api/admin/orders/'+order.id,'DELETE');
 await request('/api/admin/members/demo-member-2','PATCH',{name:'수정 회원'});
 await request('/api/admin/members/demo-member-2','DELETE');
 expect((await request('/api/admin/members')).members.some(m=>m.id==='demo-member-2')).toBe(false);
 expect((await request('/api/admin/orders')).orders.filter(o=>o.email==='member@example.test').every(o=>o.user_id===null)).toBe(true);
 expect((await request('/api/admin/audit')).logs.length).toBeGreaterThan(5);
});
it('resets edits, session, wishlist and cart back to seeded data',async()=>{
 setDemoSession('customer');await request('/api/profile','POST',{name:'변경',consent:true});localStorage.setItem('closefit-cart','[1]');resetDemo();
 expect((await request('/api/me')).user).toBeNull();expect(localStorage.getItem('closefit-cart')).toBeNull();
 setDemoSession('customer');expect((await request('/api/me')).user.profile.name).toBe('김클로');
});
it('supports guest signup, logout and administrator login',async()=>{
 mount('/signup');const user=userEvent.setup();
 await user.type(await screen.findByLabelText('아이디'),'newcustomer');
 await user.type(screen.getByLabelText('이름 / 닉네임'),'예시회원');
 await user.type(screen.getByLabelText('이메일'),'new@example.test');
 await user.type(screen.getByLabelText('비밀번호',{exact:true}),'example-password');
 await user.type(screen.getByLabelText('비밀번호 확인'),'example-password');
 await user.click(screen.getByRole('checkbox'));await user.click(screen.getByRole('button',{name:'회원가입'}));
 await screen.findByRole('heading',{name:'예시회원님의 옷장'});
 await user.click(document.querySelector('.header-signout'));
 await screen.findByLabelText('아이디');
 expect(document.querySelector('.header-signout')).toBeNull();
 await user.type(screen.getByLabelText('아이디'),'admin');
 await user.type(screen.getByLabelText('비밀번호'),'example-password');
 await user.click(screen.getByRole('button',{name:'로그인'}));
 await screen.findByRole('heading',{name:'스토어 한눈에 보기'});
});
it('completes payment and shows the resulting order in my account',async()=>{
 setDemoSession('customer');
 localStorage.setItem('closefit-cart',JSON.stringify([{id:8,color:'#b8ad91',size:'L',qty:2}]));
 mount('/cart');const user=userEvent.setup();
 await user.click(await screen.findByRole('button',{name:'결제하기'}));
 await screen.findByRole('heading',{name:'결제 수단'});
 await user.click(screen.getByRole('radio',{name:'계좌이체 체험'}));await user.click(screen.getByRole('checkbox'));
 await user.click(screen.getByRole('button',{name:'결제하기'}));
 await screen.findByRole('heading',{name:'가상 결제가 완료되었습니다.'});
 expect(document.querySelector('#bag-count')).toHaveTextContent('0');
 await user.click(screen.getByRole('link',{name:'주문 내역 확인'}));
 await waitFor(()=>expect(document.querySelectorAll('.my-order').length).toBe(5));
 expect(document.querySelector('.my-order')).toHaveTextContent('에센셜 릴렉스 셔츠');
});

it('keeps focus on a field when the deferred route focus runs',async()=>{
 const callbacks=[];vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{callbacks.push(callback);return callbacks.length});vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});
 mount('/signup');const input=await screen.findByLabelText('이름 / 닉네임');input.focus();for(const callback of callbacks)callback(0);expect(input).toHaveFocus();
});

it('registers and returns to a demo account without persisting passwords',async()=>{
 const input={username:'newcustomer',name:'예시회원',email:'new@example.test',password:'example-password',consent:true};
 await request('/api/auth/register','POST',input);const first=(await request('/api/me')).user;
 await request('/api/demo/logout','POST');
 await request('/api/auth/login','POST',{username:input.username,password:input.password});
 expect((await request('/api/me')).user.id).toBe(first.id);
 expect(localStorage.getItem('closefit-demo-v1')).not.toContain(input.password);
 await expect(request('/api/auth/register','POST',input)).rejects.toMatchObject({status:409});
 await expect(request('/api/auth/login','POST',{username:'missing',password:input.password})).rejects.toMatchObject({status:401});
});

it.each(['카카오','구글','네이버'])('provides %s social demo login without network requests',async(provider)=>{
 const network=vi.spyOn(globalThis,'fetch');mount('/login');const user=userEvent.setup();
 await user.click(await screen.findByRole('button',{name:provider+'로 로그인'}));
 await screen.findByRole('heading',{name:provider+' 체험회원님의 옷장'});
 expect(network).not.toHaveBeenCalled();
});
