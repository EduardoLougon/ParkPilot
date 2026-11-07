export function chatPreferences(text, streets=[]) {
 const result={};
 if(/\b(all parking|any parking|all types|any type)\b/i.test(text))result.kind="all";
 else if(/\b(garage|garages)\b/i.test(text)&&! /\b(no|not|avoid)\s+(garages?|parking garages?)\b/i.test(text))result.kind="garage";
 else if(/\b(parking lots?|lots only)\b/i.test(text))result.kind="lot";
 else if(/\b(street meters?|meters only|metered parking)\b/i.test(text))result.kind="meter";
 if(/\b(any price|any fee|paid is fine|free or paid)\b/i.test(text))result.fee="all";
 else if(/\b(free|no fee)\b/i.test(text)&&! /\b(not|isn't|is not)\s+free\b/i.test(text))result.fee="no";
 else if(/\bpaid parking\b/i.test(text))result.fee="yes";
 const canonical=s=>s.toLowerCase().replace(/\bavenue\b/g,"ave").replace(/\bstreet\b/g,"st").replace(/\bboulevard\b/g,"blvd").replace(/\bdrive\b/g,"dr").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
 const input=" "+canonical(text)+" ";
 const match=streets.find(s=>s!=="Street not listed"&&input.includes(" "+canonical(s)+" "));
 if(match)result.street=match;
 if(/\b(all streets|any street)\b/i.test(text))result.street="all";
 return result;
}
export function requestedArrival(text, now=new Date()){
 const match=text.match(/\b(today|tomorrow)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
 if(!match)return null;
 const hour=+match[2],minute=+(match[3]||0);
 if(hour<1||hour>12||minute>59)return null;
 const dateParts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(p=>[p.type,p.value]));
 const wall=Date.UTC(+dateParts.year,+dateParts.month-1,+dateParts.day+(match[1].toLowerCase()==="tomorrow"?1:0),hour%12+(match[4].toLowerCase()==="pm"?12:0),minute);
 let instant=wall;
 for(let i=0;i<3;i++){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
 const shown=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute);
 instant+=wall-shown;
 }
 return new Date(instant).toISOString();
}

export function requestedRadius(text){const match=text.match(/\b(?:within|radius(?: of)?|up to)\s+(\d+(?:\.\d+)?)\s*(?:miles?|mi)\b/i);return match?Math.round(Math.min(2,Math.max(.1,+match[1]))*1609.344):null;}
