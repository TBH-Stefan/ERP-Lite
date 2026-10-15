// Gemeinsame Hilfen der Tests: App starten (feste Uhrzeit, fester Zufall, Testdaten im Browser-Cache), Ansichten aufrufen, HTML vergleichen
const fs=require('fs'),path=require('path');
const TMP=path.join(__dirname,'.tmp');
const ZEIT=new Date('2026-10-12T08:00:00+02:00'); // fester Zeitpunkt (Belegdatum, „heute“, Zeitstempel)
const DATEN=path.join(TMP,'daten.json'),IDS=path.join(TMP,'ids.json'),BASIS_INFO=path.join(TMP,'basis.json');

// Startet index.html (aktuell: '/', Ausgangsstand: '/basis/') im Modus „Nur im Browser testen“ mit den gegebenen Daten
async function starten(page,{url='/',daten=null,ansicht='form',vorher}={}){
  const fehler=[];
  page.on('pageerror',e=>fehler.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')fehler.push('console: '+m.text())});
  page.on('dialog',d=>d.dismiss().catch(()=>{})); // echte alert/confirm würden den Test anhalten
  await page.clock.setFixedTime(ZEIT);
  await page.addInitScript(({daten,ansicht})=>{
    let x=20261012;Math.random=()=>((x=(x*1103515245+12345)%2147483648)/2147483648); // fester Zufall → gleiche IDs in jeder Fassung
    try{localStorage.clear();if(daten)localStorage.setItem('erp-lite-cache',daten);localStorage.setItem('erp-ansicht',ansicht)}catch(e){}
  },{daten:daten?JSON.stringify(daten):null,ansicht});
  await page.goto(url);
  if(vorher)await vorher(page);
  await page.locator('#st-cache').click();
  await page.waitForFunction(()=>document.body.classList.contains('loaded'));
  // Meldungen der App abfangen (alert/confirm würden blockieren); gesammelt in window.__meld
  await page.evaluate(()=>{window.__meld=[];window.alert=m=>window.__meld.push(String(m));window.confirm=()=>true});
  return fehler;
}
// Schalter setzen: 'aus' = alle Erweiterungen aus, 'std' = Vorgaben, oder Objekt {k:wert}
async function schalter(page,w){
  await page.evaluate(w=>{DB.settings.erw=w==='aus'?Object.fromEntries(ERW.map(x=>[x.k,false])):w==='std'?{}:{...w}},w);
}
// Ansicht zeichnen und #main zurückgeben (ohne Navigation über hashchange: kein Speichern-Dialog, gleiche Reihenfolge in jeder Fassung)
async function zeichnen(page,h){
  return page.evaluate(async h=>{
    history.replaceState(null,'','#/'+h);CURHASH=location.hash;render();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); // vorschauSeiten() läuft im nächsten Frame
    return document.querySelector('#main').innerHTML;
  },h);
}
// Liste der Ansichten zu den Testdaten (Hash ohne #/)
function ansichten(ids){
  const l=['dash','belege/V','belege/E','auftraege','kosten','zeiten','kontakte','kontakte/K','kontakte/L','artikel','lager','auswertung','kbs','lvbib','lvs','fibu','export','einstellungen','verrechnung'];
  for(const id of [ids.an,ids.anP,ids.re,ids.reRC,ids.reSV,ids.ab,ids.ls,ids.be,ids.er,ids.gs])l.push('beleg/'+id);
  l.push('auftrag/'+ids.ab);if(ids.kb)l.push('kbs/'+ids.kb);
  return l;
}
// Teile, die sich mit jedem neuen Schalter bzw. jeder neuen Druckoption ändern dürfen, aus dem Vergleich nehmen
function ohneSchalterKarte(html){return html.replace(/<div class="card" id="erw">[\s\S]*$/,m=>{ // Karte „Erweiterungen“ bis zu ihrem Ende
  let t=0,i=0;const re=/<\/?div\b[^>]*>/g;let x;while((x=re.exec(m))){t+=x[0][1]==='/'?-1:1;if(!t){i=re.lastIndex;break}}return'<!-- Karte Erweiterungen -->'+m.slice(i)})}
