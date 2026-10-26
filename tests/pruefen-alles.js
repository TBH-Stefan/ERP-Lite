// Gesamtprüfung mit dem Demo-Datensatz (nur Entwicklung, nicht Teil von `npx playwright test`):
//   node pruefen-alles.js [matrix|klick|funktion|alle] [desktop|handy]
// matrix   = jede Ansicht mit Standard, alle aus, alle ein und jedem einzelnen Schalter umgeschaltet (Fehler, Überlauf, leer)
// klick    = in jeder Ansicht jeden Knopf mit data-act anklicken (auch Einträge der ⋯-Menüs), danach Daten zurücksetzen
// funktion = Kernfunktionen direkt aufrufen (PDF, Druck, Folgebelege, Suche, Fibu, Abgleich …)
// Ergebnis: .tmp/pruefung-<modus>-<gerät>.json, Demo-Daten: .tmp/demo-daten.json
const fs=require('fs'),path=require('path'),{chromium}=require('@playwright/test'),{spawn}=require('child_process');
const H=require('./hilfe'),testdaten=require('./testdaten'),demodaten=require('./demodaten');
const PORT=+process.env.PPORT||4199,URL0=`http://localhost:${PORT}/`;
const [,,MODUS='alle',GERAET='beide']=process.argv;
const GER={desktop:{viewport:{width:1400,height:900}},handy:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}};
const warte=ms=>new Promise(r=>setTimeout(r,ms));

async function seite(browser,g,daten){
  const ctx=await browser.newContext({...GER[g],locale:'de-AT',timezoneId:'Europe/Vienna',baseURL:URL0});
  const page=await ctx.newPage(),fehler=await H.starten(page,{daten,url:'/'});
  page.on('download',d=>d.cancel().catch(()=>{}));
  await vorb(page);
  return {ctx,page,fehler};
}
const vorb=page=>page.evaluate(()=>{window.open=()=>null;window.print=()=>{};window.prompt=(t,d)=>d??'';window.dialog=async()=>true;
    window.addEventListener('unhandledrejection',e=>console.error('unhandledrejection: '+(e.reason?.stack||e.reason)));
    window.__SNAP=JSON.stringify(DB);window.__UI0=JSON.stringify(UI);
    window.__reset=()=>{document.querySelectorAll('.modal,.pop,.mbg,.ihx').forEach(e=>e.remove());DB=JSON.parse(window.__SNAP);for(const k in UI)delete UI[k];Object.assign(UI,JSON.parse(window.__UI0))}});
const pruef=page=>page.evaluate(()=>{const m=document.querySelector('#main'),t=m?.textContent||'';
  return{sw:document.documentElement.scrollWidth,leer:!t.trim(),nf:/nicht gefunden\./i.test(t),modal:[...document.querySelectorAll('.modal .mbox,.modal>div,.pop')].some(e=>e.getBoundingClientRect().right>innerWidth+2)}});
async function zeichne(page,h,m){
  return page.evaluate(async([h,m])=>{try{localStorage.setItem('erp-ansicht',m)}catch(e){}
    try{history.replaceState(null,'','#/'+h);CURHASH=location.hash;render()}catch(e){return'render: '+(e.stack||e).toString().split('\n').slice(0,3).join(' | ')}
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return''},[h,m]);
}
function ansichten(ids){
  const l=H.ansichten(ids);
  for(const k of ['an','ab2','ls2','re2','ar','tr','sr','pr','storno','we','be2','abG'])if(ids[k])l.push('beleg/'+ids[k]);
  l.push('auftrag/'+ids.abG,'kontakt/'+ids.kG,'artikel/'+ids.art,'lvs/'+ids.lv,'bericht/'+ids.btb,'bericht/'+ids.rb,'bericht/'+ids.btb2,'mitarbeiter/'+ids.ma,'schnell','lb');
  return [...new Set(l)];
}

