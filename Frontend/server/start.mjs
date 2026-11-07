import http from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {handler} from "./discovery.mjs";
const root=resolve("dist");
http.createServer((req,res)=>handler(req,res,async()=>{
 try{
 const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const file=resolve(root,"."+ (pathname==="/"?"/index.html":pathname));
 if(!file.startsWith(root+sep)){res.writeHead(403);return res.end()}
 const data=await readFile(file);
 res.setHeader("Content-Type",({".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png"})[extname(file)]||"application/octet-stream");res.end(data);
 }catch{res.writeHead(404);res.end("Not found")}
})).listen(Number(process.env.PORT||3000),"0.0.0.0");