// Leerraum, der die Darstellung nicht ändert, angleichen: Folgen von Leerzeichen/Zeilenumbrüchen → ein Leerzeichen, Leerraum an
// Block-Tags entfällt (ein leerer Baustein eines ausgeschalteten Schalters hinterlässt sonst eine Leerzeile im HTML)
const BLOCK=/\s*(<\/?(?:div|table|thead|tbody|tfoot|tr|td|th|p|h[1-6]|details|summary|ul|ol|li|section|br|hr|label|select|option)\b[^>]*>)\s*/g;
const leerraum=h=>h.replace(/\s+/g,' ').replace(BLOCK,'$1');
// erste abweichende Stelle zweier Texte mit etwas Umgebung (für die Fehlermeldung)
function unterschied(a,b,n=160){if(a===b)return'';let i=0;while(i<a.length&&a[i]===b[i])i++;
  return`ab Zeichen ${i}:\n  Ausgangsstand: …${a.slice(Math.max(0,i-n/2),i+n)}…\n  jetzt:         …${b.slice(Math.max(0,i-n/2),i+n)}…`}
// docHTML (Druck und Editor), PDF (Inhalt und Datei-Info getrennt) und Summen eines Belegs; im PDF werden die Datenströme entpackt (lesbare Unterschiede), das Erstelldatum entfällt
const belegAusgabe=(page,id)=>page.evaluate(id=>window.__belegAusgabe(id),id);
const ausgabeBereit=page=>page.evaluate(()=>{window.__belegAusgabe=async id=>{const b=beleg(id),o={};
  o.druck=docHTML(b,false);o.editor=docHTML(b,true);
  try{const u8=new Uint8Array(await (await pdfAusBeleg(b)).arrayBuffer()),L=new TextDecoder('latin1').decode(u8),teile=[];let i=0,m;
    const hash=x=>{let h=2166136261;for(const c of x)h=Math.imul(h^c,16777619)>>>0;return h.toString(16)}; // FNV-1a: Bilder nur als Prüfsumme
    const re=/(?<!end)stream\r?\n/g;
    while((m=re.exec(L))){const a=m.index+m[0].length;let e=L.indexOf('endstream',a);if(e<0)break;const kopf=L.slice(L.lastIndexOf(' obj',m.index),m.index);
      let z=e;while(z>a&&(L[z-1]==='\n'||L[z-1]==='\r'))z--;const roh=u8.slice(a,z);teile.push(L.slice(i,a));
      let t=null;if(!/\/Subtype\s*\/Image/.test(kopf)&&/FlateDecode/.test(kopf))try{t=await new Response(new Blob([roh]).stream().pipeThrough(new DecompressionStream('deflate'))).text()}catch(x){}
      teile.push(t??`[${roh.length} Byte, Prüfsumme ${hash(roh)}]\n`);i=z;re.lastIndex=e}
    teile.push(L.slice(i));const p=teile.join('').replace(/\/(CreationDate|ModDate)\s*\([^)]*\)/g,'');
    o.pdfInfo=(p.match(/\/Info\s*<<[\s\S]*?>>/)||[''])[0];o.pdf=p.replace(o.pdfInfo,'/Info …')} // Datei-Info (Titel, Autor) getrennt vom Inhalt
  catch(e){o.pdf='Fehler: '+e.message}
  o.summen=JSON.stringify(summen(b));
  return o}});

const lesen=f=>JSON.parse(fs.readFileSync(f,'utf8'));
module.exports={belegAusgabe,ausgabeBereit,leerraum,TMP,ZEIT,DATEN,IDS,BASIS_INFO,starten,schalter,zeichnen,ansichten,ohneSchalterKarte,unterschied,lesen};
