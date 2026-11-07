import {useEffect,useState} from "react";
import {request} from "../api";
export default function MeterDetails({spot}){
 const [data,setData]=useState(null),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();setData(null);setError("");request("/v1/meters/"+encodeURIComponent(spot.pole_id),{signal:controller.signal}).then(setData).catch(e=>{if(!controller.signal.aborted)setError(e.message)});return()=>controller.abort()},[spot.pole_id]);
 const hours=data?.meter?.enforced_hours;
 return <><p>Meter {spot.pole_id} · {spot.area}</p><p>{spot.max_minutes?spot.max_minutes+" minute limit":"Time limit unknown"} · {spot.availability?.confidence||"Unknown"} confidence</p>{spot.limit_exceeded&&<p className="warning">Your stay exceeds this meter’s limit. Move or re-park before the limit.</p>}{spot.note&&<p>{spot.note}</p>}{hours&&<p>Enforced: {hours.day_names?.join(", ")} {hours.start_time}–{hours.end_time}</p>}{!data&&!error&&<p>Loading meter hours…</p>}{error&&<p>{error}</p>}</>
}
