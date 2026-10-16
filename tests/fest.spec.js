// Festgeschriebene Belege (§ 11 UStG, § 131 BAO): Nachdruck unverändert, Nummern lückenlos, Inhalt nicht mehr änderbar.
// Läuft mit den Standard-Schaltern des aktuellen Stands.
const {test,expect}=require('@playwright/test');
const H=require('./hilfe');

async function oeffnen(page){
  const fehler=await H.starten(page,{daten:H.lesen(H.DATEN)});
  await H.ausgabeBereit(page);
  return fehler;
}
// Stammdaten und Einstellungen ändern, die ein festgeschriebener Beleg NICHT übernehmen darf
const aendern=page=>page.evaluate(()=>{
  const s=S();
  Object.assign(s.firma,{name:'Ganz Andere GmbH',zusatz:'Neu',strasse:'Andere Gasse 9',plz:'A-8010',ort:'Graz',uid:'ATU99999999',fn:'999999 z',gericht:'LG Graz',
    tel:'+43 316 99',mail:'neu@example.at',web:'www.neu.example',bank:'Andere Bank',iban:'AT99 9999 9999 9999 9999',bic:'ANDEATWW',zeichner:'Neue Person',zeichnerFkt:'Prokura'});
  s.bearbeiter='Neuer Bearbeiter';
  for(const st of s.steuer){if(st.code==='20'){st.satz=19;st.bez='19 % USt'}if(st.code==='RC')st.hinweis='Geänderter Hinweis zur Steuerschuld.'}
  for(const t in s.texte)s.texte[t]={kopf:'Neuer Kopftext',fuss:'Neuer Fußtext'};
  s.zahlungsziel=45;s.skonto=3;s.skontoTage=10;
  s.druckprofil={AN:{preise:false,titel:'NEU'},AB:{summen:false,nrForm:'kurz'},LS:{spPos:false},RE:{nrForm:'kurz',lblNetto:'Netto neu',infoGrp:'titel'},BE:{artNr:'spalte'},ER:{striche:true}};
  for(const k of DB.kontakte)Object.assign(k,{name:k.name+' NEU',zusatz:'',strasse:'Neue Straße 1',plz:'9999',ort:'Neuort',uid:k.uid?'ATU77777777':'',anrede:'FA',kdNrLief:'X-1'});
  for(const a of DB.artikel){a.vk=+(a.vk*2).toFixed(2);a.bez+=' (neu)';a.text='geändert'}
  for(const t of s.tarife){t.vk*=2;t.lohnNw=false}
});

// Bekannte Abweichung (Stand 15.10.2026, nicht behoben): Die Datei-Info der PDF (Titel mit Kunde, Autor = Firma) liest bei
// festgeschriebenen Belegen den aktuellen Kontakt und die aktuelle Firma (pdfAusBeleg(), Zeile „/Info“: kName(b.kontaktId),
// S().firma.name) statt b.adresse bzw. b.fix. Sichtbar nur in den Dokumenteigenschaften, nicht im Ausdruck.
// Nach der Korrektur BEKANNT_PDF_INFO auf false setzen – dann wird auch die Datei-Info streng geprüft.
const BEKANNT_PDF_INFO=true;

test('Nachdruck festgeschriebener Belege bleibt nach Änderungen an Stammdaten und Einstellungen gleich',async({page})=>{
  const fehler=await oeffnen(page),ids=H.lesen(H.IDS);
  const vorher={};for(const id of ids.fest)vorher[id]=await H.belegAusgabe(page,id);
  await aendern(page);
  const abw=[];
  for(const id of ids.fest){const n=await H.belegAusgabe(page,id),nr=await page.evaluate(id=>bNr(beleg(id)),id);
    for(const t of ['druck','pdf','summen',...(BEKANNT_PDF_INFO?[]:['pdfInfo'])])if(vorher[id][t]!==n[t])abw.push(`${t} ${nr}\n${H.unterschied(vorher[id][t],n[t])}`);
    if(BEKANNT_PDF_INFO&&vorher[id].pdfInfo!==n.pdfInfo)test.info().annotations.push({type:'bekannt',description:`PDF-Datei-Info ${nr} folgt den aktuellen Stammdaten`})}
  expect(fehler).toEqual([]);
  expect(abw,'Festgeschriebene Belege haben sich durch geänderte Stammdaten verändert').toEqual([]);
});