async function matrix(browser,g,daten,ids){
  const {page,fehler}=await seite(browser,g,daten),erw=await page.evaluate(()=>ERW.map(x=>({k:x.k,std:!!x.std,l:x.l,p:x.p}))),A=ansichten(ids),probl=[];
  const konf=[['Standard','std'],['alle aus','aus'],['alle ein',Object.fromEntries(erw.map(x=>[x.k,true]))],...erw.map(x=>[`${x.k} ${x.std?'aus':'ein'}`,{[x.k]:!x.std}])];
  const modi=g==='desktop'?['form','vorschau','beides']:['form','vorschau'];
  for(const [name,w] of konf){const voll=name==='Standard'||name==='alle ein'||name==='alle aus';
    await page.evaluate(()=>window.__reset());await H.schalter(page,w);
    for(const h of A)for(const m of h.startsWith('beleg/')&&voll?modi:['form']){const n=fehler.length,e=await zeichne(page,h,m),r=await pruef(page),was=`${h}${m!=='form'?' ('+m+')':''}`;
      const p=[];if(e)p.push(e);if(r.sw>GER[g].viewport.width+1)p.push(`waagrechter Überlauf ${r.sw} px`);if(r.leer||r.nf)p.push('leer bzw. nicht gefunden');p.push(...fehler.slice(n));
      for(const x of p)probl.push({konf:name,ansicht:was,fehler:x})}
    process.stdout.write('.');
  }
  return {schalter:erw.length,konfigurationen:konf.length,ansichten:A.length,probleme:probl};
}

// alle Knöpfe einer Ansicht anklicken; ⋯-Menüs und Pop-ups eine Ebene tiefer
async function klick(browser,g,daten,ids,w){
  const {page,fehler}=await seite(browser,g,daten),A=ansichten(ids),probl=[];let n=0;
  await H.schalter(page,w);const snap=await page.evaluate(()=>window.__SNAP=JSON.stringify(DB));let letzter='';
  const knoepfe=(sel)=>page.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>!e.disabled&&e.offsetParent!==null).map((e,i)=>({i,a:e.dataset.act,t:(e.textContent||e.title||'').trim().slice(0,40)})),sel);
  const SEL='#main [data-act]:not([data-act=menue]):not([data-act=sync]),#main [data-act=menue]',SUB='.mpop [data-act],.modal [data-act]';
  const neu=async(h)=>{if(!await page.evaluate(()=>typeof window.__reset==='function').catch(()=>false)){probl.push({wo:'vorher: '+letzter,fehler:'Seite wurde neu geladen bzw. verlassen'});
    await page.goto(URL0);await page.locator('#st-cache').click();await page.waitForFunction(()=>document.body.classList.contains('loaded'));await page.evaluate(()=>{window.alert=m=>(window.__meld=window.__meld||[]).push(String(m));window.confirm=()=>true});await vorb(page);await page.evaluate(s=>{window.__SNAP=s},snap)}
    await page.evaluate(()=>window.__reset());await H.schalter(page,w);await zeichne(page,h,'form')};
  const druck=async(sel,i)=>page.evaluate(([sel,i])=>{const e=[...document.querySelectorAll(sel)].filter(e=>!e.disabled&&e.offsetParent!==null)[i];if(!e)return false;e.click();return true},[sel,i]);
  const nach=async(was)=>{await warte(60);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const r=await pruef(page);
    if(r.sw>GER[g].viewport.width+1)probl.push({wo:was,fehler:`waagrechter Überlauf ${r.sw} px`});if(r.modal)probl.push({wo:was,fehler:'Pop-up/Menü ragt über den Rand'})};
  for(const h of A){await neu(h);const K=await knoepfe(SEL);
    for(const k of K){await neu(h);const f0=fehler.length;n++;const was=`${h} › ${k.t||k.a} [${k.a}]`;letzter=was;
      try{await druck(SEL,k.i);await nach(was)}catch(e){probl.push({wo:was,fehler:'Klick: '+e.message.split('\n')[0]})}
      for(const f of fehler.slice(f0))probl.push({wo:was,fehler:f});
      const S2=await knoepfe(SUB).catch(()=>[]);
      for(const s of S2){await neu(h);await druck(SEL,k.i);await warte(30);const f1=fehler.length;n++;const w2=`${was} › ${s.t||s.a} [${s.a}]`;letzter=w2;
        try{if(!await druck(SUB,s.i))continue;await nach(w2)}catch(e){probl.push({wo:w2,fehler:'Klick: '+e.message.split('\n')[0]})}
        for(const f of fehler.slice(f1))probl.push({wo:w2,fehler:f})}
    }
    process.stdout.write('.');
  }
  return {klicks:n,probleme:probl};
}

