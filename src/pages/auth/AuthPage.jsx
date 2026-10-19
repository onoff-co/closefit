import {isSqlMode} from '../../lib/api.js';
import DemoAuthPage from './DemoAuthPage.jsx';
import LoginPage from './LoginPage.jsx';
import SignupPage from './SignupPage.jsx';
export default function AuthPage({signup=false}){return isSqlMode?(signup?<SignupPage/>:<LoginPage/>):<DemoAuthPage signup={signup}/>}
