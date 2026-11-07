import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default function ParkingMap({center,radius,places,selected,onSelect,onCenter}){
 const host=useRef(null),map=useRef(null),layer=useRef(null),callbacks=useRef({}),viewport=useRef({center,radius});
 useEffect(()=>{viewport.current={center,radius};},[center,radius]);
 useEffect(()=>{callbacks.current={onSelect,onCenter};},[onSelect,onCenter]);
 useEffect(()=>{
  const m=L.map(host.current,{zoomControl:false}).setView([32.7157,-117.1611],14);
  map.current=m;L.control.zoom({position:"topright"}).addTo(m);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
  layer.current=L.layerGroup().addTo(m);
  m.on("click",e=>callbacks.current.onCenter({lat:e.latlng.lat,lng:e.latlng.lng,name:"Selected location"}));
  const observer=new ResizeObserver(()=>{if(host.current?.clientWidth>0&&host.current?.clientHeight>0){m.invalidateSize();const v=viewport.current;m.fitBounds(L.latLng(v.center.lat,v.center.lng).toBounds(v.radius*1609.344*2),{padding:[35,35],animate:false});}});observer.observe(host.current);
  return ()=>{observer.disconnect();m.remove()};
 },[]);
 useEffect(()=>{if(!host.current?.clientWidth||!host.current?.clientHeight)return;map.current.fitBounds(L.latLng(center.lat,center.lng).toBounds(radius*1609.344*2),{padding:[35,35]})},[center,radius]);
 useEffect(()=>{
  const group=layer.current;group.clearLayers();
  L.circle([center.lat,center.lng],{radius:radius*1609.344,color:"#25745b",weight:1,fillOpacity:.045,dashArray:"6 6",interactive:false}).addTo(group);
  L.circleMarker([center.lat,center.lng],{radius:7,color:"white",weight:3,fillColor:"#172e45",fillOpacity:1,interactive:false}).addTo(group);
  const focused=places.find(p=>p.id===selected);
  const visiblePlaces=focused?[focused]:places;
  visiblePlaces.forEach(p=>{
   const icon=L.divIcon({className:"",html:'<span class="map-pin '+(p.id===selected?'selected':'')+' '+(p.status==='unmetered_now'?'free':p.availability?.band||'unknown')+'">P</span>',iconSize:[32,36],iconAnchor:[16,36]});
   const marker=L.marker([p.lat,p.lng],{icon,keyboard:true,title:p.tags.name||"Parking"}).addTo(group);
   marker.on("click",()=>callbacks.current.onSelect(p.id));
   const label=document.createElement("span");label.textContent=p.tags.name||"Parking";marker.bindTooltip(label);
   if(p.id===selected){marker.openTooltip();map.current.panTo([p.lat,p.lng]);}
  });
 },[places,center,radius,selected]);
 return <div ref={host} className="map"/>;
}



