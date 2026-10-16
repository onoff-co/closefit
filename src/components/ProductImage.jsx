import {assetUrl} from '../lib/assets.js';
export default function ProductImage({product,className=''}){
 const label=product.name+' · AI 제작 콘셉트';
 if(product.image==='/assets/hanger-catalog.png'&&product.id>=0&&product.id<8){
  const x=(product.id%2)*512,y=Math.floor(product.id/2)*384;
  return <svg className={'generated-product-image '+className} role="img" aria-label={label} viewBox="0 0 512 384" preserveAspectRatio="xMidYMid meet"><svg width="512" height="384" viewBox={x+' '+y+' 512 384'} overflow="hidden"><image href={assetUrl('/assets/hanger-catalog.png')} width="1024" height="1536"/></svg></svg>;
 }
 return <img className={className} src={assetUrl(product.image||'/assets/hanger-shirt.png')} alt={label} loading="lazy"/>;
}
