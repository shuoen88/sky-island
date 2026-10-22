'use strict';
// Regression for Start doing nothing when Pointer Lock is denied or unsupported.
// Uses a DOM/renderer substitute; does not launch a browser or verify WebGL output.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Three=require('./vendor/three.min.js');
const Core=require('./core.js'),Courses=require('./courses.js'),Sandbox=require('./sandbox.js'),Input=require('./input.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),idsInHtml=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
function make(mode){
 const ids=new Map(),listeners=new Map(),ctx=new Proxy({},{get:()=>()=>{}}),stored=new Map([['keep','user-data']]);let now=0,callback,canvas,camera,scene,requests=0,reloads=0;
 const element=()=>({children:[],handlers:{},hidden:false,disabled:false,value:0,checked:false,textContent:'',classList:{add(){},remove(){},toggle(){}},focus(){},append(x){this.children.push(x);},replaceChildren(...xs){this.children=xs;},setAttribute(){},addEventListener(n,f){this.handlers[n]=f;},getContext(){return ctx;}});
 const get=id=>{assert.ok(idsInHtml.has(id),id);if(!ids.has(id))ids.set(id,element());return ids.get(id);};
 const add=(n,f)=>{if(!listeners.has(n))listeners.set(n,[]);listeners.get(n).push(f);};
 const emit=(n,e={})=>{for(const f of listeners.get(n)||[])f({preventDefault(){},repeat:false,...e});};
 const doc={body:element(),getElementById:get,createElement:element,addEventListener:add,pointerLockElement:null,exitPointerLock(){doc.pointerLockElement=null;emit('pointerlockchange');}};
 class Renderer{constructor(){if(mode==='webgl')throw Error('No WebGL');this.domElement=canvas=element();if(mode!=='missing')canvas.requestPointerLock=()=>{requests++;if(mode==='denied')return Promise.reject(Error('Pointer Lock denied'));if(mode==='pending')return new Promise(()=>{});if(mode==='event'){emit('pointerlockerror');return;}doc.pointerLockElement=canvas;emit('pointerlockchange');return Promise.resolve();};}setPixelRatio(){}setSize(){}setClearColor(){}render(s,c){scene=s;camera=c;}}
 class Ray{setFromCamera(){}intersectObjects(batches){for(const m of batches){const i=m.userData.blocks.findIndex(b=>b.x===-8&&b.y===0&&b.z===4);if(i>=0)return [{object:m,instanceId:i,face:{normal:new Three.Vector3(0,1,0)}}];}return [];}}
 const w={IslandCore:Core,IslandCourses:Courses,IslandSandbox:Sandbox,IslandInput:mode==='dependency'?null:Input,addEventListener:add,location:{reload(){reloads++;}},confirm:()=>false};
 const env={window:w,document:doc,console,THREE:{...Three,WebGLRenderer:Renderer,Raycaster:Ray},devicePixelRatio:1,innerWidth:1280,innerHeight:800,performance:{now:()=>now},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},setTimeout(){return 1;},clearTimeout(){},matchMedia:()=>({matches:true}),requestAnimationFrame:f=>{callback=f;}};w.THREE=env.THREE;
 const context=vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/boot.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
 function tick(n=1){for(let i=0;i<n;i++){now+=1000/120;callback?.(now);}}
 const find=(x,y,z)=>scene.children.filter(m=>m.isInstancedMesh).flatMap(m=>m.userData.blocks).find(b=>b.x===x&&b.y===y&&b.z===z);
 return {get,emit,tick,stored,doc,w,find,get canvas(){return canvas;},get camera(){return camera;},get requests(){return requests;},get reloads(){return reloads;}};
}
(async()=>{
 for(const mode of ['success','denied','missing','pending','event']){
  const h=make(mode),promise=h.get('start').onclick();if(mode!=='pending')await promise;h.tick(2);
  assert.equal(h.get('menu').hidden,true,`${mode} 必須進入遊戲`);
  const before=h.camera.position.clone(),yaw=h.camera.rotation.y;
  ['KeyW','ShiftLeft','Space','ArrowRight'].forEach(code=>h.emit('keydown',{code}));h.tick(24);
  assert.ok(h.camera.position.distanceTo(before)>.7);assert.ok(h.camera.rotation.y<yaw-.3);assert.ok(h.camera.position.y>3);
  ['KeyW','ShiftLeft','Space','ArrowRight'].forEach(code=>h.emit('keyup',{code}));h.tick(100);
  if(mode!=='success'){
   const y=h.camera.rotation.y;h.emit('mousemove',{movementX:50,movementY:0,clientX:100,clientY:100});h.tick();assert.equal(h.camera.rotation.y,y,'免鎖定時游標移動不應自己轉向');
   h.emit('keydown',{code:'Digit3'});
   h.canvas.handlers.mousedown({button:2,clientX:100,clientY:100});h.emit('mousemove',{clientX:150,clientY:110});h.tick();h.emit('mouseup',{button:2});assert.ok(h.camera.rotation.y<y-.1);assert.equal(h.find(-8,1,4),undefined,'右鍵拖曳不放方塊');
   h.canvas.handlers.mousedown({button:2,clientX:100,clientY:100});h.emit('mouseup',{button:2});h.tick();assert.equal(h.find(-8,1,4).type,'plank','右鍵輕點可放置');
  }
  h.emit('keydown',{code:'Escape'});assert.equal(h.get('menu').hidden,false);const requests=h.requests;
  await h.get('start-free').onclick();assert.equal(h.requests,requests,'免鎖定按鈕不呼叫權限 API');h.tick();
  h.emit('keydown',{code:'KeyE'});assert.equal(h.get('workshop').hidden,false);await h.get('workshop-close').onclick();assert.equal(h.get('menu').hidden,true);assert.equal(h.requests,requests,'工坊返回保留免鎖定模式');
  assert.equal(h.stored.get('keep'),'user-data');
  console.log(`PASS ${mode}：開始、移動／跳躍／轉向、暫停、免鎖定按鈕與工坊返回`);
 }
 const late=make('pending');late.get('start').onclick();late.tick();late.emit('keydown',{code:'Escape'});late.doc.pointerLockElement=late.canvas;late.emit('pointerlockchange');assert.equal(late.get('menu').hidden,false);assert.equal(late.doc.pointerLockElement,null);console.log('PASS 暫停後晚到的鎖定事件不會自行恢復遊戲');
 for(const mode of ['webgl','dependency']){const h=make(mode);assert.ok(h.get('fatal').textContent.length>0);assert.equal(h.get('start').disabled,true);assert.equal(h.get('start-free').disabled,true);assert.equal(h.get('reload').hidden,false);assert.equal(h.stored.get('keep'),'user-data');console.log(`PASS ${mode}：顯示可處理的錯誤，保留存檔`);}
 const h=make('success');h.emit('error',{message:'test startup failure'});assert.ok(h.get('fatal').textContent.includes('test startup failure'));assert.equal(h.get('reload').hidden,false);assert.equal(h.get('start').disabled,true);h.get('reload').onclick();assert.equal(h.reloads,1);assert.equal(h.stored.get('keep'),'user-data');
 console.log('PASS 啟動錯誤與重新載入提示；不清除資料');
})().catch(e=>{console.error(e);process.exitCode=1;});
