// Alle Erweiterungen aus → jede Ansicht, docHTML, Vorschau und PDF wie im Ausgangsstand (BASIS, Vorgabe origin/main).
// Grundsatz aus CLAUDE.md: „Standard = bisheriges Verhalten“, jede Erweiterung ist abschaltbar. Unterschiede bei ausgeschalteten
// Schaltern sind daher Regressionen – außer beabsichtigten Fehlerbehebungen, die in erlaubte-abweichungen.json stehen.
const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const H=require('./hilfe');

const ERLAUBT=(()=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,'erlaubte-abweichungen.json'),'utf8')).abweichungen||[]}catch(e){return[]}})();
const erlaubt=(was,projekt)=>ERLAUBT.some(e=>(e.was===was||(e.was.endsWith('*')&&was.startsWith(e.was.slice(0,-1))))&&(!e.projekt||e.projekt===projekt));

async function oeffnen(browser,use,url,daten){
  const ctx=await browser.newContext({baseURL:use.baseURL,viewport:use.viewport,isMobile:use.isMobile,hasTouch:use.hasTouch,deviceScaleFactor:use.deviceScaleFactor,locale:use.locale,timezoneId:use.timezoneId});
  const page=await ctx.newPage(),fehler=await H.starten(page,{url,daten});
  await H.schalter(page,'aus');await H.ausgabeBereit(page);
  return{page,fehler,ctx};
}
test('Schalter aus: Ansichten, Druck und PDF wie im Ausgangsstand',async({browser},info)=>{
  const basis=H.lesen(H.BASIS_INFO);
  test.skip(!basis.sha,basis.fehlt);
  info.annotations.push({type:'Ausgangsstand',description:`${basis.ref} (${basis.sha.slice(0,7)})`});
  const daten=H.lesen(H.DATEN),ids=H.lesen(H.IDS),use=info.project.use,P=info.project.name;
  const B=await oeffnen(browser,use,'/basis/',daten),A=await oeffnen(browser,use,'/',daten);
  const abw=[],vergleich=(was,a,b)=>{if(a!==b&&!erlaubt(was,P))abw.push(`${was}\n${H.unterschied(a,b)}`)};
  const modi=P==='desktop'?['form','vorschau','beides']:['form','vorschau'];
  for(const h of H.ansichten(ids)){
    const ms=h.startsWith('beleg/')?modi:['form'];
    for(const m of ms){
      for(const x of [A,B])await x.page.evaluate(m=>localStorage.setItem('erp-ansicht',m),m);
      let a=await H.zeichnen(B.page,h),b=await H.zeichnen(A.page,h);
      if(h==='einstellungen'){a=H.ohneSchalterKarte(a);b=H.ohneSchalterKarte(b)}
      vergleich(`#/${h}${ms.length>1?' ('+m+')':''}`,H.leerraum(a),H.leerraum(b));
    }
  }
  for(const[k,id]of Object.entries(ids))if(typeof id==='string'&&k!=='kb'){
    const a=await H.belegAusgabe(B.page,id),b=await H.belegAusgabe(A.page,id);
    expect(b.pdf.startsWith('%PDF'),`PDF ${k}: ${b.pdf.slice(0,200)}`).toBe(true);
    for(const t of ['druck','editor'])vergleich(`${t} ${k}`,H.leerraum(a[t]),H.leerraum(b[t]));
    vergleich(`pdf ${k}`,a.pdf,b.pdf);vergleich(`pdf-info ${k}`,a.pdfInfo,b.pdfInfo);
  }
  const fehlerA=A.fehler.slice();
  await A.ctx.close();await B.ctx.close();
  expect(fehlerA,'Fehler in der Konsole (aktueller Stand)').toEqual([]);
  expect(abw,`Abweichungen gegenüber ${basis.ref} bei ausgeschalteten Erweiterungen`).toEqual([]);
});
