// Regressionstests ERP-Lite: Chromium headless, Bildschirm 1400 × 900 und Handy 390 × 844
// Ausgangsstand für den Vergleich „Schalter aus“: Umgebungsvariable BASIS (Git-Ref), Vorgabe origin/main
const {defineConfig}=require('@playwright/test');
const PORT=+process.env.PORT||4173;
module.exports=defineConfig({
  testDir:'.',
  testMatch:/.*\.spec\.js/,
  globalSetup:require.resolve('./vorbereiten.js'),
  timeout:120000,
  fullyParallel:false,
  workers:process.env.CI?2:undefined,
  reporter:process.env.CI?[['list'],['github']]:'list',
  use:{baseURL:`http://localhost:${PORT}`,browserName:'chromium',headless:true,locale:'de-AT',timezoneId:'Europe/Vienna'},
  projects:[
    {name:'quelltext',testMatch:/act\.spec\.js/},
    {name:'desktop',testIgnore:/act\.spec\.js/,use:{viewport:{width:1400,height:900}}},
    {name:'handy',testIgnore:/act\.spec\.js/,use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}},
  ],
  webServer:{command:'node server.js',url:`http://localhost:${PORT}/index.html`,reuseExistingServer:!process.env.CI,env:{PORT:String(PORT)}},
});
