import test from "node:test";
import assert from "node:assert/strict";
import {mergeSpots,searchCenters} from "../server/wideSpots.mjs";
import {requestedRadius} from "../src/chatPreferences.js";
test("wide search spans multiple centers and narrows search stays single",()=>{
 assert.equal(searchCenters(32.7,-117.1,3219).length,7);
 assert.equal(searchCenters(32.7,-117.1,1000).length,1);
});
test("merges duplicate meters and removes results outside requested radius",()=>{
 const p={pole_id:"a",lat:32.7,lon:-117.1};
 const merged=mergeSpots([{results:[p]},{results:[p,{pole_id:"b",lat:33.2,lon:-117.1}]}],32.7,-117.1,3219);
 assert.equal(merged.length,1);assert.equal(merged[0].distance_m,0);
});
test("chat radius converts miles and respects maximum",()=>{
 assert.equal(requestedRadius("garages within 2 miles"),3219);
 assert.equal(requestedRadius("within 5 miles"),3219);
 assert.equal(requestedRadius("stay 2 hours"),null);
});
