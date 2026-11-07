import {distance} from "./discovery.mjs";
export function searchCenters(lat,lon,radius){
 if(radius<=2000)return [{lat,lon}];
 const centers=[{lat,lon}];
 for(let i=0;i<6;i++){
 const angle=i*Math.PI/3;
 const a=lat+2400*Math.sin(angle)/111320,b=lon+2400*Math.cos(angle)/(111320*Math.cos(lat*Math.PI/180));
 centers.push({lat:Math.max(32.5,Math.min(33.3,a)),lon:Math.max(-117.6,Math.min(-116.8,b))});
 }
 return centers;
}
export function mergeSpots(responses,lat,lon,radius){
 const unique=new Map();
 for(const response of responses)for(const p of response.results||[]){
 const d=distance(lat,lon,p.lat,p.lon);
 if(d<=radius&&!unique.has(p.pole_id))unique.set(p.pole_id,{...p,distance_m:Math.round(d*10)/10,walk_minutes:Math.round(d/80*10)/10});
 }
 return [...unique.values()].sort((a,b)=>a.distance_m-b.distance_m);
}
export async function wideSpots(params){
 const lat=Number(params.get("lat")),lon=Number(params.get("lon")),radius=Number(params.get("radius_m"));
 if(!params.has("lat")||!params.has("lon")||!Number.isFinite(lat)||lat<32.5||lat>33.3||!Number.isFinite(lon)||lon< -117.6||lon> -116.8||!Number.isFinite(radius)||radius<50||radius>3219)throw Error("Choose a San Diego destination and a radius up to 2 miles.");
 const arrival=params.get("arrival_time")||new Date().toISOString();
 const responses=[];
 // Bounded concurrency: one request at a time; the upstream database cannot handle concurrent queries.
 const centers=searchCenters(lat,lon,radius);
 for(let i=0;i<centers.length;i+=1){
 responses.push(...await Promise.all(centers.slice(i,i+1).map(async c=>{
 const query=new URLSearchParams({lat:c.lat,lon:c.lon,radius_m:Math.min(radius,2000),limit:50,arrival_time:arrival});
 if(params.has("duration_minutes"))query.set("duration_minutes",params.get("duration_minutes"));
 const r=await fetch("https://san-diego-parking-backend.onrender.com/v1/spots?"+query,{signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error("Meter search unavailable. Please retry.");
 return r.json();
 })));
 }
 return {...responses[0],query:{...responses[0].query,lat,lon,radius_m:radius},results:mergeSpots(responses,lat,lon,radius),notes:["Combined nearby searches. Results may not include every meter.","Distances are straight-line estimates."]};
}