async function funktion(browser,g,daten,ids,w){
  const {page,fehler}=await seite(browser,g,daten);await H.schalter(page,w);
  const erg=await page.evaluate(async ids=>{const P=[],T_=async(n,f)=>{try{const r=await f();if(r===false)P.push(n+': ergab false')}catch(e){P.push(n+': '+(e.stack||e).toString().split('\n').slice(0,2).join(' | '))}};
    const chk=(n,c)=>{if(!c)P.push(n)};
    for(const b of DB.belege){const t=`${b.typ} ${b.nr||'Entwurf'} (${b.betreff})`;
      await T_(t+' docHTML',()=>{docHTML(b,false);docHTML(b,true);docHTML(b,false,{dup:true})});
      await T_(t+' PDF',async()=>{const x=await pdfAusBeleg(b);chk(t+' PDF zu klein',x.size>1500)});
      await T_(t+' Summen',()=>{const s=summen(b);chk(t+' Summe brutto ≠ netto+USt',Math.abs(s.brutto-(s.netto+(s.ust??s.steuer??0)))<0.011||s.ust==null)});
      await T_(t+' Statuszeile',()=>{statusTag(b)});
      if(b.fest)for(const f of T[b.typ].folge)await T_(t+' Folgebeleg '+f,()=>{const n=DB.belege.length,x=folge(b,f);const m=(window.__meld||[]).slice(-1)[0]||'';chk(t+' Folgebeleg '+f+' nicht angelegt',(x&&DB.belege.length===n+1)||/Keine offenen Positionen/.test(m));if(x)DB.belege.splice(DB.belege.indexOf(x),1)});
    }
    await T_('Suche',()=>{const E=suIndex();chk('Suche: Index leer',E.length>20);chk('Suche „Alpha“ ohne Treffer',Object.keys(suTreffer(E,'Alpha').G).length>0)});
    await T_('Fibu Journal/Salden/GuV',()=>{const J=journal();guv(salden(J))});
    await T_('UVA',()=>{uvaZahllast?.('2026-10')});
    await T_('Abgleich merge3 mit sich selbst',()=>{const a=JSON.parse(JSON.stringify(DB));const r=merge3(a,JSON.parse(JSON.stringify(DB)),JSON.parse(JSON.stringify(DB)));chk('merge3 meldet Konflikte',!(r?.konflikte||[]).length)});
    await T_('Offene LS / Erledigung',()=>{offeneLS();for(const b of DB.belege)erledigung(b)});
    await T_('Lagerbestand',()=>{for(const a of DB.artikel)bestand(a.id)});
    await T_('Vorkalkulation',()=>{for(const b of DB.belege.filter(b=>T[b.typ].b==='V'))vorkalk(b)});
    await T_('Bautagesbericht Druckbild',()=>{for(const r of DB.berichte)btbDoc(r)});
    await T_('Lohnanteil',()=>{for(const b of DB.belege.filter(b=>T[b.typ].b==='V'))lohnAnteil(b,summen(b))});
    await T_('Archiv-Listen',()=>{if(typeof archivListen==='function')archivListen('2026')});
    await T_('Zurück/Vor',()=>{const n=DB.kontakte.length;DB.kontakte[0].notiz='x';persist();zurueck();chk('Zurück stellt nicht her',DB.kontakte[0].notiz!=='x');vor()});
    await T_('Festschreiben Entwurf + Nummernkreis',async()=>{const b=DB.belege.find(b=>!b.fest&&b.typ==='TR');if(!b)return;await festschreiben(b);chk('TR nicht festgeschrieben',b.fest&&b.nr)});
    await T_('Storno Gutschrift',async()=>{const re=DB.belege.find(b=>b.fest&&b.typ==='RE'&&!b.storno&&!DB.belege.some(x=>x.stornoVon===b.id));if(!re)return;const n=DB.belege.length;stornieren(re);chk('Storno-GS nicht angelegt',DB.belege.length===n+1)});
    return P},ids);
  return {probleme:[...erg,...fehler]};
}

