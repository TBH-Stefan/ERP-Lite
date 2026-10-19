// Erfundene Testdaten (keine Firmen- oder Kundendaten). Läuft IM BROWSER (page.evaluate) mit den Funktionen der App
// (neuBeleg, neuPos, festschreiben …); das Ergebnis wird als JSON gespeichert und in jeder geprüften Fassung gleich geladen.
// Rückgabe: Liste der IDs je Zweck, damit die Tests ohne Suchen auf die Belege zugreifen.
module.exports=async function testdatenAufbauen(){
  const ids={};
  // Rückfragen beantworten (Festschreiben, Leistungsdatum …); Meldungen sammeln
  window.__meld=[];window.alert=m=>window.__meld.push(String(m));window.confirm=()=>true;window.dialog=async()=>true;
  const s=S();
  Object.assign(s.firma,{name:'Muster Elektro GmbH',zusatz:'Elektrotechnik · Handel',strasse:'Beispielgasse 1',plz:'A-1010',ort:'Wien',land:'Österreich',
    uid:'ATU00000000',fn:'000000 x',gericht:'HG Wien',tel:'+43 1 000 00 00',mail:'office@example.at',web:'www.example.at',bank:'Testbank',iban:'AT00 0000 0000 0000 0000',bic:'TESTATWW',
    zeichner:'Max Muster',zeichnerFkt:'Geschäftsführung'});
  s.bearbeiter='Erika Test';
  s.tarife=[{kz:'SV',bez:'Sachverständigenleistung',kosten:55,vk:120},{kz:'MONT',bez:'Montage',kosten:38,vk:78},{kz:'FAHRT',bez:'Fahrtzeit',kosten:30,vk:60}];
  const K=(o)=>{const k={id:uid(),notiz:'',land:'Österreich',kundenart:'B2B',zahlungsziel:14,...o};DB.kontakte.push(k);return k};
  const kA=K({typ:'K',nr:'10001',name:'Alpha Bau GmbH',zusatz:'Bauleitung',strasse:'Ringstraße 10',plz:'1010',ort:'Wien',uid:'ATU11111111',email:'alpha@example.at',anrede:'H',titel:'Ing.',vorname:'Anton',nachname:'Alpha',rabatt:5});
  const kP=K({typ:'K',nr:'10002',name:'Berta Privat',strasse:'Gartenweg 2',plz:'2700',ort:'Wiener Neustadt',kundenart:'privat',anrede:'F',vorname:'Berta',nachname:'Privat'});
  const kD=K({typ:'K',nr:'10003',name:'Delta Industrie AG',strasse:'Hauptstraße 3',plz:'80331',ort:'München',land:'Deutschland',uid:'DE123456789'});
  const lL=K({typ:'L',nr:'70001',name:'Lux Großhandel GmbH',strasse:'Lagerweg 4',plz:'4020',ort:'Linz',uid:'ATU22222222',kdNrLief:'K-4711'});
  s.knr={K:10003,L:70001};
  const A=(o)=>{const a={id:uid(),gruppe:'',lagerplatz:'',text:'',art:'W',einheit:'Stk',einheiten:[],ek:0,vk:0,steuer:'20',lager:false,minBestand:0,lieferanten:[],aktiv:true,...o};DB.artikel.push(a);return a};
  const aK=A({nr:'00001',bez:'Kabel NYM-J 3x1,5',einheit:'m',ek:0.62,vk:1.15,pe:100,lager:true,lieferanten:[{kontaktId:lL.id,artNr:'NYM315',lp:0.95,rabatt:35,ek:0.62,stand:'2026-09-01'}]});
  const aS=A({nr:'00002',bez:'Schalter Unterputz',text:'Wechselschalter, reinweiß',ek:3.4,vk:7.9,lager:true,lieferanten:[{kontaktId:lL.id,artNr:'SW-UP',lp:5,rabatt:32,ek:3.4,stand:'2026-09-01'}]});
  const aM=A({nr:'00003',bez:'Montagestunde',art:'L',einheit:'h',ek:38,vk:78});
  const aG=A({nr:'00004',bez:'Gutachten Blitzschutz',art:'L',einheit:'Stk',ek:0,vk:450,steuer:'20'});
  s.anr=4;
  const P=o=>neuPos(o);
  const art=(a,o={})=>P({artikelId:a.id,nr:a.nr,bez:a.bez,text:a.text,art:a.art,einheit:a.einheit,ep:a.vk,ek:a.ek,...(a.pe?{pe:a.pe}:{}),...o});
  const B=(typ,k,o,pos)=>{const b=neuBeleg(typ,{kontaktId:k.id,datum:'2026-10-05',...o});b.pos=pos;return b};
  // 1 Angebot mit Gruppen, Option, Alternative, Text, Rabatt, Lohn/Sonstiges, Preiseinheit
  const g1=P({art:'G',bez:'Installation Erdgeschoß',menge:0,ep:0}),g2=P({art:'G',bez:'Optionen',menge:0,ep:0,kz:'OPT'});
  const an=B('AN',kA,{betreff:'Elektroinstallation Neubau',projekt:'Neubau Ringstraße',optRabatt:true,optLS:true},[
    g1,art(aK,{menge:250,rabatt:10}),art(aS,{menge:12}),P({art:'L',bez:'Montage Verteiler',menge:6,einheit:'h',ep:78,epL:60,epS:18,ek:38}),
    P({art:'T',bez:'Hinweis',text:'Bauseitige Stemmarbeiten sind nicht enthalten.',menge:0}),
    P({art:'W',bez:'Schalter Edelstahl (Alternative)',menge:12,ep:14.5,ek:8,kz:'ALT'}),
    g2,P({art:'W',bez:'Überspannungsschutz',menge:1,ep:390,ek:210}),P({art:'F',bez:'Kernbohrung (Fremdleistung)',menge:2,ep:85,ek:60})]);
  ids.an=an.id;
  // 2 Angebot an Privat (Kleinbetrag, 13 % und 10 %)
  ids.anP=B('AN',kP,{betreff:'Reparatur Steckdose'},[art(aM,{menge:1.5}),P({bez:'Material Kleinteile',menge:1,ep:12.4,steuer:'13'}),P({bez:'Fachbuch',menge:1,ep:29.9,steuer:'10'})]).id;
  // 3 Rechnung (wird festgeschrieben), 4 Rechnung Reverse Charge an DE, 5 Rechnung Sachverständiger
  ids.re=B('RE',kA,{betreff:'Teillieferung',leistung:'02.10.2026'},[art(aK,{menge:100}),art(aS,{menge:6,rabatt:5}),art(aM,{menge:4})]).id;
  ids.reRC=B('RE',kD,{betreff:'Lieferung Ausland',leistung:'03.10.2026'},[art(aS,{menge:40,steuer:'RC'})]).id;
  ids.reSV=B('RE',kP,{betreff:'Gutachten',leistung:'04.10.2026',skonto:2,skontoTage:7},[art(aG,{menge:1}),P({art:'L',bez:'Fahrtzeit',menge:1.5,einheit:'h',ep:60,nr:'FAHRT',tarif:'FAHRT'})]).id;
  // 6 Auftragsbestätigung, 7 Lieferschein, 8 Bestellung, 9 Eingangsrechnung
  ids.ab=B('AB',kA,{betreff:'Auftrag Neubau',bezug:'Ihre Bestellung vom 01.10.2026'},[art(aK,{menge:1500}),art(aS,{menge:24})]).id;
  ids.ls=B('LS',kA,{betreff:'Lieferung 1'},[art(aK,{menge:100}),art(aS,{menge:6})]).id;
  ids.be=B('BE',lL,{betreff:'Material Neubau'},[art(aK,{menge:500,ep:0.62,lnr:'NYM315'}),art(aS,{menge:24,ep:3.4,lnr:'SW-UP'})]).id;
  ids.er=B('ER',lL,{betreff:'Rechnung Großhandel',fremdNr:'R-2026-0815'},[P({bez:'Kabel NYM-J 3x1,5',menge:500,einheit:'m',ep:0.62,pe:100}),P({bez:'Fracht',menge:1,ep:18})]).id;
  // Zeiten, Kosten
  DB.zeiten.push({id:uid(),datum:'2026-10-06',auftragId:ids.ab,tarif:'MONT',stunden:3.5,text:'Verteiler gesetzt',kosten:38,vk:78,belegId:''});
  // K-Blatt (falls vorhanden)
  try{const kb=neueKB({name:'Kalkulation Neubau'});DB.kalk.push(kb);ids.kb=kb.id}catch(e){}
  // Festschreiben: Rechnungen, AB, LS, Bestellung, ER, erstes Angebot
  ids.fest=[ids.re,ids.reRC,ids.reSV,ids.ab,ids.ls,ids.be,ids.er,ids.an];
  for(const id of ids.fest){await festschreiben(beleg(id));if(!beleg(id).fest)throw new Error('Festschreiben fehlgeschlagen: '+id+' '+window.__meld.join(' | '))}
  // Folgebeleg: Gutschrift zur ersten Rechnung bleibt Entwurf
  ids.gs=B('GS',kA,{betreff:'Gutschrift Teillieferung',vorgaengerId:ids.re},[art(aS,{menge:-1})]).id;
  await commit();
  return ids;
};
