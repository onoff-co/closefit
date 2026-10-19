import {useNavigate} from 'react-router';
import {useStore} from '../state/StoreContext.jsx';
import {request,isSqlMode} from '../lib/api.js';
export default function DemoSignOut({className='signout'}){
 const {refreshUser,notify}=useStore(),navigate=useNavigate();
 return <button className={className} onClick={async()=>{try{await request(isSqlMode?'/api/auth/logout':'/api/demo/logout','POST');await refreshUser();notify('로그아웃되었습니다.');navigate('/login')}catch(error){notify(error.message)}}}>로그아웃</button>;
}
