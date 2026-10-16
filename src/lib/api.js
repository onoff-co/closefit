import {demoRequest} from '../demo/api.js';
export const request=demoRequest;
export const money=value=>Number(value||0).toLocaleString('ko-KR')+'원';
export const statusLabels={pending:'결제 대기',paid:'결제 확인',shipping:'배송 중',completed:'완료',cancelled:'취소'};
export const formatDate=value=>value?new Date(value.replace(' ','T')+'Z').toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
export function safeReturn(search){const value=new URLSearchParams(search).get('next');return ['/cart','/wishlist','/account','/admin','/checkout'].includes(value)?value:'/account'}
