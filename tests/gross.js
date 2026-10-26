// Großer Demo-Datensatz: erzeugen (testdaten + demodaten + demogross, alle Schalter ein), speichern und Last-/Ansichtsprüfung
//   node gross.js [vorlage.json] [ziel.json]   (PW_EXE=/opt/pw-browsers/chromium in der Cloud)
// Prüft jede Ansicht am Bildschirm und am Handy: Fehler, Überlauf, leer; misst die Zeichenzeit (> 1 s wird gemeldet).
const fs=require('fs'),path=require('path'),{chromium}=require('@playwright/test'),{spawn}=require('child_process');
const H=require('./hilfe'),testdaten=require('./testdaten'),demodaten=require('./demodaten'),demogross=require('./demogross');
const PORT=+process.env.PPORT||4198,URL0=`http://localhost:${PORT}/`,warte=ms=>new Promise(r=>setTimeout(r,ms));
const [,,VORLAGE='/mnt/project-files/testdaten/erp-demo-daten.json',ZIEL=path.join(H.TMP,'erp-demo-gross.json')]=process.argv;
const GER={desktop:{viewport:{width:1400,height:900}},handy:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}};
async function seite(browser,g,daten){
  const ctx=await browser.newContext({...GER[g],locale:'de-AT',timezoneId:'Europe/Vienna',baseURL:URL0});
  const page=await ctx.newPage(),t0=Date.now(),fehler=await H.starten(page,{daten,url:'/'});
  page.on('download',d=>d.cancel().catch(()=>{}));
  await page.evaluate(()=>{window.open=()=>null;window.print=()=>{};window.prompt=(t,d)=>d??'';window.dialog=async()=>true});
  return {ctx,page,fehler,start:Date.now()-t0};
}
(async()=>{
  fs.mkdirSync(H.TMP,{recursive:true});
  const srv=spawn('node',['server.js'],{cwd:__dirname,env:{...process.env,PORT:String(PORT)},stdio:'ignore'});await warte(800);
  const browser=await chromium.launch(process.env.PW_EXE?{executablePath:process.env.PW_EXE}:{});
  try{
    const v=JSON.parse(fs.readFileSync(VORLAGE,'utf8')),vorlage={protokolle:v.protokolle||[],protvorlagen:v.protvorlagen||[]};
    let {page,fehler,ctx}=await seite(browser,'desktop',null);
    const ids=await page.evaluate(`(${testdaten.toString()})()`);
    Object.assign(ids,await page.evaluate(`(${demodaten.toString()})(${JSON.stringify(ids)})`));
    const t0=Date.now(),erg=await page.evaluate(`(${demogross.toString()})(${JSON.stringify(vorlage)})`);
    console.log('Aufbau',((Date.now()-t0)/1000).toFixed(0),'s',JSON.stringify(erg));
    const daten=await page.evaluate(()=>JSON.parse(JSON.stringify(DB)));await ctx.close();
    if(fehler.length)console.log('Fehler beim Aufbau:',fehler.slice(0,10));
    fs.writeFileSync(ZIEL,JSON.stringify(daten));fs.writeFileSync(path.join(H.TMP,'gross-ids.json'),JSON.stringify(ids));
    console.log('Datei',ZIEL,(fs.statSync(ZIEL).size/1e6).toFixed(1),'MB');
    for(const g of ['desktop','handy']){
      ({page,fehler,ctx}=await seite(browser,g,daten));const sp=await seite(browser,g,daten);await sp.ctx.close();
      const A=await page.evaluate(()=>{const l=['dash','schnell','belege/V','belege/E','auftraege','kosten','zeiten','kontakte','kontakte/K','kontakte/L','artikel','lager','auswertung','kbs','lvbib','lvs','fibu','export','einstellungen','verrechnung','lieferungen','berichte','personal','projekte','protokolle','protvorlagen','lb'];
        const nimm=(arr,n)=>arr.filter((_,i)=>i%Math.max(1,Math.floor(arr.length/n))===0).slice(0,n);
        for(const b of nimm(DB.belege,40))l.push('beleg/'+b.id);for(const k of nimm(DB.kontakte,6))l.push('kontakt/'+k.id);for(const a of nimm(DB.artikel,4))l.push('artikel/'+a.id);
        for(const b of nimm(DB.belege.filter(b=>b.typ==='AB'&&b.fest),4))l.push('auftrag/'+(b.auftragId||b.id));for(const r of nimm(DB.berichte,6))l.push('bericht/'+r.id);
        for(const p of nimm(DB.projekte||[],3))l.push('projekt/'+p.id);for(const p of nimm(DB.protokolle||[],4))l.push('protokoll/'+p.id);
        for(const m of nimm(DB.mitarbeiter,2))l.push('mitarbeiter/'+m.id);for(const x of nimm(DB.lv,2))l.push('lvs/'+x.id);return l});
      const probl=[],zeit=[];
      for(const h of A)for(const m of h.startsWith('beleg/')&&g==='desktop'?['form','vorschau','beides']:['form']){const n=fehler.length;
        const r=await page.evaluate(async([h,m])=>{try{localStorage.setItem('erp-ansicht',m)}catch(e){}const t=performance.now();let e='';
          try{history.replaceState(null,'','#/'+h);CURHASH=location.hash;render()}catch(x){e='render: '+String(x.stack||x).split('\n').slice(0,3).join(' | ')}
          const t1=performance.now();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const t2=performance.now(),mm=document.querySelector('#main'),tx=mm?.textContent||'';
          return{e,ms:Math.round(t1-t),ms2:Math.round(t2-t),sw:document.documentElement.scrollWidth,leer:!tx.trim(),nf:/nicht gefunden\./i.test(tx)}},[h,m]);
        const was=h+(m!=='form'?' ('+m+')':'');zeit.push([was,r.ms2]);
        const p=[];if(r.e)p.push(r.e);if(r.sw>GER[g].viewport.width+1)p.push('waagrechter Überlauf '+r.sw+' px');if(r.leer||r.nf)p.push('leer bzw. nicht gefunden');if(r.ms2>1000)p.push('langsam: '+r.ms2+' ms');
        p.push(...fehler.slice(n));for(const x of p)probl.push({ansicht:was,fehler:x})}
      // Suche, Speichern, Abgleich mit großer Datenmenge
      const mess=await page.evaluate(async()=>{const o={};let t=performance.now();suIndex?.();o.suIndex=Math.round(performance.now()-t);
        t=performance.now();JSON.stringify(DB);o.json=Math.round(performance.now()-t);t=performance.now();try{merge3(JSON.parse(JSON.stringify(DB)),JSON.parse(JSON.stringify(DB)),JSON.parse(JSON.stringify(DB)))}catch(e){o.merge='Fehler '+e.message}o.merge3=Math.round(performance.now()-t);
        t=performance.now();try{fibuAuto()}catch(e){o.fibu='Fehler '+e.message}o.fibuAuto=Math.round(performance.now()-t);return o});
      await ctx.close();zeit.sort((a,b)=>b[1]-a[1]);
      const out={start:sp.start,mess,langsamste:zeit.slice(0,12),ansichten:zeit.length,probleme:probl};
      fs.writeFileSync(path.join(H.TMP,`gross-${g}.json`),JSON.stringify(out,null,1));
      console.log(`\n${g}: Start ${sp.start} ms, ${zeit.length} Ansichten, ${probl.length} Probleme, Messung ${JSON.stringify(mess)}\n langsamste: ${zeit.slice(0,6).map(z=>z.join(' ')).join(', ')}`);
    }
  }finally{await browser.close();srv.kill()}
})().catch(e=>{console.error(e);process.exit(1)});
