import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {request} from '../lib/api.js';
const StoreContext=createContext(null);
function read(key,legacy){try{const parsed=JSON.parse(localStorage.getItem(key)||localStorage.getItem(legacy)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return []}}
function initialCart(){return read('closefit-cart','onoff-cart').filter(x=>x&&Number.isInteger(x.id)&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99&&typeof x.color==='string'&&x.color.length<=40&&['M','L','XL'].includes(x.size))}
export function StoreProvider({children}){
 const [products,setProducts]=useState([]),[user,setUser]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [cart,setCart]=useState(initialCart),[wish,setWish]=useState(()=>read('closefit-wish','onoff-wish').filter(Number.isInteger)),[toast,setToast]=useState(''),[modal,setModal]=useState(null);
 useEffect(()=>{const controller=new AbortController();
  Promise.allSettled([request('/api/products','GET',undefined,{signal:controller.signal}),request('/api/me','GET',undefined,{signal:controller.signal})]).then(([catalog,account])=>{
   if(controller.signal.aborted)return;
   if(catalog.status==='fulfilled'){
    const list=catalog.value.products;setProducts(list);
    setCart(previous=>previous.filter(x=>list.some(p=>p.id===x.id)));setWish(previous=>previous.filter((id,i,all)=>list.some(p=>p.id===id)&&all.indexOf(id)===i));
   }else setError(catalog.reason.message);
   if(account.status==='fulfilled')setUser(account.value.user);setLoading(false);
  });return()=>controller.abort();
 },[]);
 useEffect(()=>{try{localStorage.setItem('closefit-cart',JSON.stringify(cart));localStorage.setItem('closefit-wish',JSON.stringify(wish))}catch{}},[cart,wish]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2500);return()=>clearTimeout(timer)},[toast]);
 const refreshProducts=useCallback(async()=>{const data=await request('/api/products');setProducts(data.products);return data.products},[]);
 const refreshUser=useCallback(async()=>{const data=await request('/api/me');setUser(data.user);return data.user},[]);
 const toggleWish=useCallback(id=>setWish(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]),[]);
 function addToCart(id,color,size,qty=1){
  const product=products.find(p=>p.id===id),existing=cart.find(x=>x.id===id&&x.color===color&&x.size===size);
  if(!product||!Number.isInteger(qty)||qty<1||(existing?.qty||0)+qty>Math.min(product.stock,99))throw Error('선택한 상품의 재고를 확인해주세요.');
  setCart(previous=>existing?previous.map(x=>x===existing?{...x,qty:x.qty+qty}:x):[...previous,{id,color,size,qty}]);
 }
 function updateQuantity(index,delta){
  const item=cart[index],product=products.find(p=>p.id===item?.id);if(!product)return;
  if(item.qty+delta>Math.min(product.stock,99))throw Error('추가할 수 있는 수량을 초과했습니다.');
  setCart(previous=>previous.map((x,i)=>i===index?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0));
 }
 const value={products,user,loading,error,cart,wish,notify:setToast,toast,modal,setModal,refreshUser,refreshProducts,toggleWish,addToCart,updateQuantity,removeCart:index=>setCart(previous=>previous.filter((_,i)=>i!==index)),clearCart:()=>setCart([])};
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(){const store=useContext(StoreContext);if(!store)throw Error('StoreProvider가 필요합니다.');return store}
