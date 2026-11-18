const handles=[
 "gummy-keratin-hair-spray-ultra-strong",
 "gummy-professional-hair-mousse",
 "gummy-poudre-coiffante-effet-mat-20-g",
 "gummy-professional-powder-hair-wax-20-g",
 "gummy-professional-styling-wax",
 "gummy-professional-keratin-styling-wax",
 "gummy-cire-coiffante-brillance-et-fixation-maximale-150-ml",
 "gummy-hair-wax",
 "gummy-cire-coiffante-fixation-ultra-forte-150-ml",
 "gummy-cire-coiffante-style-naturel-150-ml",
 "gummy-professional-hairgel-plus",
 "gummy-professional-hairgel-keratin",
 "gummy-gel-cire-coiffant-220-ml",
 "gummy-gel-coiffant-fixation-maximale-220-ml",
 "gummy-professional-beard-oil-50-ml",
 "gummy-professional-bloom-shave-gel",
 "derby-professional-platinum-100-lames-de-rasage",
 "dita-lemon-cologne-80-eau-de-cologne-5-l",
 "gummy-hair-wax-lot-de-3-pots-de-150-ml",
 "gummy-hair-wax-lot-de-6-pots-de-150-ml",
 "gummy-professional-powder-hair-wax-20-g-lot-de-3-unites",
 "gummy-professional-powder-hair-wax-20-g-lot-de-6-unites",
 "gummy-professional-bloom-shave-gel-lot-de-3-unites",
 "gummy-professional-bloom-shave-gel-lot-de-6-unites",
 "gummy-professional-hairgel-plus-lot-de-3-unites",
 "gummy-professional-hairgel-plus-lot-de-6-unites",
 "gummy-professional-hairgel-keratin-lot-de-3-unites",
 "gummy-professional-hairgel-keratin-lot-de-6-unites",
 "gummy-professional-styling-wax-lot-de-3-unites",
 "gummy-professional-styling-wax-lot-de-6-unites",
 "gummy-professional-keratin-styling-wax-lot-de-3-unites",
 "gummy-professional-keratin-styling-wax-lot-de-6-unites",
 "gummy-poudre-coiffante-effet-mat-20-g-lot-de-3-unites",
 "gummy-poudre-coiffante-effet-mat-20-g-lot-de-6-unites",
 "gummy-cire-coiffante-brillance-et-fixation-maximale-150-ml-lot-de-3-unites",
 "gummy-cire-coiffante-brillance-et-fixation-maximale-150-ml-lot-de-6-unites",
 "gummy-cire-coiffante-fixation-ultra-forte-150-ml-lot-de-3-unites",
 "gummy-cire-coiffante-fixation-ultra-forte-150-ml-lot-de-6-unites",
 "gummy-cire-coiffante-style-naturel-150-ml-lot-de-3-unites",
 "gummy-cire-coiffante-style-naturel-150-ml-lot-de-6-unites",
 "gummy-gel-cire-coiffant-220-ml-lot-de-3-unites",
 "gummy-gel-cire-coiffant-220-ml-lot-de-6-unites",
 "gummy-gel-coiffant-fixation-maximale-220-ml-lot-de-3-unites",
 "gummy-gel-coiffant-fixation-maximale-220-ml-lot-de-6-unites",
 "gummy-pack-decouverte-3-cires-150-ml"
];
const shop='https://hiracosmetic-store.myshopify.com';
const headers={'Accept':'application/json','Accept-Language':'fr-BE,fr;q=0.9'};
const respond=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':status===200?'public, max-age=0, s-maxage=120, stale-while-revalidate=120':'no-store'}});
async function read(path){const response=await fetch(shop+path,{headers,signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('store_unavailable');return response.json();}
export async function GET() {
 try {
  const [cart, catalogue] = await Promise.all([read('/cart.js'), read('/products.json?limit=250')]);
  const currency = cart.currency;
  if (currency !== 'EUR') return respond({error:'currency_unconfirmed'},503);
  if (!Array.isArray(catalogue.products)) throw new Error('invalid_catalogue');
  const byHandle = new Map(catalogue.products.map(product => [product.handle, product]));
  const products = [], failedHandles = [];
  for (const handle of handles) {
   const variants = byHandle.get(handle)?.variants;
   if (!Array.isArray(variants) || !variants.length || variants.some(variant =>
    typeof variant.available !== 'boolean' || !/^\d+\.\d{2}$/.test(variant.price))) {
    failedHandles.push(handle);
    continue;
   }
   const prices = variants.map(variant => Math.round(Number(variant.price) * 100));
   const price = Math.min(...prices);
   const barcode = variants.length === 1 ? variants[0].barcode : null;
   products.push({handle, available:variants.some(variant => variant.available), price,
    priceVaries:price !== Math.max(...prices), currency,
    barcode:typeof barcode === 'string' && /^[0-9]{8,14}$/.test(barcode) ? barcode : null});
  }
  if (!products.length) throw new Error('empty_catalogue');
  return respond({currency, checkedAt:new Date().toISOString(), products, failedHandles});
 } catch {
  return respond({error:'store_unavailable'},503);
 }
}
