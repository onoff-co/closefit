import {isSqlMode} from '../lib/api.js';
import {Link} from 'react-router';
export default function DemoNotice(){return <aside className="demo-notice"><span>{isSqlMode?'LOCAL PREVIEW · 로컬 회원 계정으로 이용할 수 있습니다.':'PORTFOLIO DEMO · 가입과 결제는 예시로만 진행됩니다.'}</span><Link to="/login">{isSqlMode?'로그인 / 회원가입':'로그인 / 회원가입'}</Link></aside>}
