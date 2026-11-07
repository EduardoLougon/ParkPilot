import test from "node:test";
import assert from "node:assert/strict";
import {distance,handler} from "../server/discovery.mjs";
test("distance handles same location and known latitude separation",()=>{
 assert.equal(distance(32.7,-117.1,32.7,-117.1),0);
 assert.ok(Math.abs(distance(32,-117,33,-117)-111195)<10);
});
test("invalid location is rejected without querying providers",async()=>{
 let status,body;
 await handler({method:"GET",url:"/discovery/parking?lat=0&lon=0"},{writeHead:s=>status=s,end:v=>body=JSON.parse(v)},()=>assert.fail());
 assert.equal(status,400);assert.match(body.detail,/San Diego/);
});
test("empty place query is rejected",async()=>{
 let status;
 await handler({method:"GET",url:"/discovery/places?q="},{writeHead:s=>status=s,end:()=>{}},()=>assert.fail());
 assert.equal(status,400);
});
test("unrelated route passes through",async()=>{
 let passed=false;await handler({url:"/index.html"},{},()=>passed=true);assert.equal(passed,true);
});
