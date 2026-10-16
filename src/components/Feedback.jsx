import {useEffect,useRef} from 'react';import {useStore} from '../state/StoreContext.jsx';
export function ErrorBox({error}){return error?<div className="form-error" role="alert">{error.message||error}</div>:null}
export function Loading(){return <div className="page-loading">클로즈핏을 준비하고 있습니다…</div>}
export default function Feedback(){const {toast,modal,setModal}=useStore(),ref=useRef(null);
 useEffect(()=>{const dialog=ref.current;if(modal&&!dialog.open)dialog.showModal();if(!modal&&dialog.open)dialog.close()},[modal]);
 return <><dialog ref={ref} id="panel" onCancel={()=>setModal(null)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setModal(null)}}}><div className="dialog-header"><h2>{modal?.title}</h2><button onClick={()=>setModal(null)} aria-label="닫기">×</button></div><div id="panel-content">{modal?.content}</div></dialog><div id="toast" role="status" className={toast?'show':''}>{toast}</div></>;
}
