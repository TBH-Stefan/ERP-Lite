// Kleiner Webserver für die Tests: / = aktueller Stand des Repositorys, /basis/ = index.html des Ausgangsstands (.tmp/basis.html)
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),PORT=+process.env.PORT||4173;
const TYP={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);
  let f=p.startsWith('/basis/')?(p==='/basis/'||p==='/basis/index.html'?path.join(__dirname,'.tmp','basis.html'):path.join(ROOT,p.slice(6))):path.join(ROOT,p.endsWith('/')?p+'index.html':p);
  if(!f.startsWith(ROOT)){res.writeHead(403);res.end();return}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('nicht gefunden');return}res.writeHead(200,{'content-type':TYP[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});res.end(d)});
}).listen(PORT,()=>console.log('Testserver auf Port '+PORT));
