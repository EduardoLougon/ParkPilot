import {useEffect,useRef,useState} from "react";
import {request} from "../api";
import {chatPreferences,requestedArrival,requestedRadius} from "../chatPreferences";
export default function ParkingChat({center,onResults,streets=[],onLocate}){
 const [messages,setMessages]=useState([]),[text,setText]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const log=useRef(null),controller=useRef(null);
 useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight},[messages,busy]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function send(e){e.preventDefault();if(!text.trim()||busy)return;
 const question=text.trim(), next=[...messages,{role:"user",text:question}];
 setMessages(next);setText("");setBusy(true);setError("");
 controller.current=new AbortController();
 const timer=setTimeout(()=>controller.current?.abort(),60000);
 try{
 let data=await request("/v1/chat",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.current.signal,body:JSON.stringify({messages:next,user_location:{lat:center.lat,lon:center.lng}})});

 const arrival=requestedArrival(question);
 const requestedDistance=requestedRadius(question);
 if((arrival||requestedDistance)&&data.query){
 const params=new URLSearchParams({lat:data.query.lat,lon:data.query.lon,arrival_time:arrival||data.query.arrival_time||new Date().toISOString(),radius_m:requestedDistance||data.query.radius_m||400,limit:50});
 if(data.query.duration_minutes)params.set("duration_minutes",data.query.duration_minutes);
 const corrected=await request("/v1/spots?"+params,{signal:controller.current.signal});
 data={...data,...corrected,reply:"I updated your search for "+new Date(arrival||data.query.arrival_time||Date.now()).toLocaleString("en-US",{timeZone:"America/Los_Angeles",dateStyle:"medium",timeStyle:"short"})+" Pacific time. Your matching parking options are shown below."};
 }
 const prefs=chatPreferences(question,streets);
 if(prefs.kind&&prefs.kind!=="meter")data.reply="I�ll show "+(prefs.kind==="all"?"all parking types":prefs.kind==="garage"?"garages":"parking lots")+" near your requested destination. Mapped facilities do not report live vacancies.";

 setMessages([...next,{role:"assistant",text:data.reply||"Your search is ready."}]);
 if(Array.isArray(data.results)&&data.query&&Number.isFinite(data.query.lat)&&Number.isFinite(data.query.lon))onResults(data,prefs);
 }catch(err){setMessages(messages);setText(question);setError(err.name==="AbortError"?"That took too long. Please try again.":err.message)}
 finally{clearTimeout(timer);setBusy(false)}
 }
 return <section className="chat primary-chat">
 <div className="chat-heading"><span className="pilot-avatar">P</span><div><h2>Your parking copilot</h2><small>Tell me where you’re headed.</small></div></div>
 <div className="conversation" ref={log} role="log" aria-live="polite" aria-label="Parking conversation">
 {!messages.length&&<p className="bubble assistant">Where are you going, and when? You can ask for garages, free parking, or a particular street. I’ll update the map for you.</p>}
 {messages.map((m,i)=><p key={i} className={"bubble "+m.role}><b>{m.role==="user"?"You":"Pilot"}</b><span>{m.text}</span></p>)}
 {busy&&<p className="thinking" role="status">Looking for parking…</p>}
 </div>
 {!messages.length&&<div className="suggestions">{["Garages near Petco Park for 2 hours","Parking near Target on Balboa Avenue","Free parking near Balboa Park"].map(q=><button key={q} onClick={()=>setText(q)}>{q}</button>)}</div>}
 <form onSubmit={send}><label htmlFor="chat" className="sr-only">Tell ParkingPilot what you need</label><div className="composer"><textarea id="chat" rows={3} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit()}}} required placeholder="Where are you going? Ask me anything about parking…" maxLength={2000}/><div className="composer-actions"><button type="button" className="text-button" onClick={onLocate} disabled={busy}>◎ Use my location</button><button type="submit" disabled={busy||!text.trim()}>{busy?"Searching…":"Find parking →"}</button></div></div></form>
 {error&&<p role="alert" className="notice">{error} Your message is ready to resend.</p>}
 <p className="chat-note">Suggestions, not reservations. Live space availability isn’t verified.</p>
 </section>
}
