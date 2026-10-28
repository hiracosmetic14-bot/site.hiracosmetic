const handles=["gummy-keratin-hair-spray-ultra-strong", "gummy-professional-hair-mousse", "gummy-poudre-coiffante-effet-mat-20-g", "gummy-professional-powder-hair-wax-20-g", "gummy-professional-styling-wax", "gummy-professional-keratin-styling-wax", "gummy-cire-coiffante-brillance-et-fixation-maximale-150-ml", "gummy-hair-wax", "gummy-cire-coiffante-fixation-ultra-forte-150-ml", "gummy-cire-coiffante-style-naturel-150-ml", "gummy-professional-hairgel-plus", "gummy-professional-hairgel-keratin", "gummy-gel-cire-coiffant-220-ml", "gummy-gel-coiffant-fixation-maximale-220-ml", "gummy-professional-beard-oil-50-ml", "gummy-professional-bloom-shave-gel", "derby-professional-platinum-100-lames-de-rasage", "dita-lemon-cologne-80-eau-de-cologne-5-l"];
const shop='https://hiracosmetic-store.myshopify.com';
const headers={'Accept':'application/json','Accept-Language':'fr-BE,fr;q=0.9'};
const respond=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':status===200?'public, max-age=0, s-maxage=120, stale-while-revalidate=120':'no-store'}});
async function read(path){const response=await fetch(shop+path,{headers,signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('store_unavailable');return response.json();}
export async function GET(){
 let currency;try{const cart=await read('/cart.js');currency=cart.currency;if(currency!=='EUR')return respond({error:'currency_unconfirmed'},503);}catch(_){return respond({error:'store_unavailable'},503);}
 const products=[],failed=[];let next=0;
 async function worker(){
  while(next<handles.length){const handle=handles[next++];try{
   const product=await read('/products/'+handle+'.js');
   if(product.handle!==handle||typeof product.available!=='boolean'||!Number.isSafeInteger(product.price_min)||product.price_min<0||!Number.isSafeInteger(product.price_max))throw new Error('invalid_product');
   const barcode=Array.isArray(product.variants)&&product.variants.length===1&&typeof product.variants[0].barcode==='string'?product.variants[0].barcode:null;
   products.push({handle,available:product.available,price:product.price_min,priceVaries:product.price_min!==product.price_max,currency,barcode:barcode&&/^[0-9]{8,14}$/.test(barcode)?barcode:null});
  }catch(_){failed.push(handle);}}
 }
 await Promise.all(Array.from({length:5},worker));
 if(!products.length)return respond({error:'store_unavailable'},503);
 return respond({currency,checkedAt:new Date().toISOString(),products,failedHandles:failed});
}
