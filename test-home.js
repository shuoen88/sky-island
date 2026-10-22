'use strict';
const assert=require('node:assert/strict'),Core=require('./core.js');
const world=Core.makeWorld();let passed=0;
function tour(name,points){const p=Core.player();for(const [x,z] of points){let arrived=false;for(let i=0;i<1500;i++){const dx=x-p.x,dz=z-p.z;if(Math.hypot(dx,dz)<.04){arrived=true;break;}Core.step(p,{x:dx,z:dz},1/120,world.blocks);}assert.ok(arrived,`${name} 在 ${x},${z} 被擋住，位置 ${p.x},${p.y},${p.z}`);assert.equal(p.y,1,'參觀路線應可直接步行，無需跳躍');}passed++;console.log('PASS '+name);}
tour('出生廣場可走入中央大廳並穿過後門',[[3.5,8.5],[3.5,19.5],[3.5,29.5]]);
tour('中央大廳可走進相連的尖塔底層',[[3.5,8.5],[3.5,19.5],[9.5,20.5],[11.5,20.5]]);
tour('中央大廳可走入西側銅頂側翼',[[3.5,8.5],[3.5,17.5],[-8.5,17.5]]);
tour('右側木構工坊可從門廊走進去',[[16.5,5.5],[22.5,8.5],[22.5,12.5]]);
tour('大廳後側連通門可直接走到開放露臺',[[3.5,8.5],[3.5,24.5],[12.5,24.5],[16.5,26.5],[16.5,30.5]]);
tour('採集與自由建築區仍可步行到達',[[-9.5,2.6],[-14.5,10.5],[-17.5,18.5]]);
tour('北側跑酷入口保持暢通',[[.5,-4.8]]);
console.log(`\n${passed} central-hall walking tours passed (physics only, no WebGL).`);
