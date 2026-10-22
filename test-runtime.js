'use strict';
// Controller integration test in Node. DOM and drawing are stubs, not a browser/visual test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Core=require('./core.js'),Courses=require('./courses.js'),Three=require('./vendor/three.min.js');
const Sandbox=require('./sandbox.js'),Input=require('./input.js');
const context2d=new Proxy({},{get:()=>()=>{}});
const ids=new Map(),listeners=new Map();let frameCallback,now=0,drawnCamera,drawnScene,gameCanvas,blockHint=null,stored=new Map();
const knownIds=new Set([...fs.readFileSync(__dirname+'/index.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
function element(){return {checked:false,hidden:false,textContent:'',value:0,children:[],handlers:{},classList:{add(){},remove(){},toggle(){}},append(x){this.children.push(x);},replaceChildren(...xs){this.children=xs;},setAttribute(){},addEventListener(name,cb){this.handlers[name]=cb;},focus(){},getContext(){return context2d;}};}
const document={body:element(),getElementById(id){assert.ok(knownIds.has(id),'HTML 缺少 '+id);if(!ids.has(id))ids.set(id,element());return ids.get(id);},createElement:element,
 addEventListener(name,cb){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(cb);},pointerLockElement:null};
function emit(name,data={}){for(const cb of listeners.get(name)||[])cb({preventDefault(){},repeat:false,...data});}
document.exitPointerLock=()=>{document.pointerLockElement=null;emit('pointerlockchange');};
class Renderer{constructor(){this.domElement=gameCanvas=element();this.domElement.requestPointerLock=async()=>{document.pointerLockElement=this.domElement;emit('pointerlockchange');};}setPixelRatio(){}setSize(){}setClearColor(){}render(scene,camera){drawnCamera=camera;drawnScene=scene;}}
class Raycaster{setFromCamera(){}intersectObjects(batches){if(!blockHint)return [];for(const m of batches){const i=m.userData.blocks.findIndex(b=>b.x===blockHint.x&&b.y===blockHint.y&&b.z===blockHint.z);if(i>=0)return [{object:m,instanceId:i,face:{normal:new Three.Vector3(...(blockHint.normal||[0,1,0]))}}];}return [];}}
const storage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)};
let pendingSave;
const sandbox={console,document,window:{IslandCore:Core,IslandCourses:Courses,IslandSandbox:Sandbox,IslandInput:Input,confirm:()=>false,addEventListener:(name,cb)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(cb);}},THREE:{...Three,WebGLRenderer:Renderer,Raycaster},devicePixelRatio:1,innerWidth:1280,innerHeight:800,performance:{now:()=>now},localStorage:storage,matchMedia:()=>({matches:true}),setTimeout:cb=>{pendingSave=cb;return 1;},clearTimeout(){pendingSave=null;},requestAnimationFrame:cb=>{frameCallback=cb;}};
sandbox.window.THREE=sandbox.THREE;
vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),sandbox,{filename:'app.js'});
const get=id=>document.getElementById(id);
function tick(n=1){for(let i=0;i<n;i++){now+=1000/120;frameCallback(now);}}
function key(code,down){emit(down?'keydown':'keyup',{code});}
let yaw=0;
function aim(x,z){const desired=Math.atan2(-(x-drawnCamera.position.x),-(z-drawnCamera.position.z));emit('mousemove',{movementX:(yaw-desired)/.0022,movementY:0});yaw=desired;}
function walk(x,z){key('KeyW',true);for(let i=0;i<700;i++){aim(x,z);tick();if(Math.hypot(drawnCamera.position.x-x,drawnCamera.position.z-z)<.035){key('KeyW',false);tick(2);return;}}throw Error(`無法走到 ${x},${z}`);}
function crossPlatform(pt){
 const start=pt.tiles.find(t=>t.x===Math.floor(pt.entry.x)&&t.z===Math.floor(pt.entry.z));
 const end=pt.tiles.find(t=>t.x===Math.floor(pt.exit.x)&&t.z===Math.floor(pt.exit.z));
 const queue=[[start]],seen=new Set();let path;
 while(queue.length){const p=queue.shift(),last=p[p.length-1],k=`${last.x},${last.z}`;if(seen.has(k))continue;seen.add(k);if(last===end){path=p;break;}for(const next of pt.tiles)if(Math.abs(next.x-last.x)+Math.abs(next.z-last.z)===1)queue.push([...p,next]);}
 assert.ok(path);for(const t of path)walk(t.x+.5,t.z+.5);walk(pt.exit.x,pt.exit.z);
}
function jumpTo(pt){
 aim(pt.entry.x,pt.entry.z);key('KeyW',true);key('ShiftLeft',true);key('Space',true);tick();key('Space',false);
 for(let i=0;i<240;i++){
  aim(pt.entry.x,pt.entry.z);
  if(Math.hypot(drawnCamera.position.x-pt.entry.x,drawnCamera.position.z-pt.entry.z)<.04)key('KeyW',false);
  tick();
  // Finishing loads the next course and immediately returns the camera to home.
  if(pt.finish&&Math.hypot(drawnCamera.position.x-.5,drawnCamera.position.z-5.5)<.01){key('KeyW',false);key('ShiftLeft',false);return;}
  if(i>15&&Math.abs(drawnCamera.position.y-1.57-pt.y)<.002){key('KeyW',false);key('ShiftLeft',false);tick(560);return;}
 }
 throw Error('未落在平台 '+pt.id);
}
(async()=>{
 assert.equal(get('level-select').children.length,24);
 await get('start').onclick();tick(2);
 key('KeyW',true);key('ShiftLeft',true);key('Space',true);emit('mousemove',{movementX:80,movementY:-20});tick(15);
 assert.ok(drawnCamera.rotation.y<-.17);assert.ok(drawnCamera.position.y>3);assert.ok(Math.hypot(drawnCamera.position.x-.5,drawnCamera.position.z-5.5)>.7);assert.ok(get('stamina').value<100);
 key('ArrowRight',true);const oldYaw=drawnCamera.rotation.y;tick(15);assert.ok(drawnCamera.rotation.y<oldYaw-.2);
 get('level-select').onchange({target:{value:'0'}});yaw=0;tick(2);
 assert.ok(drawnScene.children.filter(m=>m.isInstancedMesh).length<30);
 drawnScene.updateMatrixWorld(true);
 const realRay=new Three.Raycaster(new Three.Vector3(-9.5,1.5,4.5),new Three.Vector3(0,0,-1),0,5);
 const realHit=realRay.intersectObjects(drawnScene.children.filter(m=>m.isInstancedMesh),false)[0];
 assert.equal(realHit.object.userData.blocks[realHit.instanceId].type,'log');assert.equal(realHit.face.normal.z,1);
 const findBlock=(x,y,z)=>drawnScene.children.filter(m=>m.isInstancedMesh).flatMap(m=>m.userData.blocks).find(b=>b.x===x&&b.y===y&&b.z===z);
 walk(-9.5,2.6);blockHint={x:-10,y:1,z:1};assert.equal(findBlock(-10,1,1).type,'log');
 gameCanvas.handlers.mousedown({button:0});tick(145);emit('mouseup',{button:0});blockHint=null;tick(360);
 assert.equal(findBlock(-10,1,1),undefined);
 key('KeyE',true);assert.equal(get('workshop').hidden,false);assert.equal(get('menu').hidden,true);
 const frozen=drawnCamera.position.clone();tick(30);assert.ok(drawnCamera.position.equals(frozen));
 assert.equal(get('inventory-grid').children.length,18);assert.equal(get('recipes').children.length,17);
 get('recipes').children[0].children[1].onclick();assert.ok(get('craft-message').textContent.includes('完成'));
 get('inventory-grid').children[Object.keys(Sandbox.items).indexOf('plank')].onclick();
 await get('workshop-close').onclick();tick(2);
 blockHint={x:-8,y:0,z:4};gameCanvas.handlers.mousedown({button:2});tick(2);blockHint=null;
 assert.equal(findBlock(-8,1,4).type,'plank');
 if(pendingSave)pendingSave();const home=JSON.parse(stored.get('sky-island-home-v3'));
 assert.ok(home.edits.some(b=>b.x===-10&&b.y===1&&b.z===1&&b.type===null));assert.ok(home.edits.some(b=>b.x===-8&&b.y===1&&b.z===4&&b.type==='plank'));
 assert.equal(home.inventory.log,0);assert.equal(home.inventory.plank,35);
 console.log('PASS 同時跳躍／滑鼠轉向／方向鍵轉向、採木拾取、工坊暫停、分解原木、選材放置及本島儲存');
 for(let level=0;level<24;level++){
  get('level-select').onchange({target:{value:String(level)}});yaw=0;tick(2);
  assert.ok(get('course-name').textContent.includes(`第 ${level+1} / 24 關`));
  walk(.5,-4.8);
  let saved=0;
  for(const pt of Courses.course(level).platforms){jumpTo(pt);if(!pt.finish){if(pt.checkpoint)saved=pt.id;assert.ok(get('checkpoint').textContent.endsWith(`重生點 ${saved||'本島'}`));crossPlatform(pt);}}
  assert.ok(get('result').textContent.includes(`第 ${level+1} 關完成`));
  assert.equal(get('checkpoint').textContent.includes('落點 0 /'),true);
  assert.ok(Math.abs(drawnCamera.position.y-2.57)<.001);
  const records=JSON.parse(stored.get('sky-island-records-v2'));assert.ok(records[level]>0);
  const next=Math.min(level+1,23);assert.equal(get('level-select').value,next);
  assert.equal(findBlock(-8,1,4).type,'plank');assert.equal(findBlock(-10,1,1),undefined);
  console.log(`PASS 第 ${level+1} 關：真實控制器輸入、跑完全部落點、自動回本島、保存成績、載入正確下一關`);
 }
 const legacyHome=JSON.parse(stored.get('sky-island-home-v3'));legacyHome.edits.push({x:-4,y:3,z:14,type:'plank'},{x:-4,y:4,z:14,type:null});stored.set('sky-island-home-v3',JSON.stringify(legacyHome));
 ids.clear();listeners.clear();document.pointerLockElement=null;pendingSave=null;
 vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8'),sandbox,{filename:'app.js'});tick(2);
 assert.equal(findBlock(-8,1,4).type,'plank');assert.equal(findBlock(-10,1,1),undefined);
 assert.equal(findBlock(-4,3,14).type,'plank');assert.equal(findBlock(-4,3,14).protected,false);assert.equal(findBlock(-4,4,14),undefined);assert.ok(get('result').textContent.includes('保留了 2'));
 assert.ok(get('hotbar').children[0].innerHTML.includes('35 個'));
 get('reset').onclick();tick();assert.equal(findBlock(-8,1,4).type,'plank');
 console.log('PASS 重啟後還原採集、建築、快捷格與庫存；新大廳重疊保留舊建築並提示；取消重設不刪除');
 console.log('PASS 啟動與 24 關選單；此測試使用繪圖替身，沒有驗證實際 WebGL 或材質畫面。');
})().catch(e=>{console.error(e);process.exitCode=1;});
