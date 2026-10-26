// Großer Demo-Datensatz (ca. 2000 Datensätze, erfundene Daten) für Last- und Gesamtprüfung. Läuft IM BROWSER nach testdaten.js und
// demodaten.js; vorlage = Protokolle/Projekte/Vorlagen aus der kleinen Demo-Datei (werden vervielfältigt). Alle Schalter ein.
module.exports=async function demoGrossAufbauen(vorlage){
  window.confirm=()=>true;window.dialog=async()=>true;window.prompt=(t,d)=>d??'';window.archivBeleg=()=>{};
  const s=S(),stat={};let x=4711;const zf=()=>((x=(x*1103515245+12345)%2147483648)/2147483648),Z=n=>Math.floor(zf()*n),W=l=>l[Z(l.length)];
  const tag=(von,bis)=>{const a=Date.parse(von),b=Date.parse(bis);return new Date(a+zf()*(b-a)).toISOString().slice(0,10)};
  const plus=(d,n)=>new Date(Date.parse(d)+n*864e5).toISOString().slice(0,10),dat=d=>d.split('-').reverse().join('.');
  const fest=async b=>{await festschreiben(b);if(!b.fest)throw new Error('Abschließen fehlgeschlagen: '+b.typ+' '+(window.__meld||[]).join(' | '));return b};
  // Stammdaten: Kunden, Lieferanten
  const VN=['Anna','Bernd','Clara','Dieter','Eva','Franz','Gerda','Hans','Ilse','Josef','Karin','Leopold','Maria','Norbert','Olga','Peter','Rosa','Stefan','Theresia','Walter'];
  const NN=['Gruber','Huber','Bauer','Wagner','Müller','Pichler','Steiner','Moser','Mayer','Hofer','Leitner','Berger','Fuchs','Eder','Fischer','Schmid','Winkler','Weber','Schwarz','Maier'];
  const FW=['Bau','Holz','Metall','Glas','Dach','Haustechnik','Immobilien','Hotel','Gastro','Logistik','Agrar','Sport','Druck','Kfz','Medizin'];
  const FF=['GmbH','KG','OG','e.U.','GmbH & Co KG','AG'],ORT=[['1010','Wien'],['1100','Wien'],['2700','Wiener Neustadt'],['3100','St. Pölten'],['4020','Linz'],['5020','Salzburg'],['6020','Innsbruck'],['7000','Eisenstadt'],['8020','Graz'],['9020','Klagenfurt'],['2500','Baden'],['3500','Krems']];
  const STR=['Hauptstraße','Bahnhofstraße','Kirchengasse','Schulweg','Gartengasse','Industriestraße','Feldweg','Mühlgasse','Lindenallee','Dorfplatz'];
  const K=o=>{const [plz,ort]=W(ORT),k={id:uid(),notiz:'',land:'Österreich',kundenart:'B2B',zahlungsziel:W([14,14,30,7]),strasse:W(STR)+' '+(1+Z(80)),plz,ort,...o};DB.kontakte.push(k);return k};
  const kunden=[],lief=[];
  for(let i=0;i<150;i++){const pr=i%4===3,de=i%25===7,vn=W(VN),nn=W(NN);s.knr.K++;
    kunden.push(K(pr?{typ:'K',nr:String(s.knr.K),name:vn+' '+nn,kundenart:'privat',anrede:W(['H','F']),vorname:vn,nachname:nn,email:`kunde${i}@example.at`,tel:'+43 660 '+(1000000+i)}
      :{typ:'K',nr:String(s.knr.K),name:`${nn} ${W(FW)} ${W(FF)}`,uid:de?'DE'+(100000000+i):'ATU'+(10000000+i),email:`office${i}@example.at`,anrede:W(['H','F','']),titel:W(['','','Ing.','DI','Mag.']),vorname:vn,nachname:nn,rabatt:W([0,0,2,3,5]),
        ...(de?{land:'Deutschland',plz:String(80000+i),ort:'München'}:{}),entfernung:5+Z(120),fahrtArt:W(['','km','pausch'])}))}
  for(let i=0;i<30;i++){s.knr.L++;lief.push(K({typ:'L',nr:String(s.knr.L),name:`${W(NN)} ${W(['Elektrogroßhandel','Kabelwerk','Leuchten','Schaltanlagen','Werkzeug'])} ${W(FF)}`,uid:'ATU'+(20000000+i),email:`einkauf${i}@example.at`,kdNrLief:'K-'+(1000+i)}))}
  // Artikel (Waren mit Lieferanten, Preiseinheit, Lager; Leistungen)
  const AW=['Kabel NYM-J','Kabel NYY-J','Steckdose','Schalter','Abzweigdose','Leitungsschutzschalter','FI-Schutzschalter','LED-Panel','LED-Strahler','Notleuchte','Bewegungsmelder','Kabelkanal','Installationsrohr','Verteiler','Klemme','Rauchmelder','Wallbox','Zählerkasten','Erdungsband','Netzwerkdose'];
  const AV=['2x1,5','3x1,5','5x2,5','weiß','anthrazit','IP44','IP65','16 A','25 A','40 A','30 mA','600x600','10 W','20 W','Aufputz','Unterputz','M20','M25','Cat6','11 kW'];
  const artikel=[];
  for(let i=0;i<280;i++){const b=W(AW),m=/Kabel|rohr|kanal|band/i.test(b),ek=Math.round((m?0.3+zf()*4:2+zf()*400)*100)/100,l=W(lief);s.anr++;
    const a={id:uid(),nr:String(s.anr).padStart(5,'0'),bez:`${b} ${W(AV)}`,gruppe:m?'g2':'g1',lagerplatz:i%3?'':'l2',text:i%5?'':'Markenware, VDE-geprüft',art:'W',einheit:m?'m':'Stk',einheiten:[],
      ek,vk:Math.round(ek*(1.4+zf()*0.8)*100)/100,hk:i%7?undefined:Math.round(ek*1.08*100)/100,vkAufschlag:i%4?undefined:60,steuer:'20',lager:i%3===0,minBestand:i%3===0?5:0,aktiv:i%40!==39,
      ...(m&&i%2?{pe:100}:{}),lieferanten:[{kontaktId:l.id,artNr:'L'+(10000+i),lp:Math.round(ek/0.65*100)/100,rabatt:35,ek,stand:tag('2025-06-01','2026-09-30')}]};
    if(a.hk===undefined)delete a.hk;if(a.vkAufschlag===undefined)delete a.vkAufschlag;DB.artikel.push(a);artikel.push(a)}
  for(const [bez,vk,ek] of [['Elektrikerstunde',78,38],['Helferstunde',58,30],['E-Befund ÖVE/ÖNORM E 8001',380,0],['Blitzschutzprüfung',290,0],['Thermografie',450,0],['Planungsstunde',95,45]]){s.anr++;
    const a={id:uid(),nr:String(s.anr).padStart(5,'0'),bez,gruppe:'g3',lagerplatz:'',text:'',art:'L',einheit:/stunde/.test(bez)?'h':'Stk',einheiten:[],ek,vk,steuer:'20',lager:false,minBestand:0,lieferanten:[],aktiv:true};DB.artikel.push(a);artikel.push(a)}
  for(const a of artikel.filter(a=>a.lager))lagerBuchung({artikelId:a.id,menge:a.einheit==='m'?3000:200,preis:a.ek,datum:'2025-01-02',text:'Anfangsbestand'});
  const waren=artikel.filter(a=>a.art==='W'&&a.aktiv),leist=artikel.filter(a=>a.art==='L');
  // Personal
  const MA=[];for(let i=0;i<12;i++){const n=W(VN)+' '+W(NN);MA.push({id:uid(),nr:String(10+i),name:n,funktion:W(['Monteur','Obermonteur','Lehrling','Helfer']),tarif:'MONT',kosten:i%3?'':34+i,tel:'',mail:'',strasse:'',plz:'',ort:'',eintritt:'2020-0'+(1+i%9)+'-01',austritt:i===11?'2026-03-31':'',wochenStd:38.5,notiz:'',aktiv:i!==11})}
  DB.mitarbeiter.push(...MA);const maA=MA.filter(m=>m.aktiv);
  // Projekte
  const prj=[];(DB.projekte||(DB.projekte=[]));
  for(let i=0;i<25;i++){const k=kunden[(i*5)%150],p={id:uid(),nr:'2026-'+String(10+i).padStart(3,'0'),name:W(['Neubau','Umbau','Sanierung','Erweiterung','Wartung'])+' '+W(['Bürohaus','Halle','Wohnanlage','Schule','Hotel','Werkstatt'])+' '+(i+1),kontaktId:k.id,ort:k.strasse+', '+k.plz+' '+k.ort,status:W(['offen','offen','laufend','abgeschlossen']),beginn:tag('2025-03-01','2026-09-01'),notiz:'',erstellt:'2026-10-01T08:00:00.000Z'};DB.projekte.push(p);prj.push(p)}
  // Positionen
  const P=o=>neuPos(o);
  const art=(a,o={})=>P({artikelId:a.id,nr:a.nr,bez:a.bez,text:a.text,art:a.art,einheit:a.einheit,ep:a.vk,ek:a.ek,...(a.pe?{pe:a.pe}:{}),...o});
  const posListe=(gross)=>{const L=[],n=gross?18+Z(25):2+Z(8);if(gross)L.push(P({art:'G',bez:'Bauabschnitt 1',menge:0,ep:0}));
    for(let i=0;i<n;i++){if(gross&&i===Math.floor(n/2))L.push(P({art:'G',bez:'Bauabschnitt 2',menge:0,ep:0}));const a=W(waren);L.push(art(a,{menge:a.einheit==='m'?10*(1+Z(50)):1+Z(20),...(i%9===4?{rabatt:5}:{})}))}
    L.push(art(W(leist),{menge:1+Z(24)}));if(Z(4)===0)L.push(P({art:'T',bez:'Hinweis',text:'Bauseitige Leistungen sind nicht enthalten.',menge:0}));
    if(gross){L.push(P({art:'W',bez:'Option Überspannungsschutz',menge:1,ep:390,ek:210,kz:'OPT'}));L.push(P({art:'W',bez:'Alternative Edelstahl',menge:4,ep:24,ek:12,kz:'ALT'}))}
    return L};
  const kopie=(q,f=1)=>q.pos.filter(p=>p.kz!=='ALT'&&p.kz!=='OPT').map(p=>({...p,id:uid(),herkunftPosId:p.id,menge:p.art==='G'||p.art==='T'?p.menge:Math.round(p.menge*f*100)/100}));
  const belege0=DB.belege.length,abs=[];
  // Verkauf: 160 Vorgänge AN → AB → LS → RE (+ Zahlung), chronologisch
  const vg=[];for(let i=0;i<160;i++)vg.push(tag('2025-01-07','2026-09-25'));vg.sort();
  for(let i=0;i<vg.length;i++){const d=vg[i],k=W(kunden),p=prj.find(p=>p.kontaktId===k.id),gross=i%6===0;
    const an=neuBeleg('AN',{kontaktId:k.id,datum:d,betreff:(p?p.name:'Elektroarbeiten '+k.ort),projekt:p?p.name:'',optLS:i%5===0,optRabatt:i%4===0});an.pos=posListe(gross);
    const stufe=i%10;if(stufe===0)continue; // nur Angebot (Entwurf)
    await fest(an);if(stufe===1)continue;
    if(stufe===2){const r=await angebotRevision(an);if(r&&r.pos?.[1])r.pos[1].menge+=2;continue}
    const ab=folge(an,'AB');ab.datum=plus(d,3+Z(10));ab.pos=kopie(an);await fest(ab);abs.push(ab);if(stufe===3)continue;
    const ls=folge(ab,'LS');ls.datum=plus(ab.datum,5+Z(20));ls.pos=kopie(ab).filter(p=>p.art!=='L');if(ls.pos.length){await fest(ls)}
    if(stufe===4)continue;
    const re=folge(ls.pos.length?ls:ab,'RE',{leistung:dat(ls.datum)});re.datum=plus(ls.datum,1+Z(5));re.pos=kopie(ab);if(stufe===5)continue; // Rechnung im Entwurf
    await fest(re);const br=summen(re).brutto;
    if(stufe<9&&re.datum<'2026-09-01')re.zahlungen.push({id:uid(),datum:plus(re.datum,7+Z(25)),betrag:stufe===6?r2(br/2):br,skonto:0,art:W(['Bank','Bank','Bar']),notiz:''});
  }
  // Direkte Rechnungen (Sachverständige), Gutschriften, Storno, Anzahlung/Teil/Schluss, Proforma
  for(let i=0;i<70;i++){const k=W(kunden),d=tag('2025-01-10','2026-10-05');const re=neuBeleg('RE',{kontaktId:k.id,datum:d,leistung:dat(d),betreff:W(['E-Befund','Blitzschutzprüfung','Thermografie','Störungsbehebung']),skonto:i%3?0:2,skontoTage:i%3?0:7});
    re.pos=[art(W(leist),{menge:1+Z(3)}),P({art:'L',bez:'Fahrtzeit',menge:1,einheit:'h',ep:60,nr:'FAHRT',tarif:'FAHRT'}),...(k.land==='Deutschland'?[]:[art(W(waren),{menge:1+Z(5)})])];
    if(k.land==='Deutschland')re.pos.forEach(p=>p.steuer='RC');
    if(i%7===6)continue;await fest(re);if(i%3===0&&d<'2026-09-01')re.zahlungen.push({id:uid(),datum:plus(d,10),betrag:summen(re).brutto,skonto:0,art:'Bank',notiz:''});
    if(i%11===5){stornieren(re);const sg=DB.belege.find(b=>b.stornoVon===re.id);if(sg)await fest(sg)}
    if(i%13===3){const gs=neuBeleg('GS',{kontaktId:k.id,datum:plus(d,5),betreff:'Gutschrift Kulanz',vorgaengerId:re.id});gs.pos=[P({bez:'Kulanznachlass',menge:1,ep:25})];await fest(gs)}}
  for(const ab of abs.filter((b,i)=>i%5===0&&!DB.belege.some(x=>x.vorgaengerId===b.id&&x.typ==='LS'))){const ar=folge(ab,'AR');if(!ar)continue;ar.pos=[P({bez:'Anzahlung 30 %',menge:1,ep:r2(summen(ab).netto*0.3)})];await fest(ar);
    const tr=folge(ab,'TR');if(!tr)continue;tr.pos=[P({bez:'Teilrechnung 1',menge:1,ep:r2(summen(ab).netto*0.3)})];await fest(tr);const sr=folge(ab,'SR');if(sr)sr.pos=kopie(ab)}
  for(let i=0;i<8;i++){const pr=neuBeleg('PR',{kontaktId:W(kunden).id,datum:tag('2026-06-01','2026-10-10'),betreff:'Proforma Material'});pr.pos=posListe(false)}
  // Einkauf: 60 Bestellungen → Wareneingang → Eingangsrechnung, Liefertermine
  const bd=[];for(let i=0;i<60;i++)bd.push(tag('2025-01-05','2026-10-08'));bd.sort();
  for(let i=0;i<bd.length;i++){const l=W(lief),A=waren.filter(a=>a.lieferanten[0].kontaktId===l.id),q=A.length?A:waren;
    const be=neuBeleg('BE',{kontaktId:l.id,datum:bd[i],betreff:'Material Lager'});be.pos=Array.from({length:2+Z(6)},()=>{const a=W(q);return art(a,{menge:a.einheit==='m'?100*(1+Z(10)):5+Z(30),ep:a.ek,lnr:a.lieferanten[0].artNr})});
    if(i%9===8)continue;await fest(be);
    be.lief={abNr:'AB-'+(500+i),abDatum:plus(bd[i],1),termin:plus(bd[i],7+Z(20)),pos:{},verlauf:[]};
    if(i%4===0){be.lief.pos[be.pos[0].id]={termin:plus(bd[i],30)};be.lief.verlauf.push({ts:bd[i]+'T09:00:00',pos:be.pos[0].id,alt:be.lief.termin,neu:plus(bd[i],30),grund:'Lieferverzug'})}
    if(bd[i]>'2026-09-20')continue;
    const we=folge(be,'WE');we.datum=plus(bd[i],5+Z(10));we.pos=kopie(be,i%5===0?0.5:1);await fest(we);
    const er=folge(we,'ER');er.datum=plus(we.datum,2);er.fremdNr='R-'+(80000+i);er.pos=kopie(be,i%5===0?0.5:1);await fest(er);
    if(i%3)er.zahlungen.push({id:uid(),datum:plus(er.datum,14),betrag:summen(er).brutto,skonto:0,art:'Bank',notiz:''})}
  stat.belege=DB.belege.length-belege0;
  // Zeiten (mit/ohne Auftrag, Beginn/Ende) und Bautages-/Regieberichte
  const z0=DB.zeiten.length;
  for(let i=0;i<450;i++){const ab=i%12===0?null:W(abs),m=W(maA),d=ab?plus(ab.datum,Z(40)):tag('2026-01-01','2026-10-10'),h=[2,4,6,8,8,8][Z(6)],v=7+Z(2);
    DB.zeiten.push({id:uid(),datum:d,auftragId:ab?ab.auftragId||ab.id:'',maId:m.id,tarif:i%15===0?'FAHRT':'MONT',stunden:h,text:W(['Kabelzug','Verteiler montiert','Leuchten gesetzt','Prüfung','Fehlersuche','Inbetriebnahme']),kosten:38,vk:78,belegId:'',
      ...(i%2?{von:`${d}T0${v}:00`,bis:`${d}T${String(v+h).padStart(2,'0')}:30`,pause:30}:{})})}
  stat.zeiten=DB.zeiten.length-z0;const r0=DB.berichte.length;
  for(let i=0;i<70;i++){const ab=W(abs),rb=i%5===4,r=btbNeu(ab.auftragId||ab.id,rb?'RB':undefined),d=plus(ab.datum,1+Z(30)),m=W(maA),m2=W(maA);
    Object.assign(r,{datum:d,ort:W(STR)+' '+(1+Z(40)),verfasser:m.name,wetter:{vm:W(['sonnig','bewölkt','Regen']),nm:W(['sonnig','bewölkt']),tMin:String(Z(10)),tMax:String(10+Z(15)),beh:false,behStd:'',behTxt:''},
      personal:[{name:m.name,maId:m.id,tarif:'MONT',von:'07:00',bis:'15:30',pause:30,stunden:''},{name:m2.name,maId:m2.id,tarif:'MONT',von:'07:00',bis:'12:00',pause:0,stunden:''}],
      taet:[{text:W(['Kabeltrassen montiert','Verteiler gesetzt','Leuchten montiert','Messungen durchgeführt']),ort:W(['EG','OG','Keller','Halle'])}],material:[{text:W(waren).bez,menge:1+Z(50),einheit:'Stk'}],geraete:i%3?[]:[{text:'Hebebühne',stunden:2+Z(6)}],
      vork:{beh:'',anord:rb?'Zusatzarbeiten auf Anordnung Bauleitung':'',zusatz:'',maengel:'',sicher:''}});
    if(i%3===0)r.abgeschlossen=d+'T16:00:00'}
  stat.berichte=DB.berichte.length-r0;
  // Protokolle und Vorlagen (aus der kleinen Demo-Datei vervielfältigt)
  DB.protvorlagen=DB.protvorlagen||[];DB.protokolle=DB.protokolle||[];
  for(const v of vorlage.protvorlagen)DB.protvorlagen.push({...JSON.parse(JSON.stringify(v)),id:uid()});
  for(let i=0;i<40;i++){const q=JSON.parse(JSON.stringify(vorlage.protokolle[i%vorlage.protokolle.length])),p=prj[i%prj.length],ab=abs.find(b=>b.kontaktId===p.kontaktId),d=tag('2026-01-10','2026-10-10');
    Object.assign(q,{id:uid(),nr:d.replace(/-/g,'')+'-'+String(100+i),datum:d,titel:(q.titel||'Protokoll').replace(/\d+$/,'')+' '+(i+1),kontaktId:p.kontaktId,projektId:p.id,auftragId:ab?ab.auftragId||ab.id:''});
    delete q.gesperrt;delete q.hash;delete q.abgeschlossen;q.sig={};q.ausgaben=0;DB.protokolle.push(q)}
  // Laufende Kosten, Fibu, LV, K-Blätter, Textbausteine
  const k0=DB.kosten.length;
  for(const [bez,kat,betrag,iv] of [['Kfz-Versicherung','vers',140,'M'],['Telefon','sonst',65,'M'],['Software','sonst',39,'M'],['Lagermiete','miete',450,'M'],['Steuerberatung','sonst',1800,'Q'],['Kammerumlage','sonst',320,'J'],['Leasing Transporter','kfz',510,'M'],['Strom Büro','sonst',90,'M']])
    DB.kosten.push({id:uid(),gebucht:{},kat,partner:'Test Partner',vertragNr:'V-'+Z(9999),intervall:iv,ab:'2025-01-01',bis:'',kuendFrist:'',stArt:'VSt',satz:20,konto:'',gegen:'',buchenAb:'2025-01-01',notiz:'',bez,betrag});
  for(let i=0;i<60;i++)FB().buchungen.push({id:uid(),datum:tag('2025-01-05','2026-10-05'),beleg:'K-'+(100+i),text:W(['Bankspesen','Barentnahme','Porto','Tanken','Büromaterial']),soll:W(['7790','9600','7380','7320','7600']),haben:W(['2800','2700']),betrag:Math.round((5+zf()*300)*100)/100});
  for(let i=0;i<6;i++){const k=W(kunden),its=[{id:uid(),typ:'LG',titel:'Elektroinstallation',vorb:''}];
    for(let j=0;j<20;j++){if(j%7===0)its.push({id:uid(),typ:'ULG',titel:'Abschnitt '+(j/7+1),vorb:''});its.push({id:uid(),typ:'POS',kurz:W(waren).bez+' liefern und montieren',lang:'',menge:1+Z(40),einheit:'Stk',art:'',modus:'man',epL:10+Z(40),epS:5+Z(200),k7:{zeit:0,k3Id:'',teile:[]},preise:{}})}
    s.lvnr=(s.lvnr||0)+1;DB.lv.push({id:uid(),nr:'LV-2026-'+String(s.lvnr).padStart(2,'0'),titel:'Ausschreibung '+k.ort,kontaktId:k.id,art:'angebot',kbId:'',schaetzung:false,nachlass:0,datum:tag('2026-01-01','2026-10-01'),vorb:'',items:its,bieter:[]})}
  for(let i=0;i<4;i++)try{DB.kalk.push(neueKB({name:'Kalkulation '+(2025+i%2)+'-'+(i+1)}))}catch(e){}
  for(let i=0;i<40;i++)DB.lvbib.push({id:uid(),kurz:W(AW)+' '+W(AV),lang:'liefern und fachgerecht montieren',einheit:'Stk'});
  // Alle Schalter ein
  s.erw=Object.fromEntries(ERW.map(e=>[e.k,true]));
  await commit();
  const n=['kontakte','artikel','belege','lager','zeiten','berichte','mitarbeiter','projekte','protokolle','protvorlagen','kosten','lv','lvbib','kalk'].map(k=>[k,(DB[k]||[]).length]);
  n.push(['buchungen',FB().buchungen.length]);return {stat,n,summe:n.reduce((a,[,v])=>a+v,0)};
};
