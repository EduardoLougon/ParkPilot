import {wideSpots} from "./wideSpots.mjs";
﻿const cache=new Map();
let queue=Promise.resolve(),lastRequest=0;
const agent="ParkingPilotSD/1.0 (https://github.com/LiamAvigani/App1)";
export async function geocode(params){
 const key=params.toString(), hit=cache.get(key);
 if(hit&&hit.expires>Date.now())return hit.data;
 const job=queue.then(async()=>{
  await new Promise(r=>setTimeout(r,Math.max(0,1100-(Date.now()-lastRequest))));
  lastRequest=Date.now();
  const r=await fetch("https://nominatim.openstreetmap.org/search?"+key,{headers:{"User-Agent":agent},signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error("Place provider unavailable. Please retry shortly.");
  const data=await r.json();cache.set(key,{data,expires:Date.now()+600000});
  if(cache.size>200)cache.delete(cache.keys().next().value);
  return data;
 });
 queue=job.catch(()=>{});return job;
}
export function distance(lat,lon,a,b){
 const rad=x=>x*Math.PI/180,h=Math.sin(rad(a-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(a))*Math.sin(rad(b-lon)/2)**2;
 return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export async function handler(req,res,next){
 const url=new URL(req.url,"http://localhost");
 if(!url.pathname.startsWith("/discovery/"))return next();
 function send(status,data){res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data))}
 if(req.method!=="GET")return send(405,{detail:"GET required"});
 try{
 if(url.pathname==="/discovery/spots")return send(200,await wideSpots(url.searchParams));
 if(url.pathname==="/discovery/places"){
 const q=(url.searchParams.get("q")||"").trim();
 if(q.length<2||q.length>200)return send(400,{detail:"Enter 2–200 characters."});
 const data=await geocode(new URLSearchParams({q,format:"jsonv2",addressdetails:"1",limit:"12",countrycodes:"us",bounded:"1",viewbox:"-117.6,33.3,-116.8,32.5"}));
 return send(200,data);
 }
 if(url.pathname==="/discovery/parking"){
 const lat=Number(url.searchParams.get("lat")),lon=Number(url.searchParams.get("lon")),radius=Number(url.searchParams.get("radius_m")||1000);
 if(!url.searchParams.has("lat")||!url.searchParams.has("lon")||!Number.isFinite(lat)||lat<32.5||lat>33.3||!Number.isFinite(lon)||lon< -117.6||lon> -116.8||!Number.isFinite(radius)||radius<50||radius>3219)return send(400,{detail:"Choose a San Diego location and a distance between 50 meters and 2 miles."});
 const dy=radius/111320,dx=dy/Math.cos(lat*Math.PI/180);
 const data=await geocode(new URLSearchParams({q:"[parking]",format:"jsonv2",addressdetails:"1",extratags:"1",limit:"40",bounded:"1",viewbox:[lon-dx,lat+dy,lon+dx,lat-dy].join(",")}));
 const results=data.map(p=>{
 const t=p.extratags||{},d=distance(lat,lon,+p.lat,+p.lon);
 return {id:"osm-"+p.osm_type+"-"+p.osm_id,lat:+p.lat,lng:+p.lon,miles:d/1609.344,distance_m:d,walk_minutes:Math.round(d/80),kind:t.parking==="multi-storey"||t.parking==="underground"?"garage":"lot",source:"OpenStreetMap",source_url:"https://www.openstreetmap.org/"+p.osm_type+"/"+p.osm_id,access:t.access||"unknown",capacity:t.capacity||null,hours:t.opening_hours||null,status:"mapped",availability:{p_available:null,band:"unknown"},tags:{name:p.name||"Parking facility",fee:t.fee==="no"?"no":t.fee==="yes"?"yes":"unknown"},street:p.address?.road||p.address?.pedestrian||p.address?.residential||"",address:p.display_name};
 }).filter(p=>p.distance_m<=radius&&!["private","no"].includes(p.access)).sort((a,b)=>a.distance_m-b.distance_m);
 return send(200,{results,notice:"Mapped facilities, not live availability. Coverage may be incomplete. Check access and posted restrictions."});
 }
 return send(404,{detail:"Not found"});
 }catch(e){send(502,{detail:e.message})}
}
