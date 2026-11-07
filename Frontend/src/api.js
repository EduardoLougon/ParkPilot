export const API = (import.meta.env.VITE_API_URL || "https://san-diego-parking-backend.onrender.com").replace(/\/$/, "");
export async function request(path, options={}) {
 const parsed=new URL(path,"http://localhost");
 const wide=parsed.pathname==="/v1/spots"&&Number(parsed.searchParams.get("radius_m"))>2000;
 const response=await fetch(wide?"/discovery/spots"+parsed.search:API+path,{...options,signal:options.signal||AbortSignal.timeout(60000)});
 const data=await response.json();
 if(!response.ok) throw new Error(response.status===503?"The parking service is warming up. Please retry shortly.":response.status===429?"Too many requests. Please wait a moment.":typeof data.detail==="string"?data.detail:"Parking request failed. Please try again.");
 return data;
}
export function normalize(data) {
 return (data.results||[]).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>({...p,id:p.pole_id,lng:p.lon,miles:p.distance_m/1609.344,tags:{name:p.sub_area||"Meter "+p.pole_id,fee:p.status==="unmetered_now"||p.rate_per_hour===0?"no":p.rate_per_hour>0?"yes":"unknown"}}));
}
