import {useState} from 'react';import {useNavigate} from 'react-router';import {useStore} from '../state/StoreContext.jsx';
export function useCheckout(){const store=useStore(),navigate=useNavigate(),[error,setError]=useState('');
 function checkout(items,{preserveSelection=false}={}){
  if(!store.user){
   if(preserveSelection){try{for(const x of items)store.addToCart(x.id,x.color,x.size,x.qty)}catch(err){setError(err.message);return}}
   navigate('/login?next=/checkout');return;
  }
  navigate('/checkout',{state:{items}});
 }return {checkout,busy:false,error};
}