(async()=>{
  fs.mkdirSync(H.TMP,{recursive:true});
  const srv=spawn('node',['server.js'],{cwd:__dirname,env:{...process.env,PORT:String(PORT)},stdio:'ignore'});await warte(800);
  const browser=await chromium.launch(process.env.PW_EXE?{executablePath:process.env.PW_EXE}:{});
  try{
    const [daten,ids]=await (async()=>{
    // Demo-Daten mit dem aktuellen Stand erzeugen (DATEN=Datei aus gross.js: diese Daten und gross-ids.json verwenden)
    if(process.env.DATEN){const daten=JSON.parse(fs.readFileSync(process.env.DATEN,'utf8')),ids=JSON.parse(fs.readFileSync(path.join(H.TMP,'gross-ids.json'),'utf8'));ids.art=daten.artikel.find(a=>a.nr==='00005').id;return [daten,ids]}
    const {page,fehler,ctx}=await seite(browser,'desktop',null);
    const ids=await page.evaluate(`(${testdaten.toString()})()`);
    Object.assign(ids,await page.evaluate(`(${demodaten.toString()})(${JSON.stringify(ids)})`));
    ids.art=await page.evaluate(()=>DB.artikel.find(a=>a.nr==='00005').id);
    const daten=await page.evaluate(()=>JSON.parse(JSON.stringify(DB)));await ctx.close();
    if(fehler.length)console.log('Fehler beim Aufbau:',fehler);
    fs.writeFileSync(path.join(H.TMP,'demo-daten.json'),JSON.stringify(daten,null,1));fs.writeFileSync(path.join(H.TMP,'demo-ids.json'),JSON.stringify(ids));
    console.log('Demo-Daten:',daten.belege.length,'Belege,',daten.kontakte.length,'Kontakte,',daten.berichte.length,'Berichte,',daten.zeiten.length,'Zeiten');
    return [daten,ids]})();
    const alleEin=await (async()=>{const {page,ctx}=await seite(browser,'desktop',daten);const e=await page.evaluate(()=>Object.fromEntries(ERW.map(x=>[x.k,true])));await ctx.close();return e})();
    for(const g of GERAET==='beide'?['desktop','handy']:[GERAET]){const out={};
      if(MODUS==='matrix'||MODUS==='alle')out.matrix=await matrix(browser,g,daten,ids);
      if(MODUS==='klick'||MODUS==='alle'){if(process.env.KONF!=='alle')out.klickStd=await klick(browser,g,daten,ids,'std');if(process.env.KONF!=='std')out.klickAlle=await klick(browser,g,daten,ids,alleEin)}
      if(MODUS==='funktion'||MODUS==='alle'){out.funktionStd=await funktion(browser,g,daten,ids,'std');out.funktionAlle=await funktion(browser,g,daten,ids,alleEin)}
      fs.writeFileSync(path.join(H.TMP,`pruefung-${MODUS}${process.env.KONF||''}-${g}.json`),JSON.stringify(out,null,1));
      console.log(`\n${g}:`,Object.entries(out).map(([k,v])=>`${k} ${v.probleme.length} Probleme`).join(', '));
    }
  }finally{await browser.close();srv.kill()}
})().catch(e=>{console.error(e);process.exit(1)});