test('Nummernkreise lückenlos, auch beim weiteren Festschreiben und nach „Zurück“',async({page})=>{
  const fehler=await oeffnen(page),ids=H.lesen(H.IDS);
  const pruefen=()=>page.evaluate(()=>{const f=[];const g={};
    for(const b of DB.belege)if(b.fest&&b.nr&&!b.rev){const k=b.typ+'|'+b.nr.split('-')[1];(g[k]||(g[k]=[])).push(+b.nr.split('-').pop())}
    for(const[k,l]of Object.entries(g)){const[t,j]=k.split('|');l.sort((a,b)=>a-b);
      if(l.some((n,i)=>n!==i+1))f.push(`${t} ${j}: Nummern ${l.join(', ')} nicht lückenlos ab 1`);
      if((S().nk[t].zaehler[j]||0)!==l.length)f.push(`${t} ${j}: Zähler ${S().nk[t].zaehler[j]} ≠ ${l.length} festgeschriebene Belege`)}
    return f});
  expect(await pruefen()).toEqual([]);
  // weiteres Angebot festschreiben → nächste Nummer, danach „Zurück“: Nummer und Festschreibung bleiben
  const r=await page.evaluate(async id=>{window.dialog=async()=>true;const b=beleg(id),z0=S().nk.AN.zaehler['2026'];await festschreiben(b);const nr=beleg(id).nr;
    const zur=zurueck();return{nr,z0,z1:S().nk.AN.zaehler['2026'],fest:beleg(id)?.fest,nrNach:beleg(id)?.nr,zur,meld:window.__meld.slice()}},ids.anP);
  expect(r.nr).toBe(`AN-2026-${String(r.z0+1).padStart(4,'0')}`);
  expect(r.fest,'Zurück darf die Festschreibung nicht aufheben').toBe(true);
  expect(r.nrNach).toBe(r.nr);
  expect(r.z1).toBe(r.z0+1);
  // erneutes Festschreiben eines festgeschriebenen Belegs vergibt keine Nummer
  const z=await page.evaluate(async id=>{const z0=S().nk.RE.zaehler['2026'];await festschreiben(beleg(id));return[z0,S().nk.RE.zaehler['2026'],beleg(id).nr]},ids.re);
  expect(z[1]).toBe(z[0]);
  expect(await pruefen()).toEqual([]);
  expect(fehler).toEqual([]);
});

test('Festgeschriebene Belege: keine Eingabefelder für Positionen und Beträge',async({page})=>{
  const fehler=await oeffnen(page),ids=H.lesen(H.IDS);
  const offen=[],felder=()=>page.evaluate(()=>[...document.querySelectorAll('#main [data-p]:is(input,select,textarea), #main [contenteditable="true"], '+
          ['pbear','padd','pneu','ptarif','pzeit','plt','partik','kopfd','phpop'].map(a=>`#main [data-act="${a}"]`).join())] // Felder bzw. Knöpfe, die Positionen oder Kopfdaten bearbeiten (Tabelle, Karten, Pop-ups)
        .map(e=>`${e.tagName.toLowerCase()} ${e.dataset.act?'data-act='+e.dataset.act:`data-p=${e.dataset.p} data-f=${e.dataset.f||e.dataset.h}`}`));
  // Gegenprobe: im Entwurf findet die Abfrage Eingabefelder (sonst prüft der Test nichts)
  await page.evaluate(()=>localStorage.setItem('erp-ansicht','form'));await H.zeichnen(page,'beleg/'+ids.gs);
  expect((await felder()).length,'Entwurf ohne Eingabefelder – Abfrage passt nicht mehr zur Oberfläche').toBeGreaterThan(0);
  for(const id of ids.fest){
    const typ=await page.evaluate(id=>beleg(id).typ,id);
    if(!['AR','TR','RE','SR','GS','ER'].includes(typ))continue; // nur Rechnungsarten sind endgültig (AN, AB, LS, BE: „Bearbeiten“ bleibt möglich)
    for(const m of ['form','vorschau']){
      await page.evaluate(m=>localStorage.setItem('erp-ansicht',m),m);await H.zeichnen(page,'beleg/'+id);
      const f=await felder();
      if(f.length)offen.push(`${typ} ${id} (${m}): ${f.slice(0,5).join('; ')}`);
    }
  }
  expect(fehler).toEqual([]);
  expect(offen).toEqual([]);
});
