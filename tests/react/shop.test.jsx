import {describe,it,expect,vi} from 'vitest';
import {render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import App from '../../src/App.jsx';
import {StoreProvider} from '../../src/state/StoreContext.jsx';
import ProductImage from '../../src/components/ProductImage.jsx';
import {initialProducts} from '../../worker/catalog.mjs';
import fs from 'node:fs';
import * as api from '../../src/lib/api.js';
import {demoRequest,resetDemo,setDemoSession} from '../../src/demo/api.js';
const products=initialProducts.map(p=>({...p,image:p.id===8?'/assets/hanger-shirt.png':'/assets/hanger-catalog.png',stock:50,active:true}));
const owner={id:'owner',email:'owner@example.test',admin:true,profile:{name:'운영자'}};
function mount(route='/',user=owner){
 resetDemo();if(user){setDemoSession(user.admin?'admin':'customer');demoRequest('/api/profile','POST',{name:'운영자',consent:true})}
 const calls=[];vi.spyOn(api,'request').mockImplementation((...args)=>{calls.push(args);return demoRequest(...args)});
 const result=render(<MemoryRouter initialEntries={[route]}><StoreProvider><App/></StoreProvider></MemoryRouter>);
 return {...result,calls};
}
describe('React shopping routes',()=>{
 it('shows guest login and protects account',async()=>{
  mount('/account',null);
  expect(await screen.findByRole('heading',{name:'다시 만나서 반가워요.'})).toBeInTheDocument();
  expect(document.querySelector('.account-icon')).toHaveAttribute('href','/login');
  expect(document.querySelector('.header-signout')).toBeNull();
 });
 it('preserves header identity, menu, logo and studio preparation state',async()=>{
  mount('/');
  expect(await screen.findByText('운영자님')).toBeInTheDocument();
  expect(document.querySelector('header .logo img')).toHaveAttribute('src','/assets/closefit-logo.png');
  expect(document.querySelectorAll('.nav-menu').length).toBeGreaterThanOrEqual(8);
  expect(document.querySelector('header a[href="/#studio"]')).toBeNull();
  expect(document.querySelector('#studio')).toHaveTextContent('준비 중');
  await userEvent.hover(screen.getByRole('button',{name:'SHOP 메뉴 열기'}));
  expect(screen.getByRole('button',{name:'SHOP 메뉴 열기'})).toHaveAttribute('aria-expanded','true');
 });
 it('connects product, wishlist, cart and account without reloading the catalogue',async()=>{
  const {calls}=mount('/product/8');const user=userEvent.setup();
  await screen.findByRole('heading',{name:products.find(p=>p.id===8).name});
  await user.click(screen.getByRole('button',{name:'상품 찜하기'}));
  await user.click(screen.getByRole('link',{name:'찜한 상품',exact:true}));
  await waitFor(()=>expect(document.querySelector('.wishlist-page .product-card')).toBeTruthy());
  await user.click(document.querySelector('.wishlist-page a[href="/product/8"]'));
  await user.selectOptions(screen.getByLabelText('SIZE'),'L');
  await user.click(screen.getByRole('button',{name:'장바구니 담기 ＋'}));
  await user.click(document.querySelector('#bag-open'));
  await waitFor(()=>expect(document.querySelector('.cart-product')).toBeTruthy());
  await user.click(screen.getByRole('button',{name:/수량 늘리기/}));
  expect(document.querySelector('#bag-count')).toHaveTextContent('2');
  expect(JSON.parse(localStorage.getItem('closefit-cart'))[0]).toMatchObject({id:8,size:'L',qty:2});
  await user.click(document.querySelector('.member-navigation a[href="/account"]'));
  await screen.findByRole('heading',{name:/운영자/});
  expect(calls.filter(([p])=>p==='/api/products')).toHaveLength(1);
 });
 it.each(['/shop','/login','/signup','/wishlist','/cart','/account','/product/8'])('renders %s',async route=>{
  mount(route);await waitFor(()=>expect(document.querySelector('#route-page h1')).toBeTruthy());
  expect(document.querySelector('#route-page')).not.toHaveTextContent('페이지를 찾을 수 없습니다.');
 });
 it('submits consent and profile name',async()=>{
  const {calls}=mount('/signup');await screen.findByLabelText('이름 / 닉네임');
  const user=userEvent.setup();await user.clear(screen.getByLabelText('이름 / 닉네임'));await user.type(screen.getByLabelText('이름 / 닉네임'),'새회원');
  await user.click(screen.getByRole('checkbox'));await user.click(screen.getByRole('button',{name:'프로필 저장'}));
  await waitFor(()=>expect(calls.some(([p,o])=>p==='/api/profile'&&o==='POST')).toBe(true));
 });
 it('loads every administration view and submits product CRUD forms',async()=>{
  const {calls}=mount('/admin');const user=userEvent.setup();
  await screen.findByRole('heading',{name:'스토어 한눈에 보기'});
  for(const label of ['상품 관리','주문 관리','회원 관리','방문 로그','변경 이력']){
   await user.click(within(document.querySelector('.admin-sidebar')).getByRole('button',{name:new RegExp(label)}));
   await waitFor(()=>expect(document.querySelector('#admin-body .loading-state')).toBeNull());
   await screen.findByRole('heading',{name:label});
  }
  await user.click(within(document.querySelector('.admin-sidebar')).getByRole('button',{name:/상품 관리/}));
  await screen.findByPlaceholderText('상품명으로 검색');
  await user.click(screen.getByRole('button',{name:'＋ 상품 등록'}));
  const dialog=screen.getByRole('dialog');await user.type(within(dialog).getByLabelText('상품명'),'새 상품');await user.click(within(dialog).getByRole('button',{name:'상품 등록'}));
  await waitFor(()=>expect(calls.some(([p,o])=>p==='/api/admin/products'&&o==='POST')).toBe(true));
  await user.click(screen.getAllByRole('button',{name:'수정'})[0]);
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'변경사항 저장'}));
  await waitFor(()=>expect(calls.some(([p,o])=>p.startsWith('/api/admin/products/')&&o==='PATCH')).toBe(true));
  await user.click(screen.getAllByRole('button',{name:'판매 중지'})[0]);await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'확인'}));
  await waitFor(()=>expect(calls.some(([p,o])=>p.startsWith('/api/admin/products/')&&o==='DELETE')).toBe(true));
 });
 it('clips every generated garment cell without stretching the source image',()=>{
  const png=fs.readFileSync('public/assets/hanger-catalog.png'),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  for(let id=0;id<8;id++){const {container,unmount}=render(<ProductImage product={{id,name:'상품',image:'/assets/hanger-catalog.png'}}/>);const outer=container.querySelector('svg'),inner=outer.querySelector('svg'),image=inner.querySelector('image');expect(outer).toHaveAttribute('preserveAspectRatio','xMidYMid meet');expect(inner).toHaveAttribute('overflow','hidden');const [x,y,w,h]=inner.getAttribute('viewBox').split(' ').map(Number);expect([w,h,x,y]).toEqual([width/2,height/4,id%2*width/2,Math.floor(id/2)*height/4]);expect(x+w).toBeLessThanOrEqual(width);expect(y+h).toBeLessThanOrEqual(height);expect(Number(image.getAttribute('width'))).toBe(width);expect(Number(image.getAttribute('height'))).toBe(height);unmount()}
  expect(fs.readFileSync('src/styles/shopping-flow.css','utf8')).not.toContain('background-size:200% 400%');
 });
});
