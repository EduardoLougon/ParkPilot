import test from "node:test";
import assert from "node:assert/strict";
import {streetName,filterByStreet} from "../src/parkingFilters.js";
test("groups meter blocks on same street without losing ordinal street names",()=>{
 assert.equal(streetName({sub_area:"900 FOURTH AVE"}),"Fourth Ave");
 assert.equal(streetName({sub_area:"1000 FOURTH AVENUE"}),"Fourth Ave");
 assert.equal(streetName({sub_area:"700 5TH AVE"}),"5th Ave");
});
test("uses structured facility road and handles missing street",()=>{
 assert.equal(streetName({street:"Balboa Avenue",address:"Other address"}),"Balboa Ave");
 assert.equal(streetName({tags:{name:"Garage"}}),"Street not listed");
});
test("street filtering preserves order and leaves input intact",()=>{
 const items=[{sub_area:"100 FIRST ST"},{street:"Second Street"},{sub_area:"200 FIRST STREET"}];
 assert.equal(filterByStreet(items,"First St").length,2);
 assert.equal(filterByStreet(items,"Missing St").length,0);
 assert.equal(filterByStreet(items,"all").length,3);
 assert.equal(items.length,3);
});
