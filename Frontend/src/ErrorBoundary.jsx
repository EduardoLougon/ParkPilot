import { Component } from "react";
export default class ErrorBoundary extends Component {
 state = {failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error){console.error("ParkingPilot rendering error",error)}
 render(){
  if(this.state.failed)return <div style={{padding:32,fontFamily:"system-ui"}} role="alert"><h1>ParkingPilot couldn’t load</h1><p>An unexpected display error occurred.</p><button onClick={()=>window.location.reload()}>Reload website</button></div>;
  return this.props.children;
 }
}
