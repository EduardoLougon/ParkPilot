import {useEffect,useMemo,useState} from "react";
import {streetName,filterByStreet} from "./parkingFilters";
import {request,normalize} from "./api";
import SidebarDivider from "./components/SidebarDivider";
import MapLegend from "./components/MapLegend";
import ParkingMap from "./components/ParkingMap";
import ParkingChat from "./components/ParkingChat";
import MeterDetails from "./components/MeterDetails";
const initial={lat:32.7157,lng:-117.1611,name:"Downtown San Diego"};
export default function App(){
 const [sidebarWidth,setSidebarWidth]=useState(()=>{try{const saved=Number(localStorage.getItem("parkingpilot-sidebar-width"));return saved>=300&&saved<=720?saved:410}catch{return 410}});
 useEffect(()=>{try{localStorage.setItem("parkingpilot-sidebar-width",String(sidebarWidth))}catch{}},[sidebarWidth]);
 const [mobileView,setMobileView]=useState("chat");
 const [street,setStreet]=useState("all"),[shown,setShown]=useState(10);
 const [center,setCenter]=useState(initial),[query,setQuery]=useState(""),[choices,setChoices]=useState([]);
 const [radius,setRadius]=useState(1000),[fee,setFee]=useState("all"),[arrival,setArrival]=useState(""),[duration,setDuration]=useState(120);
 const [facilities,setFacilities]=useState([]),[facilityError,setFacilityError]=useState(""),[facilityLoading,setFacilityLoading]=useState(false),[kind,setKind]=useState("all");
 const [data,setData]=useState(null),[chat,setChat]=useState(null),[selected,setSelected]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[searchError,setSearchError]=useState(""),[searching,setSearching]=useState(false),[retry,setRetry]=useState(0);
 function applyChat(d,prefs){setChat(d);setSelected(null);setStreet(prefs.street||"all");setShown(10);if(prefs.fee)setFee(prefs.fee);if(prefs.kind)setKind(prefs.kind);}
 function move(c){setStreet("all");setShown(10);setSelected(null);setChat(null);setCenter(c)}
 useEffect(()=>{
  const controller=new AbortController();let alive=true;
  const timer=setTimeout(()=>controller.abort(),60000);
  setLoading(true);setError("");setData(null);setSelected(null);
  const params=new URLSearchParams({lat:center.lat,lon:center.lng,radius_m:radius,limit:50,duration_minutes:duration});
  if(arrival)params.set("arrival_time",arrival+"-08:00");
  request("/v1/spots?"+params,{signal:controller.signal}).then(d=>{if(alive)setData(d)}).catch(e=>{if(alive)setError(e.name==="AbortError"?"The parking service timed out. Please retry.":e.message)}).finally(()=>{clearTimeout(timer);if(alive)setLoading(false)});
  return()=>{alive=false;clearTimeout(timer);controller.abort()};
 },[center,radius,arrival,duration,retry]);
 const active=chat||data;
 const candidates=useMemo(()=>[...normalize(active||{}).map(p=>({...p,kind:"meter"})),...facilities].filter(p=>(fee==="all"||p.tags.fee===fee)&&(kind==="all"||p.kind===kind)).sort((a,b)=>a.miles-b.miles),[active,facilities,fee,kind]);
 const streetOptions=useMemo(()=>{const counts=new Map();candidates.forEach(p=>{const name=streetName(p);counts.set(name,(counts.get(name)||0)+1)});return [...counts].sort((a,b)=>a[0].localeCompare(b[0]));},[candidates]);
 const filtered=useMemo(()=>filterByStreet(candidates,street),[candidates,street]);
 const results=filtered.slice(0,shown);
 const mapCenter=chat?.query?{lat:chat.query.lat,lng:chat.query.lon,name:"your requested destination"}:center;

 useEffect(()=>{
  const controller=new AbortController();setFacilities([]);setFacilityError("");setFacilityLoading(true);
  fetch("/discovery/parking?"+new URLSearchParams({lat:mapCenter.lat,lon:mapCenter.lng,radius_m:chat?.query?.radius_m||radius}),{signal:controller.signal})
  .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.detail);return d})
  .then(d=>setFacilities(d.results)).catch(e=>{if(!controller.signal.aborted)setFacilityError(e.message||"Lots and garages unavailable")}).finally(()=>{if(!controller.signal.aborted)setFacilityLoading(false)});
  return()=>controller.abort();
 },[mapCenter.lat,mapCenter.lng,radius,chat?.query?.radius_m]);
 async function search(e){e.preventDefault();setSearching(true);setSearchError("");setChoices([]);
 try{const r=await fetch("/discovery/places?q="+encodeURIComponent(query),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const matches=await r.json();setChoices(matches);if(!matches.length)setSearchError("No San Diego locations found. Try a full address.")}
 catch{setSearchError("Address search unavailable. Click the map to choose a location.")}finally{setSearching(false)}}
 function locate(){if(!navigator.geolocation){setSearchError("Location is unavailable in this browser.");return}
 navigator.geolocation.getCurrentPosition(p=>{move({lat:p.coords.latitude,lng:p.coords.longitude,name:"Your location"});setSearchError("")},()=>setSearchError("Location unavailable. Search an address or click the map."),{timeout:15000})}
 return <div className="app"><header><a className="brand" href="/"><span className="logo">P</span>ParkingPilot <small>SD</small></a><span className="header-note">Less circling. More exploring.</span></header><nav className="mobile-switch" aria-label="Parking view"><button type="button" aria-pressed={mobileView==="chat"} onClick={()=>setMobileView("chat")}>Chat & results</button><button type="button" aria-pressed={mobileView==="map"} onClick={()=>setMobileView("map")}>Map <span>{results.length}</span></button></nav><main className={"view-"+mobileView} style={{"--sidebar-width":sidebarWidth+"px"}}><aside id="parking-sidebar">
 <div className="intro"><span className="eyebrow">SAN DIEGO PARKING</span><h1>Where to?</h1><p>A conversation away from your next parking option.</p></div>
 <ParkingChat center={mapCenter} streets={streetOptions.map(([name])=>name)} onLocate={locate} onResults={applyChat}/>
 <p className="notice" role="status">{searchError}</p>
 <details className="manual-controls"><summary>Fine-tune or choose an exact place</summary>
 <form onSubmit={search}><label htmlFor="destination">Where are you going?</label><div className="search"><input id="destination" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try Target, a venue, or a full address" required/><button disabled={searching}>{searching?"…":"Search"}</button></div></form>
 {choices.length>0&&<ul className="choices">{choices.map(c=><li key={c.place_id}><button onClick={()=>{move({lat:+c.lat,lng:+c.lon,name:c.display_name.split(",").slice(0,2).join(",")});setChoices([]);setQuery(c.display_name)}}><b>{c.name||c.display_name.split(",")[0]}</b><small style={{display:"block",marginTop:5}}>{c.display_name}</small><small>Choose this exact destination →</small></button></li>)}</ul>}
 <button className="locate" onClick={locate}>◎ Use my location</button><p className="notice" role="status">{searchError}</p>
 <div className="destination"><b>Selected destination</b><p>{mapCenter.name}</p><small>{mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}</small></div><section className="filters"><div className="filter-heading"><h2>Your preferences</h2><button className="text-button" onClick={()=>{setChat(null);setRadius(1000);setFee("all");setKind("all");setStreet("all");setShown(10);setSelected(null);setArrival("");setDuration(120)}}>Reset</button></div>
 <label htmlFor="radius">Distance <strong>{(radius/1609.344).toFixed(2)} miles</strong></label><input id="radius" type="range" min="0.1" max="2" step="0.1" value={Math.round(radius/1609.344*10)/10} onChange={e=>{setChat(null);setRadius(Math.round(+e.target.value*1609.344));setStreet("all");setShown(10);setSelected(null)}}/><div className="range-labels"><span>0.1 mile</span><span>2 miles</span></div>
 <label htmlFor="kind">Parking type</label><select id="kind" value={kind} onChange={e=>{setKind(e.target.value);setStreet("all");setShown(10);setSelected(null)}}><option value="all">All parking</option><option value="meter">Street meters</option><option value="lot">Parking lots</option><option value="garage">Garages</option></select><details className="more-filters"><summary>Price, arrival & stay</summary><label htmlFor="fee" style={{marginTop:16}}>Parking fee</label><select id="fee" value={fee} onChange={e=>{setFee(e.target.value);setStreet("all");setShown(10);setSelected(null)}}><option value="all">Any price / unknown</option><option value="no">Free / outside enforced hours</option><option value="yes">Paid parking</option></select>
 <label htmlFor="arrival" style={{marginTop:16}}>Arrival (San Diego PST, UTC−08:00)</label><input id="arrival" type="datetime-local" value={arrival} onChange={e=>{setChat(null);setArrival(e.target.value)}}/><small>Leave blank for now. Future dates use the displayed offset.</small>
 <label htmlFor="duration" style={{marginTop:16}}>Length of stay</label><select id="duration" value={duration} onChange={e=>{setChat(null);setDuration(+e.target.value)}}>{[30,60,90,120,180,240].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></details></section>
 <div className="street-filter"><label htmlFor="street">Focus on a street</label><select id="street" value={street} onChange={e=>{setStreet(e.target.value);setShown(10);setSelected(null)}}><option value="all">All nearby streets ({candidates.length})</option>{streetOptions.map(([name,count])=><option key={name} value={name}>{name} ({count})</option>)}</select>{street!=="all"&&<button className="text-button" onClick={()=>{setStreet("all");setShown(10);setSelected(null)}}>Clear street filter</button>}</div>
 </details>
 <div className="search-context"><span>Near {mapCenter.name}</span>{active?.query?.arrival_time&&<span>Arrival: {new Date(active.query.arrival_time).toLocaleString("en-US",{timeZone:"America/Los_Angeles",dateStyle:"medium",timeStyle:"short"})} Pacific · {active.query.duration_minutes||duration} min stay</span>}<span>{kind==="all"?"All parking":kind==="garage"?"Garages":kind==="lot"?"Lots":"Meters"} · {fee==="all"?"Any price":fee==="no"?"Free":"Paid"} · {((chat?.query?.radius_m||radius)/1609.344).toFixed(2)} mi</span></div>
 {selected&&<button className="text-button" onClick={()=>setSelected(null)}>Show all parking on map</button>}<div className="results-heading"><h2>{street==="all"?"Closest parking":street}</h2><span>{results.length} of {filtered.length}</span></div><p className="area">Showing the closest {results.length} matching options on the map.</p>
 <div aria-live="polite">{facilityLoading&&<p className="notice">Finding lots and garages…</p>}{facilityError&&<p className="notice">Lots and garages: {facilityError}</p>}{!chat&&loading&&<p className="notice">Finding nearby parking…</p>}{!chat&&error&&<p className="notice">{error} <button onClick={()=>setRetry(x=>x+1)}>Retry</button></p>}{(!loading||chat)&&!facilityLoading&&!results.length&&<p className="empty">No matching parking found. Increase distance or clear filters. Some facilities are not mapped.</p>}</div>
 {results.map(p=><article id={"parking-"+p.id} key={p.id} className={selected===p.id?"card active":"card"}><button className="card-main" onClick={()=>setSelected(p.id)}><span className="parking-icon">P</span><span><b>{p.tags.name}</b><small>{streetName(p)}</small><small>{p.kind==="meter"?"Street meter":p.kind==="garage"?"Garage":"Parking lot"}</small><small>{p.status==="unmetered_now"?"Free / unenforced":p.tags.fee==="no"?"Free (mapped)":p.tags.fee==="yes"&&p.kind!=="meter"?"Paid (rate unknown)":p.rate_per_hour!=null?"$"+p.rate_per_hour.toFixed(2)+"/hr":"Rate unknown"} · {p.walk_minutes} min walk</small><small className={"band "+p.availability?.band}>{p.status==="unmetered_now"?"Outside enforcement hours":p.availability?.p_available!=null?Math.round(p.availability.p_available*100)+"% estimated available · "+p.availability.band:"Availability unknown"}</small>{p.limit_exceeded&&<small className="warning">Stay exceeds meter limit</small>}</span><strong>{p.miles.toFixed(2)}<small>mi away</small></strong></button>{selected===p.id&&<div className="details">{p.kind==="meter"?<MeterDetails spot={p}/>:<><p>{p.address}</p><p>Access: {p.access}. {p.access==="customers"?"Customers only.":""}</p><p>{p.hours||"Hours unknown"} · {p.capacity? p.capacity+" total spaces (not empty spaces)":"Capacity unknown"}</p><a href={p.source_url} target="_blank" rel="noreferrer">OpenStreetMap source ↗</a></>}<a target="_blank" rel="noreferrer" href={"https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lng+"&travelmode=driving"}>Get directions ↗</a></div>}</article>)}
 {shown<filtered.length&&<button className="show-more" onClick={()=>setShown(n=>n+10)}>Show 10 more ({filtered.length-shown} remaining)</button>}
 {shown>10&&<button className="text-button" onClick={()=>{setShown(10);setSelected(null)}}>Show only closest 10</button>}

 <footer>Lots and garages are mapped OpenStreetMap facilities; live vacancy is unknown. Customer-only restrictions may apply. Availability probabilities are historical estimates derived from City of San Diego payment transactions, not real-time parking sensors. Disabled placard holders and non-paying vehicles are not captured in payment feeds. Walking times are straight-line approximations. Check posted signs.{active?.data_as_of&&<p>Data as of {active.data_as_of}</p>}</footer>
 </aside><SidebarDivider width={sidebarWidth} onChange={setSidebarWidth}/><section className="map-panel" aria-label="Parking map"><ParkingMap center={mapCenter} radius={(chat?.query?.radius_m||radius)/1609.344} places={results} selected={selected} onSelect={setSelected} onCenter={move}/><div className="map-label"><i/> Exploring {mapCenter.name}</div>{selected&&results.some(p=>p.id===selected)&&<button className="show-all-parking" onClick={()=>setSelected(null)}>← Show all parking</button>}<MapLegend/>{selected&&results.some(p=>p.id===selected)&&<button className="mobile-map-selection" onClick={()=>{setMobileView("chat");requestAnimationFrame(()=>document.getElementById("parking-"+selected)?.scrollIntoView({block:"center",behavior:"smooth"}))}}>View {results.find(p=>p.id===selected)?.tags.name} details →</button>}</section></main></div>
}
