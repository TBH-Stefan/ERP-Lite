// Vorbereitung (einmal je Testlauf): Ausgangsstand aus Git holen, Testdaten mit dem aktuellen Stand erzeugen
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process'),{chromium}=require('@playwright/test');
const {TMP,DATEN,IDS,BASIS_INFO,starten}=require('./hilfe');
const testdatenAufbauen=require('./testdaten');
const git=(...a)=>execFileSync('git',a,{cwd:path.join(__dirname,'..'),encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:64<<20});

module.exports=async config=>{
  fs.mkdirSync(TMP,{recursive:true});
  // Ausgangsstand: BASIS (Git-Ref oder Commit), Vorgabe origin/main, sonst main
  const refs=process.env.BASIS?[process.env.BASIS]:['origin/main','main'];let info={fehlt:'Kein Ausgangsstand gefunden ('+refs.join(', ')+')'};
  for(const r of refs){try{const sha=git('rev-parse','--verify',r+'^{commit}').trim();fs.writeFileSync(path.join(TMP,'basis.html'),git('show',sha+':index.html'));info={ref:r,sha};break}catch(e){}}
  fs.writeFileSync(BASIS_INFO,JSON.stringify(info));
  console.log(info.sha?`Ausgangsstand: ${info.ref} (${info.sha.slice(0,7)})`:info.fehlt);
  // Testdaten mit dem aktuellen Stand aufbauen (Festschreiben über die App), danach als JSON für alle Fassungen
  const browser=await chromium.launch(),ctx=await browser.newContext({baseURL:config.projects[1].use.baseURL,locale:'de-AT',timezoneId:'Europe/Vienna',viewport:{width:1400,height:900}});
  const page=await ctx.newPage(),fehler=await starten(page);
  const ids=await page.evaluate(`(${testdatenAufbauen.toString()})()`);
  const daten=await page.evaluate(()=>JSON.parse(JSON.stringify(DB)));
  await browser.close();
  if(fehler.length)throw new Error('Fehler beim Aufbau der Testdaten:\n'+fehler.join('\n'));
  fs.writeFileSync(DATEN,JSON.stringify(daten));fs.writeFileSync(IDS,JSON.stringify(ids));
};
