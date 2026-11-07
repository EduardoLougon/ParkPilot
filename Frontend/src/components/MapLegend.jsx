const entries=[
 ["likely","Green","Likely available","Historical estimate of 60% or higher."],
 ["possible","Amber","Possibly available","Historical estimate from 30% to under 60%."],
 ["unlikely","Red","Unlikely available","Historical estimate below 30%."],
 ["free","Blue","Reported outside paid hours","Vacancy is unknown. Check posted payment rules."],
 ["unknown","Gray","Availability unknown","No occupancy estimate, including mapped lots and garages."],
 ["destination","Navy dot","Your destination","The location your parking search is centered on."]
];
export default function MapLegend(){
 return <details className="map-legend"><summary><span>Parking pin colors</span><span className="legend-preview" aria-hidden="true">{entries.slice(0,5).map(([key])=><i key={key} className={"legend-swatch "+key}/>)}</span></summary>
 <div className="legend-content"><ul>{entries.map(([key,color,title,description])=><li key={key}><span className={"legend-swatch "+key} aria-hidden="true"/><div><strong>{color} — {title}</strong><p>{description}</p></div></li>)}</ul><p className="legend-note">An outlined, enlarged pin is your selected option. Colors never guarantee an empty space.</p></div></details>
}
