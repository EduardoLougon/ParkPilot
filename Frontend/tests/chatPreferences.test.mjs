import test from "node:test";
import assert from "node:assert/strict";
import {chatPreferences} from "../src/chatPreferences.js";
test("chat requests apply parking and fee choices",()=>{
 assert.deepEqual(chatPreferences("Free garages near Petco Park"),{kind:"garage",fee:"no"});
 assert.deepEqual(chatPreferences("Any parking, any price"),{kind:"all",fee:"all"});
});
test("street follow-ups match known streets without guessing unknown streets",()=>{
 assert.equal(chatPreferences("Only on Balboa Avenue",["Balboa Ave"]).street,"Balboa Ave");
 assert.equal(chatPreferences("Near Somewhere",["Balboa Ave"]).street,undefined);
 assert.equal(chatPreferences("All streets").street,"all");
});
test("does not treat avoid garages as a garage request",()=>{
 assert.equal(chatPreferences("Avoid garages").kind,undefined);
});
import {requestedArrival} from "../src/chatPreferences.js";
test("tomorrow evening is interpreted in San Diego time",()=>{
 assert.equal(requestedArrival("tomorrow at 7pm",new Date("2026-11-07T21:00:00Z")),"2026-11-09T03:00:00.000Z");
 assert.equal(requestedArrival("tomorrow at 7pm",new Date("2026-07-07T21:00:00Z")),"2026-07-09T02:00:00.000Z");
});
