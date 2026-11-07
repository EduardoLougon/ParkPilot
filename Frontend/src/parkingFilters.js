export function streetName(place) {
 const raw=place.street || place.sub_area || "";
 const street=raw.replace(/^\s*\d+\s+(?=\S)/,"").trim().replace(/\s+/g," ");
 if(!street)return "Street not listed";
 return street.toLowerCase().replace(/\bavenue\b/g,"ave").replace(/\bstreet\b/g,"st").replace(/\bboulevard\b/g,"blvd").replace(/\bdrive\b/g,"dr").replace(/\broad\b/g,"rd").replace(/\b[a-z]/g,c=>c.toUpperCase());
}
export function filterByStreet(places,street) {
 return street==="all"?places:places.filter(p=>streetName(p)===street);
}
