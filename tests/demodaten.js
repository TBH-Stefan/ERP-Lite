// Vollständiger Demo-Datensatz für alle Bereiche (erfundene Daten). Läuft IM BROWSER nach testdaten.js (page.evaluate),
// ergänzt Belegketten, Storno, Zahlungen, Lager, Kosten, Fibu, LV, K-Blatt, Personal, Zeiten, Bautages- und Regieberichte.
// Rückgabe: weitere IDs (werden mit denen aus testdaten.js zusammengeführt).
module.exports=async function demodatenAufbauen(ids){
  window.confirm=()=>true;window.dialog=async()=>true;window.prompt=(t,d)=>d??'';window.archivBeleg=()=>{};
  const s=S(),x={},fest=async b=>{await festschreiben(b);if(!b.fest)throw new Error('Festschreiben fehlgeschlagen: '+b.typ+' '+(window.__meld||[]).join(' | '));return b};
  const kA=DB.kontakte.find(k=>k.nr==='10001'),kP=DB.kontakte.find(k=>k.nr==='10002'),lL=DB.kontakte.find(k=>k.nr==='70001');
  const K=o=>{const k={id:uid(),notiz:'',land:'Österreich',kundenart:'B2B',zahlungsziel:14,...o};DB.kontakte.push(k);return k};
  const kG=K({typ:'K',nr:'10004',name:'Gemeinde Musterdorf',strasse:'Rathausplatz 1',plz:'3100',ort:'St. Pölten',email:'amt@example.at',entfernung:42,fahrtArt:'km'});
  const lM=K({typ:'L',nr:'70002',name:'Metall Muster KG',strasse:'Werkstraße 7',plz:'8020',ort:'Graz',uid:'ATU33333333'});
  s.knr={K:10004,L:70002};x.kG=kG.id;
  // Stammdaten: Gruppen, Lagerplätze, weitere Artikel
  s.artgruppen=[{id:'g1',bez:'Installation',parent:''},{id:'g2',bez:'Kabel',parent:'g1'},{id:'g3',bez:'Leistungen',parent:''}];
  s.lagerplaetze=[{id:'l1',bez:'Lager Wien',parent:''},{id:'l2',bez:'Regal A',parent:'l1'}];
  for(const a of DB.artikel)a.gruppe=a.art==='L'?'g3':a.einheit==='m'?'g2':'g1';
  DB.artikel.filter(a=>a.lager).forEach(a=>{a.lagerplatz='l2';a.minBestand=10});
  const aV=(()=>{const a={id:uid(),nr:'00005',bez:'Verteiler 3-reihig',gruppe:'g1',lagerplatz:'l2',text:'Aufputz, IP65',art:'W',einheit:'Stk',einheiten:[],ek:48,vk:89,hk:52,vkAufschlag:70,steuer:'20',lager:true,minBestand:2,aktiv:true,
    lieferanten:[{kontaktId:lM.id,artNr:'VT-3R',lp:80,rabatt:40,ek:48,stand:'2026-09-15'}]};DB.artikel.push(a);return a})();
  s.anr=5;
  s.tarife.forEach(t=>{t.regie={SV:140,MONT:92,FAHRT:70}[t.kz]});
  s.kvListe=[{id:'kv1',bez:'KV Elektro 2026',stand:'2026-05-01',wo:38.5,gruppen:[{bez:'Monteur',lohn:19.8},{bez:'Obermonteur',lohn:22.4}]}];
  s.geraete=[{id:'ge1',bez:'Hebebühne',einheit:'h',av:4,rep:1.5,betrieb:2}];
  // Lager: Anfangsbestand
  for(const a of DB.artikel.filter(a=>a.lager))lagerBuchung({artikelId:a.id,menge:a.einheit==='m'?2000:50,preis:a.ek,datum:'2026-09-30',text:'Anfangsbestand'});
  // Belegkette aus dem festgeschriebenen Angebot: AN → AB → LS → RE, Zahlung
  const an=beleg(ids.an),ab=folge(an,'AB');ab.pos=an.pos.filter(p=>p.kz!=='ALT').map(p=>({...p,id:uid(),herkunftPosId:p.id}));await fest(ab);x.ab2=ab.id;
  const ls=folge(ab,'LS');ls.pos=ab.pos.filter(p=>['W','F'].includes(p.art)).map(p=>({...p,id:uid(),herkunftPosId:p.id}));await fest(ls);x.ls2=ls.id;
  const re=folge(ls,'RE',{leistung:'08.10.2026'});re.pos=ls.pos.map(p=>({...p,id:uid(),herkunftPosId:p.id}));await fest(re);x.re2=re.id;
  re.zahlungen.push({id:uid(),datum:'2026-10-10',betrag:r2(summen(re).brutto/2),skonto:0,art:'Bank',notiz:'Teilzahlung'});
  const reSV=beleg(ids.reSV);reSV.zahlungen.push({id:uid(),datum:'2026-10-09',betrag:r2(summen(reSV).brutto*0.98),skonto:r2(summen(reSV).brutto*0.02),art:'Bank',notiz:'mit Skonto'});
  // Anzahlung, Teil-, Schlussrechnung, Proforma
  const P=o=>neuPos(o),abA=beleg(ids.ab);
  const ar=folge(abA,'AR');ar.pos=[P({bez:'Anzahlung 30 %',menge:1,ep:r2(summen(abA).netto*0.3)})];await fest(ar);x.ar=ar.id;
  const tr=folge(abA,'TR');tr.pos=[P({bez:'Teilrechnung 1',menge:1,ep:500})];x.tr=tr.id;
  const sr=folge(abA,'SR');sr.pos=abA.pos.map(p=>({...p,id:uid(),herkunftPosId:p.id}));x.sr=sr.id;
  const pr=neuBeleg('PR',{kontaktId:kG.id,datum:'2026-10-07',betreff:'Proforma Beleuchtung'});pr.pos=[P({artikelId:aV.id,nr:aV.nr,bez:aV.bez,menge:2,ep:aV.vk,ek:aV.ek})];x.pr=pr.id;
  // Storno einer Rechnung (Storno-Gutschrift festgeschrieben)
  const reRC=beleg(ids.reRC);stornieren(reRC);const sg=DB.belege.find(b=>b.stornoVon===reRC.id);if(sg){await fest(sg);x.storno=sg.id}
  // Einkauf: Bestellung → Wareneingang → Eingangsrechnung, Lieferstatus
  const be=beleg(ids.be),we=folge(be,'WE');we.pos=be.pos.map(p=>({...p,id:uid(),herkunftPosId:p.id,menge:p.menge/2}));await fest(we);x.we=we.id;
  be.lief={abNr:'AB-77',abDatum:'2026-10-06',termin:'2026-10-09',pos:{[be.pos[1].id]:{termin:'2026-10-20'}},verlauf:[{ts:'2026-10-06T09:00:00',pos:be.pos[1].id,alt:'2026-10-09',neu:'2026-10-20',grund:'Lieferverzug'}]};
  const be2=neuBeleg('BE',{kontaktId:lM.id,datum:'2026-10-08',betreff:'Verteiler'});be2.pos=[P({artikelId:aV.id,nr:aV.nr,bez:aV.bez,menge:4,ep:48,ek:48,lnr:'VT-3R'})];x.be2=be2.id;
  // Gemeinde-Auftrag (für Berichte, Regie, Fahrt)
  const abG=neuBeleg('AB',{kontaktId:kG.id,datum:'2026-10-01',betreff:'Beleuchtung Turnsaal',projekt:'Turnsaal'});abG.pos=[P({art:'L',bez:'Montage',menge:16,einheit:'h',ep:78,ek:38,nr:'MONT',tarif:'MONT'}),P({artikelId:aV.id,nr:aV.nr,bez:aV.bez,menge:1,ep:89,ek:48})];await fest(abG);x.abG=abG.id;
  // Personal und Zeiten
  const M=o=>{const m={id:uid(),funktion:'Monteur',tarif:'MONT',kosten:'',tel:'',mail:'',strasse:'',plz:'',ort:'',eintritt:'2024-03-01',austritt:'',wochenStd:38.5,notiz:'',aktiv:true,...o};DB.mitarbeiter.push(m);return m};
  const m1=M({nr:'1',name:'Erika Test',funktion:'Obermonteurin',kosten:42}),m2=M({nr:'2',name:'Paul Probe'}),m3=M({nr:'3',name:'Ex Mitarbeiter',aktiv:false,austritt:'2026-06-30'});
  x.ma=m1.id;
  const Z=o=>{const z={id:uid(),datum:'2026-10-06',auftragId:abG.id,tarif:'MONT',stunden:0,text:'',kosten:38,vk:78,belegId:'',...o};DB.zeiten.push(z);return z};
  Z({maId:m1.id,stunden:8,text:'Kabelzug Turnsaal',von:'2026-10-06T07:00',bis:'2026-10-06T15:30',pause:30});
  Z({maId:m2.id,stunden:8,text:'Kabelzug Turnsaal',von:'2026-10-06T07:00',bis:'2026-10-06T15:30',pause:30});
  Z({maId:m1.id,datum:'2026-10-07',stunden:2,tarif:'FAHRT',kosten:30,vk:60,text:'Fahrt',reise:true});
  Z({auftragId:'',datum:'2026-10-08',stunden:1.25,text:'Ohne Auftrag (Büro)'});
  // Bautagesbericht (abgeschlossen) und Regiebericht
  const r1=btbNeu(abG.id);Object.assign(r1,{datum:'2026-10-06',ort:'Turnsaal, Rathausplatz 1, 3100 St. Pölten',verfasser:'Erika Test',km:84,
    wetter:{vm:'sonnig',nm:'bewölkt',tMin:'8',tMax:'15',beh:false,behStd:'',behTxt:''},
    personal:[{name:'Erika Test',maId:m1.id,tarif:'MONT',von:'07:00',bis:'15:30',pause:30,stunden:''},{name:'Paul Probe',maId:m2.id,tarif:'MONT',von:'07:00',bis:'15:30',pause:30,stunden:''}],
    taet:[{text:'Kabeltrassen montiert',ort:'Turnsaal'},{text:'Leuchten vorbereitet',ort:'Geräteraum'}],material:[{text:'Kabel NYM-J 3x1,5',menge:120,einheit:'m'}],geraete:[{text:'Hebebühne',stunden:4}],
    vork:{beh:'',anord:'Bauleiter: Leuchten Typ B statt A',zusatz:'',maengel:'',sicher:'Absturzsicherung geprüft'}});
  r1.abgeschlossen='2026-10-06T16:00:00';x.btb=r1.id;
  const r2_=btbNeu(abG.id,'RB');Object.assign(r2_,{datum:'2026-10-07',verfasser:'Erika Test',personal:[{name:'Erika Test',maId:m1.id,tarif:'MONT',von:'08:00',bis:'11:00',pause:0,stunden:''}],taet:[{text:'Zusatzsteckdosen auf Anordnung',ort:'Garderobe'}]});x.rb=r2_.id;
  const r3=btbNeu(beleg(ids.ab).auftragId||ids.ab);r3.datum='2026-10-08';x.btb2=r3.id;
  // Laufende Kosten, Fibu (manuelle Buchung)
  const KO=o=>{const k={id:uid(),gebucht:{},kat:'vers',partner:'',vertragNr:'',intervall:'M',ab:'2026-01-01',bis:'',kuendFrist:'',stArt:'',satz:20,konto:'',gegen:'',buchenAb:'2026-01-01',notiz:'',...o};DB.kosten.push(k);return k};
  KO({bez:'Betriebshaftpflicht',partner:'Test Versicherung',betrag:85,intervall:'M'});KO({bez:'Büromiete',kat:'miete',partner:'Vermieter Test',betrag:960,stArt:'VSt',intervall:'M'});
  const kf=KO({bez:'Kfz-Leasing',kat:'kfz',betrag:420,stArt:'VSt',intervall:'M'});try{kostenBuchen(kf,'2026-09-01',420,'2026-09-01')}catch(e){}
  FB().buchungen.push({id:uid(),datum:'2026-10-02',beleg:'K-1',text:'Bareinlage',soll:'2700',haben:'9600',betrag:500});
  // LV mit Positionen, K-Blatt
  const lv={id:uid(),nr:'LV-2026-01',titel:'Beleuchtung Turnsaal',kontaktId:kG.id,art:'angebot',kbId:ids.kb||'',schaetzung:false,nachlass:2,datum:'2026-10-02',vorb:'Vorbemerkung Test',
    items:[{id:uid(),typ:'LG',titel:'Elektroinstallation',vorb:''},{id:uid(),typ:'ULG',titel:'Leuchten',vorb:''},
      {id:uid(),typ:'POS',kurz:'LED-Hallenleuchte liefern und montieren',lang:'Ballwurfsicher, 150 W',menge:12,einheit:'Stk',art:'',modus:'man',epL:45,epS:180,k7:{zeit:0,k3Id:'',teile:[]},preise:{}},
      {id:uid(),typ:'POS',kurz:'Notlicht',lang:'',menge:4,einheit:'Stk',art:'',modus:'man',epL:20,epS:95,k7:{zeit:0,k3Id:'',teile:[]},preise:{}}],bieter:[]};
  DB.lv.push(lv);s.lvnr=1;x.lv=lv.id;
  DB.lvbib.push({id:uid(),kurz:'Steckdose Unterputz',lang:'Schuko, reinweiß',einheit:'Stk'});
  // Protokoll-/Papierkorb-Eintrag, Druckprofil-Abweichung
  const tmp=neuBeleg('AN',{kontaktId:kP.id,betreff:'Gelöschter Entwurf'});wegwerfen('belege',[tmp]);
  s.druckprofil={AN:{titel:'KOSTENVORANSCHLAG'}};
  await commit();
  return x;
};
