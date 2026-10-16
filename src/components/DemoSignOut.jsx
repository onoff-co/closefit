import {useNavigate} from 'react-router';
import {useStore} from '../state/StoreContext.jsx';
import {request} from '../lib/api.js';
export default function DemoSignOut({className='signout'}){
 const {refreshUser,notify}=useStore(),navigate=useNavigate();
 return <button className={className} onClick={async()=>{await request('/api/demo/logout','POST');await refreshUser();notify('로그아웃되었습니다.');navigate('/login')}}>로그아웃</button>;
}
