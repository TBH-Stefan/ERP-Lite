// Grundprüfung je Ansicht: keine Fehler in der Konsole, kein waagrechter Überlauf der Seite.
// Einmal mit den Standard-Schaltern (kompakte Ansicht ein) und einmal mit allen Erweiterungen aus.
const {test,expect}=require('@playwright/test');
const H=require('./hilfe');

for(const w of ['std','aus'])
test(`Ansichten ohne Fehler und ohne Überlauf (Schalter ${w==='std'?'Standard':'alle aus'})`,async({page},info)=>{
  const fehler=await H.starten(page,{daten:H.lesen(H.DATEN)}),ids=H.lesen(H.IDS);
  await H.schalter(page,w);
  const B=page.viewportSize().width,modi=info.project.name==='desktop'?['form','vorschau','beides']:['form','vorschau'],probleme=[];
  for(const h of H.ansichten(ids))for(const m of h.startsWith('beleg/')?modi:['form']){
    const n=fehler.length;
    await page.evaluate(m=>localStorage.setItem('erp-ansicht',m),m);
    const html=await H.zeichnen(page,h);
    const r=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,leer:!document.querySelector('#main').textContent.trim(),nf:/Nicht gefunden\./.test(document.querySelector('#main').textContent)}));
    const was=`#/${h}${h.startsWith('beleg/')?' ('+m+')':''}`;
    if(r.sw>B+1)probleme.push(`${was}: waagrechter Überlauf ${r.sw} px bei ${B} px Breite`); // Bezug ist die eingestellte Breite: am Handy wächst innerWidth mit dem Inhalt
    if(r.leer||r.nf||!html)probleme.push(`${was}: Ansicht leer bzw. „Nicht gefunden.“`);
    for(const f of fehler.slice(n))probleme.push(`${was}: ${f}`);
  }
  expect(probleme).toEqual([]);
});
