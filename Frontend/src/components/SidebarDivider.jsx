import {useEffect,useState} from "react";
export default function SidebarDivider({width,onChange}){
 const [dragging,setDragging]=useState(false);
 const [viewport,setViewport]=useState(()=>window.innerWidth);
 const maximum=Math.max(300,Math.min(720,viewport-290));
 const current=Math.min(maximum,Math.max(300,width));
 useEffect(()=>{const resize=()=>setViewport(window.innerWidth);window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize)},[]);
 function update(value){onChange(Math.max(300,Math.min(maximum,value)))}
 return <div className={"sidebar-divider"+(dragging?" dragging":"")} role="separator" aria-label="Resize chat sidebar" aria-orientation="vertical" aria-valuemin={300} aria-valuemax={maximum} aria-valuenow={Math.round(current)} aria-controls="parking-sidebar" tabIndex={0}
 title="Drag to resize chat. Arrow keys adjust width; double-click to reset."
 onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setDragging(true)}}
 onPointerMove={e=>{if(!dragging)return;const left=e.currentTarget.parentElement.getBoundingClientRect().left;update(e.clientX-left)}}
 onPointerUp={e=>{setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}
 onPointerCancel={()=>setDragging(false)} onLostPointerCapture={()=>setDragging(false)}
 onDoubleClick={()=>update(410)}
 onKeyDown={e=>{const step=e.shiftKey?40:10;if(e.key==="ArrowLeft"){e.preventDefault();update(current-step)}else if(e.key==="ArrowRight"){e.preventDefault();update(current+step)}else if(e.key==="Home"){e.preventDefault();update(300)}else if(e.key==="End"){e.preventDefault();update(maximum)}}}
 ><span aria-hidden="true">⋮</span></div>
}
