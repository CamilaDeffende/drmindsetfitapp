/* eslint-disable no-console */
const assert = require("node:assert/strict");

function toRad(v){ return v*Math.PI/180; }
const R = 6371000;
function haversineM(a,b){
  const dLat = toRad(b.lat-a.lat);
  const dLng = toRad(b.lng-a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s = Math.sin(dLat/2)**2 + Math.sin(dLng/2)**2 * Math.cos(lat1)*Math.cos(lat2);
  return 2*R*Math.asin(Math.min(1, Math.sqrt(s)));
}
function paceSecPerKm(distanceM, durationS){
  if (distanceM<=0 || durationS<=0) return null;
  const km = distanceM/1000;
  if (km<=0) return null;
  return durationS/km;
}
function buildSplits(points, splitEveryM){
  if (points.length<2) return [];
  const splits=[];
  let acc=0;
  let splitStartT=points[0].t;
  for(let i=1;i<points.length;i++){
    const d=haversineM(points[i-1], points[i]);
    acc+=d;
    while(acc>=splitEveryM){
      const endT=points[i].t;
      const durS=Math.max(1, Math.round((endT-splitStartT)/1000));
      const p=paceSecPerKm(splitEveryM, durS);
      splits.push({ idx:splits.length+1, durationS:durS, paceSecPerKm:p });
      acc-=splitEveryM;
      splitStartT=points[i].t;
    }
  }
  return splits;
}

(function main(){
  const a={lat:-22.9068,lng:-43.1729,t:0};
  const b={lat:-22.9068,lng:-43.1719,t:1000};
  const d=haversineM(a,b);
  assert.ok(d>50 && d<150, "haversine range sanity");

  const p=paceSecPerKm(1000, 300);
  assert.equal(p, 300);

  const pts=[
    {lat:0,lng:0,t:0},
    {lat:0,lng:0.009,t:300000},
    {lat:0,lng:0.018,t:600000},
  ];
  const splits=buildSplits(pts, 1000);
  assert.ok(splits.length>=1, "should have at least 1 split");
  console.log("✅ runpro_selftest OK");
})();
