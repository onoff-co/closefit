import {httpRequest} from './http-api.js';
import {demoRequest} from '../demo/api.js';
export const isSqlMode=import.meta.env.DEV&&import.meta.env.MODE!=='test'&&import.meta.env.VITE_DATA_SOURCE==='mysql';
export const request=isSqlMode?httpRequest:demoRequest;
export const money=value=>Number(value||0).toLocaleString('ko-KR')+'원';
export const statusLabels={pending:'결제 대기',paid:'결제 확인',shipping:'배송 중',completed:'완료',cancelled:'취소'};
export const formatDate=value=>value?new Date(value.replace(' ','T')+'Z').toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
export function safeReturn(search){const value=new URLSearchParams(search).get('next');return ['/cart','/wishlist','/account','/admin','/checkout'].includes(value)?value:'/account'}

// Keep legacy system-generated notes and identifiers out of customer-facing copy.
export function orderNote(value){const note=String(value||"");if(note==="포트폴리오 예시 주문"||note==="포트폴리오 가상 결제")return "";return note.replace(/^포트폴리오 가상 결제 · /,"결제 수단 · ")}
export function orderNumber(value){const legacy=/^demo-order-(\d+)$/.exec(String(value));return legacy?"CF"+legacy[1].padStart(6,"0"):String(value).slice(0,8).toUpperCase()}
