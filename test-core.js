'use strict';
const assert=require('node:assert/strict');
const {C,makeWorld,player,step,key,collision,mineTime,canPlace}=require('./core.js');
const Courses=require('./courses.js');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function simulate(p,seconds,input,blocks){for(let i=0;i<Math.round(seconds*120);i++)step(p,typeof input==='function'?input(i):input,1/120,blocks);}
test('衝刺速度與步行速度，斜向不加速',()=>{const a=player(),b=player(),c=player(),empty=new Map();simulate(a,1,{x:1,z:0},empty);simulate(b,1,{x:1,z:0,shift:true},empty);simulate(c,1,{x:1,z:1,shift:true},empty);assert.ok(Math.abs(a.x-.5-C.walk)<.01);assert.ok(Math.abs(b.x-.5-C.run)<.01);assert.ok(Math.abs(Math.hypot(c.x-.5,c.z-5.5)-C.run)<.01);});
test('持續 Shift 會耗盡，持續按住不會重新自動衝刺',()=>{const p=player();simulate(p,4.1,{x:1,z:0,shift:true},new Map());assert.equal(p.exhausted,true);assert.equal(p.sprinting,false);simulate(p,8,{x:1,z:0,shift:true},new Map());assert.equal(p.sprinting,false);assert.equal(p.exhausted,true);step(p,{x:0,z:0,shift:false},1/120,new Map());assert.equal(p.exhausted,false);step(p,{x:1,z:0,shift:true},1/120,new Map());assert.equal(p.sprinting,true);});
test('原地按 Shift 不扣體力，放開後延遲恢復',()=>{const p=player();simulate(p,2,{x:0,z:0,shift:true},new Map());assert.equal(p.stamina,100);simulate(p,2,{x:1,z:0,shift:true},new Map());assert.ok(Math.abs(p.stamina-50)<.01);simulate(p,.7,{x:0,z:0},new Map());assert.ok(Math.abs(p.stamina-50)<.01);simulate(p,4,{x:0,z:0},new Map());assert.equal(p.stamina,100);});
test('地板碰撞、側面阻擋、空中不能二段跳',()=>{const w=makeWorld(),p=player();simulate(p,2,{x:0,z:0},w.blocks);assert.equal(p.y,1);assert.equal(p.grounded,true);step(p,{x:0,z:0,jump:true},1/120,w.blocks);const before=p.vy;step(p,{x:0,z:0,jump:true},1/120,w.blocks);assert.ok(p.vy<before);simulate(p,1,{x:0,z:0},w.blocks);assert.equal(p.y,1);w.put(3,1,2,"stone");Object.assign(p,{x:2,y:1,z:2,vy:0});simulate(p,1,{x:1,z:0},w.blocks);assert.ok(p.x<=3-C.radius+.001);});
test('24 關所有跳躍均使用正式物理通過，包含上升與大落差',()=>{
 let jumps=0;
 for(let level=0;level<Courses.names.length;level++){
  const w=makeWorld(Courses.course(level));let previous={x:.5,y:1,z:-4.8};
  for(const pt of w.platforms){const p=player();Object.assign(p,previous);let landed=false;
   for(let i=0;i<240;i++){
    const dx=pt.entry.x-p.x,dz=pt.entry.z-p.z,dist=Math.hypot(dx,dz);
    step(p,{x:dist>.04?dx:0,z:dist>.04?dz:0,shift:true,jump:i===0},1/120,w.blocks);
    if(i>10&&p.grounded){landed=Courses.onPlatform(p,pt);break;}
   }
   assert.ok(landed,`關卡 ${level+1}，跳躍 ${pt.id}，dy=${pt.dy} gap=${pt.gap}，實際 ${JSON.stringify(p)}`);
   assert.ok(p.stamina>60);previous=pt.exit;jumps++;
  }
 }
 console.log(`  已驗證 ${jumps} 段跳躍`);
});
test('平台足跡相連，落點可沿方塊移動至下一個起跳點',()=>{for(let level=0;level<24;level++)for(const pt of Courses.course(level).platforms){const visited=new Set(),queue=[pt.tiles[0]];while(queue.length){const t=queue.pop(),k=`${t.x},${t.z}`;if(visited.has(k))continue;visited.add(k);queue.push(...pt.tiles.filter(n=>!visited.has(`${n.x},${n.z}`)&&Math.abs(n.x-t.x)+Math.abs(n.z-t.z)===1));}assert.equal(visited.size,pt.tiles.length);assert.ok(pt.tiles.some(t=>t.x===Math.floor(pt.entry.x)&&t.z===Math.floor(pt.entry.z)));}});
test('挖掘時間：泥土 0.7 秒、石頭 2 秒',()=>{assert.equal(mineTime('dirt'),.7);assert.equal(mineTime('stone'),2);});
test('禁止零庫存、與自己重疊、重複放置與超出邊界',()=>{const w=makeWorld(),p=player();assert.equal(canPlace(p,{x:1,y:1,z:5},w.blocks,0),false);assert.equal(canPlace(p,{x:0,y:1,z:5},w.blocks,1),false);assert.equal(canPlace(p,{x:0,y:0,z:5},w.blocks,1),false);assert.equal(canPlace(p,{x:2,y:1,z:5},w.blocks,1),true);assert.equal(canPlace(p,{x:32,y:1,z:5},w.blocks,1),false);});
test('全部浮島與起點安全結構均受保護',()=>{for(let level=0;level<24;level++){const w=makeWorld(Courses.course(level));for(const pt of w.platforms)for(const t of pt.tiles)assert.equal(w.blocks.get(key(t.x,pt.y-1,t.z)).protected,true);assert.equal(w.blocks.get(key(0,0,5)).protected,true);}});
test('一般落點不存重生位置，失敗回最近檢查點且進度回退',()=>{const c=Courses.course(0),run=Courses.newRun();Courses.land(run,c.platforms[0]);assert.equal(run.saved,0);assert.deepEqual(Courses.spawnFor(run,c.platforms),{x:.5,y:1,z:5.5});assert.equal(run.passed,0);c.platforms.slice(0,5).forEach(pt=>Courses.land(run,pt));assert.equal(run.saved,4);assert.equal(run.passed,5);assert.deepEqual(Courses.spawnFor(run,c.platforms),c.platforms[3].entry);assert.equal(run.passed,4);});
test('全關卡終點回本島、選下一關、最後一關不超界',()=>{for(let i=0;i<24;i++){const c=Courses.course(i),run=Courses.newRun();assert.equal(Courses.completion(run,i),null);run.elapsed=12.5;c.platforms.forEach(pt=>Courses.land(run,pt));const done=Courses.completion(run,i);assert.equal(done.next,Math.min(i+1,23));assert.equal(done.time,12.5);assert.deepEqual(done.home,{x:.5,y:1,z:5.5});assert.equal(run.finished,true);}});
test('難度遞增：跳數增加、檢查點更疏、後期小落點與落差更多',()=>{let previous=0;for(let i=0;i<24;i++){const c=Courses.course(i);assert.ok(c.count>=previous);previous=c.count;assert.ok(c.platforms.some(p=>p.dy>0));assert.ok(c.platforms.some(p=>p.dy<0));assert.ok(c.platforms.filter(p=>p.checkpoint).length<c.count/2);assert.ok(c.platforms.every(p=>p.dy<=1));}const easy=Courses.course(0),hard=Courses.course(23);assert.ok(hard.platforms.filter(p=>p.tiles.length<=2).length>easy.platforms.filter(p=>p.tiles.length<=2).length);assert.ok(Math.max(...hard.platforms.map(p=>p.y))>Math.max(...easy.platforms.map(p=>p.y)));assert.ok(hard.platforms.some(p=>p.dy===-4));});
console.log(`\n${passed} tests passed.`);
