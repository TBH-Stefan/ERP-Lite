// Doppelte Schlüssel in den Registern von index.html (ACT, MENUE, LIVE, FILTER, KM, V …).
// In einem Objektliteral gewinnt bei doppeltem Schlüssel still der letzte Eintrag (so entstand P0 a: kedit/kdel),
// ebenso bei Object.assign(ACT,ACT_LV,…) und ...ACT_KBW. Zur Laufzeit ist das nicht mehr sichtbar, daher Prüfung am Quelltext.
// Aufruf: node act-duplikate.js [pfad/zu/index.html]  → Ausgabe der Funde, Rückgabewert 1 bei Duplikaten
const fs=require('fs'),path=require('path'),acorn=require('acorn'),walk=require('acorn-walk');

const REG=['ACT','MENUE','LIVE','FILTER','KM','V']; // Register, deren Schlüssel eindeutig sein müssen (inkl. aller Quellen, die hineingemischt werden)

function skript(html){const m=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];if(!m.length)throw new Error('kein <script> gefunden');
  // Zeilennummern bezogen auf index.html: Zeilen vor dem Skript als Leerzeilen voranstellen
  const off=html.slice(0,m[0].index+'<script>'.length).split('\n').length-1;return'\n'.repeat(off)+m[0][1]}
const name=k=>k.type==='Identifier'?k.name:k.type==='Literal'?String(k.value):null;

function pruefen(datei=path.join(__dirname,'..','index.html')){
  const src=skript(fs.readFileSync(datei,'utf8')),ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',locations:true});
  const lit={},     // NAME → [{k,z}] aus dem Objektliteral der Deklaration (auch ...SPREAD als {spread:NAME})
        zuw={},     // NAME → [{k,z}] aus NAME.k=…
        mix={},     // NAME → [QUELLE…] aus Object.assign(NAME,QUELLE,…)
        fehler=[];
  const add=(o,n,e)=>(o[n]||(o[n]=[])).push(e);
  walk.fullAncestor(ast,(n,_s,anc)=>{
    if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&n.init?.type==='ObjectExpression'){
      const N=n.id.name;if(lit[N])return; // nur die erste (oberste) Deklaration je Name
      lit[N]=[];
      for(const p of n.init.properties){
        if(p.type==='SpreadElement'){if(p.argument.type==='Identifier')lit[N].push({spread:p.argument.name,z:p.loc.start.line});continue}
        const k=p.computed?null:name(p.key);if(k!=null)lit[N].push({k,z:p.loc.start.line})}
    }
    if(n.type==='AssignmentExpression'&&n.operator==='='&&n.left.type==='MemberExpression'&&!n.left.computed&&n.left.object.type==='Identifier'){
      // Erweiterung eines vorhandenen Eintrags (const m0=MENUE.beleg;MENUE.beleg=el=>…m0(el)…) ist kein Duplikat:
      // die Anweisung (oberste Ebene) liest den bisherigen Wert NAME.k selbst
      const N=n.left.object.name,k=n.left.property.name,top=anc[1]||n,vor=ast.body[ast.body.indexOf(top)-1],t=src.slice(vor&&/^(const|let|var)$/.test(vor.kind)?vor.start:top.start,top.end); // auch „const v0=V.x;V.x=…“ (vorige Anweisung merkt den bisherigen Wert)
      const lesen=(t.match(new RegExp('\\b'+N+'\\.'+k+'\\b(?!\\s*=[^=>])','g'))||[]).length;
      if(!lesen)add(zuw,N,{k,z:n.loc.start.line})}
    if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='Object'&&n.callee.property.name==='assign'&&n.arguments[0]?.type==='Identifier')
      for(const a of n.arguments.slice(1))if(a.type==='Identifier')add(mix,n.arguments[0].name,a.name);
  });
  // alle Schlüssel eines Registers samt Herkunft (Quelle, Zeile)
  function schluessel(N,weg=[]){
    if(weg.includes(N))return[];const r=[];
    for(const e of lit[N]||[])if(e.spread)r.push(...schluessel(e.spread,[...weg,N]));else r.push({k:e.k,z:e.z,q:N});
    for(const e of zuw[N]||[])r.push({k:e.k,z:e.z,q:N+'.'+e.k+'='});
    for(const q of mix[N]||[])r.push(...schluessel(q,[...weg,N]));
    return r}
  const geprueft=new Set();
  for(const N of [...REG,...Object.keys(lit).filter(n=>/^ACT_/.test(n))]){
    if(!lit[N]&&!zuw[N])continue;geprueft.add(N);
    const m=new Map();
    for(const e of schluessel(N)){if(!m.has(e.k))m.set(e.k,[]);m.get(e.k).push(e)}
    for(const[k,l]of m)if(l.length>1)fehler.push({reg:N,k,stellen:l.map(e=>`${e.q} Z. ${e.z}`)});
  }
  // ACT_X wird in ACT hineingemischt: Duplikate nur einmal melden (beim umfassendsten Register)
  const ein=new Map();for(const f of fehler){const id=f.k+'|'+f.stellen.join();if(!ein.has(id)||f.reg==='ACT')ein.set(id,f)}
  return{fehler:[...ein.values()],register:[...geprueft],anzahl:Object.fromEntries([...geprueft].map(N=>[N,new Set(schluessel(N).map(e=>e.k)).size]))};
}
module.exports={pruefen};

if(require.main===module){
  const r=pruefen(process.argv[2]);
  console.log('Geprüft: '+r.register.map(n=>`${n} (${r.anzahl[n]})`).join(', '));
  if(!r.fehler.length){console.log('Keine doppelten Schlüssel.');process.exit(0)}
  for(const f of r.fehler)console.log(`DOPPELT ${f.reg}.${f.k}: ${f.stellen.join(' | ')}`);
  process.exit(1);
}
