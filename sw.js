/* ERP-Lite – Service Worker (P40, Schalter „App: Start auch ohne Internet“).
   Hält nur das Programm (index.html, Manifest, Symbol) für den Start ohne Netz bereit. Keine Firmen- oder Kundendaten:
   erp-daten.json liegt im OneDrive bzw. in der Browser-Kopie, Anfragen an Microsoft (Anmeldung, OneDrive) gehen nie über diesen Speicher.
   Online gilt immer zuerst die neueste Version vom Server (Netz zuerst, nach 5 s bzw. ohne Netz die gespeicherte). */
const C='erp-app-v1',START='./';
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(C);
  let r=await fetch(START,{cache:'no-store'}).catch(()=>null);if(!r?.ok)r=await fetch('index.html',{cache:'no-store'}); // Testlink (raw.githack) liefert „./“ nicht
  if(r.ok)await c.put(START,r);await c.addAll(['manifest.webmanifest','icon-180.png']).catch(()=>{});await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('erp-app')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  if(r.mode==='navigate'){e.respondWith(netzZuerst(r));return}
  if(/\/(manifest\.webmanifest|icon-180\.png)$/.test(u.pathname))e.respondWith(caches.match(r).then(x=>x||fetch(r)));
});
async function netzZuerst(r){
  const c=await caches.open(C),ab=new AbortController(),t=setTimeout(()=>ab.abort(),5000);
  try{
    const n=await fetch(r.url,{signal:ab.signal,cache:'no-store',credentials:'same-origin'});clearTimeout(t);
    if(n.redirected)return Response.redirect(n.url,302);
    if(n.ok&&/(\/|\/index\.html)$/.test(new URL(n.url).pathname))c.put(START,n.clone());
    return n;
  }catch(x){clearTimeout(t);return(await c.match(START))||Response.error()}
}
