// Doppelte Aktions- und Menüschlüssel (ACT, MENUE, LIVE, FILTER, KM, V und ACT_*) im Quelltext
const {test,expect}=require('@playwright/test');
const {pruefen}=require('./act-duplikate');
test('keine doppelten Schlüssel in ACT & Co.',()=>{
  const r=pruefen();
  expect(r.register).toContain('ACT');
  expect(r.fehler.map(f=>`${f.reg}.${f.k}: ${f.stellen.join(' | ')}`)).toEqual([]);
});
