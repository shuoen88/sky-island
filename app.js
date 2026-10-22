/* Original game implementation. Rendering library: Three.js (MIT), vendored locally. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 if(!window.IslandCore||!window.IslandCourses||!window.IslandSandbox||!window.IslandInput){$('fatal').textContent='遊戲檔案未完整載入。請重新整理；若仍失敗，請完整解壓 ZIP，並保留所有 JS 檔和 vendor 資料夾。';$('start').disabled=true;$('start-free').disabled=true;$('reload').hidden=false;return;}
 const Core=window.IslandCore, Courses=window.IslandCourses, Sandbox=window.IslandSandbox, control=window.IslandInput.create();
 let renderer;
 try {if(!window.THREE)throw Error('繪圖函式庫未載入');renderer=new THREE.WebGLRenderer({antialias:true});}
 catch(e){$('fatal').textContent='這個瀏覽器目前無法啟動 3D。請在 Windows 資料夾雙擊 LaunchGame.cmd，以 Edge／Chrome 開啟。建築存檔沒有清除。';$('start').disabled=true;$('start-free').disabled=true;$('reload').hidden=false;return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x9bcfdc);$('world').append(renderer.domElement);
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x9bcfdc,35,105);
 const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.05,180);camera.rotation.order='YXZ';scene.add(camera);
 scene.add(new THREE.HemisphereLight(0xfffbef,0x8d9ab6,1.6));const sun=new THREE.DirectionalLight(0xfff5db,1.6);sun.position.set(-10,30,15);scene.add(sun);
 const cube=new THREE.BoxGeometry(1,1,1), blockBatches=[], drops=[], inventory=Sandbox.inventory(),homeEdits=new Map();
 const types=Object.keys(Sandbox.items),names=Object.fromEntries(types.map(t=>[t,Sandbox.items[t].name]));names.track='安全跑道';
 let slots=['grass','log','plank','brick','marble','glass','roof','lantern'],slot=0,craftOpen=false,saveTimer=0,saveWarned=false,lookMode='free',dragLook=null,preferFree=false,gameFault=false;
 try{const s=Sandbox.restore(localStorage.getItem('sky-island-home-v3'));if(s){Object.assign(inventory,s.inventory);s.edits.forEach(b=>homeEdits.set(Core.key(b.x,b.y,b.z),b));if(s.slots)slots=s.slots;}}catch{}
 function texture(base,kind){
   const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,64,64);
   if(kind==='side'){x.fillStyle='#bb8661';x.fillRect(0,18,64,46);x.fillStyle=base;for(let i=0;i<5;i++){x.beginPath();x.arc(i*16,17,10,0,Math.PI);x.fill();}}
   x.strokeStyle='#354c634d';x.lineWidth=5;x.strokeRect(2.5,2.5,59,59);x.strokeStyle='#fff6d6a0';x.lineWidth=3;x.beginPath();x.moveTo(8,52);x.lineTo(8,8);x.lineTo(53,8);x.stroke();
   if(kind==='track'){x.strokeStyle='#fff8eac0';x.lineWidth=5;for(const z of [25,42]){x.beginPath();x.moveTo(20,z+5);x.lineTo(32,z-3);x.lineTo(44,z+5);x.stroke();}}
   else if(kind==='log'){x.strokeStyle='#66432b';x.lineWidth=3;for(const u of [13,29,47]){x.beginPath();x.moveTo(u,9);x.bezierCurveTo(u-9,25,u+8,40,u,57);x.stroke();}x.beginPath();x.ellipse(39,35,5,9,0,0,Math.PI*2);x.stroke();}
   else if(kind==='plank'||kind==='beam'){x.strokeStyle='#70513c88';x.lineWidth=3;for(const v of [22,43]){x.beginPath();x.moveTo(4,v);x.lineTo(60,v);x.stroke();}for(const [u,v] of [[15,14],[45,33],[15,52]]){x.fillStyle='#695346';x.fillRect(u,v,3,3);}}
   else if(kind==='leaves'){for(const [u,v] of [[17,22],[36,40],[47,18],[17,48]]){x.fillStyle='#c0ef99';x.beginPath();x.ellipse(u,v,9,5,-.7,0,Math.PI*2);x.fill();x.strokeStyle='#43815d';x.lineWidth=2;x.stroke();}}
   else if(kind==='brick'||kind==='roof'){x.strokeStyle=kind==='brick'?'#60768e':'#35415e';x.lineWidth=3;for(const v of [22,43]){x.beginPath();x.moveTo(4,v);x.lineTo(60,v);x.stroke();}for(const [u,a,b] of [[32,4,22],[20,22,43],[44,43,60]]){x.beginPath();x.moveTo(u,a);x.lineTo(u,b);x.stroke();}}
   else if(kind==='cobble'){for(const [u,v,r] of [[17,16,9],[44,17,11],[24,43,12],[50,48,8]]){x.fillStyle='#a3b3bc';x.strokeStyle='#4c6175';x.lineWidth=3;x.beginPath();x.ellipse(u,v,r,r*.75,.2,0,Math.PI*2);x.fill();x.stroke();}}
   else if(kind==='copper'){x.strokeStyle='#754f42';x.lineWidth=3;x.strokeRect(12,12,40,40);x.fillStyle='#edbc84';for(const u of [15,49])for(const v of [15,49]){x.beginPath();x.arc(u,v,3,0,Math.PI*2);x.fill();}}
   else if(kind==='stained'){const colors=['#f5c67e','#b9a0e6','#86d5db','#e99aba'];for(let r=0;r<3;r++)for(let col=0;col<3;col++){x.fillStyle=colors[(r+col)%4];x.fillRect(5+col*18,5+r*18,17,17);}x.strokeStyle='#5c6589';x.lineWidth=3;for(const u of [4,23,41,60]){x.beginPath();x.moveTo(u,4);x.lineTo(u,60);x.moveTo(4,u);x.lineTo(60,u);x.stroke();}}
   else if(kind==='glass'){x.strokeStyle='#fff9';x.lineWidth=4;x.beginPath();x.moveTo(16,39);x.lineTo(38,16);x.moveTo(26,49);x.lineTo(49,26);x.stroke();}
   else if(kind==='gold'||kind==='lantern'){x.strokeStyle=kind==='gold'?'#ad7c3b':'#b87f3e';x.lineWidth=3;x.strokeRect(14,14,36,36);x.fillStyle='#fff3c3';x.beginPath();x.arc(32,32,kind==='lantern'?13:6,0,Math.PI*2);x.fill();}
   else if(kind==='marble'||kind==='stone'){x.strokeStyle='#50617a55';x.lineWidth=3;for(const [u,v] of [[16,22],[43,41]]){x.beginPath();x.moveTo(u-6,v+4);x.lineTo(u,v-5);x.lineTo(u+10,v-2);x.stroke();}}
   else {x.fillStyle=kind==='dirt'?'#ffe0a88c':'#f5ffd880';for(const [u,v] of [[20,29],[43,20],[34,46]]){x.beginPath();x.ellipse(u,v,4,2,-.5,0,Math.PI*2);x.fill();}}
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 const gradient=new THREE.DataTexture(new Uint8Array([100,180,255]),3,1,THREE.RedFormat);gradient.needsUpdate=true;gradient.minFilter=gradient.magFilter=THREE.NearestFilter;
 const material=(color,kind)=>new THREE.MeshToonMaterial({map:texture(color,kind),gradientMap:gradient});
 const dirt=material('#cd9b70','dirt'),stone=material('#a5b6d1','stone'),grassTop=material('#9edc8b','grass'),grassSide=material('#8bc57d','side'),track=material('#ffd56c','track');
 const themedTracks=Courses.palettes.map(p=>material(p.track,'track')),checkpointMaterial=material('#75dcc5','track'),finishMaterial=material('#ffe18c','track');
 const materials={grass:[grassSide,grassSide,grassTop,dirt,grassSide,grassSide],dirt,stone,track};
 types.filter(t=>!materials[t]).forEach(t=>{const d=Sandbox.items[t];materials[t]=material(d.color,d.kind);});
 materials.glass.transparent=true;materials.glass.opacity=.58;materials.glass.depthWrite=false;
 materials.stained.transparent=true;materials.stained.opacity=.88;
 materials.lantern.emissive=new THREE.Color('#ffcf73');materials.lantern.emissiveIntensity=.4;
 let world,p,yaw=0,pitch=-.06,selected='grass',active=false,mouseDown=false,mine=null,jumpQueued=false,run=Courses.newRun(),level=0,toastUntil=0,phase=0,records={},lastProgress='';
 try{const saved=JSON.parse(localStorage.getItem('sky-island-records-v2'));if(saved&&typeof saved==='object'&&!Array.isArray(saved))records=saved;level=Courses.course(localStorage.getItem('sky-island-level-v2')).index;}catch{}
 function persist(){try{localStorage.setItem('sky-island-records-v2',JSON.stringify(records));localStorage.setItem('sky-island-level-v2',String(level));}catch{}}
 const keys=control.keys, ray=new THREE.Raycaster();ray.far=5;
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.013,1.013,1.013)),new THREE.LineBasicMaterial({color:0xfff0b7}));scene.add(outline);
 // Cracks are a real transparent overlay on all six block faces.
 const crackCanvas=document.createElement('canvas');crackCanvas.width=crackCanvas.height=128;const crackCtx=crackCanvas.getContext('2d'),crackTexture=new THREE.CanvasTexture(crackCanvas);
 const crack=new THREE.Mesh(new THREE.BoxGeometry(1.018,1.018,1.018),new THREE.MeshBasicMaterial({map:crackTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));crack.visible=false;scene.add(crack);
 const decor=new THREE.Group();scene.add(decor);
 function renderBlocks(){
   blockBatches.forEach(m=>{scene.remove(m);m.dispose?.();});blockBatches.length=0;
   const groups=new Map();for(const b of world.blocks.values()){const name=b.finish?'finish':b.checkpoint?'checkpoint':b.type;if(!groups.has(name))groups.set(name,[]);groups.get(name).push(b);}
   const matrix=new THREE.Matrix4();for(const [name,blocks] of groups){const mat=name==='finish'?finishMaterial:name==='checkpoint'?checkpointMaterial:materials[name];const m=new THREE.InstancedMesh(cube,mat,blocks.length);m.userData.blocks=blocks;blocks.forEach((b,i)=>{matrix.makeTranslation(b.x+.5,b.y+.5,b.z+.5);m.setMatrixAt(i,matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();scene.add(m);blockBatches.push(m);}
 }
 function saveNow(){clearTimeout(saveTimer);try{localStorage.setItem('sky-island-home-v3',JSON.stringify({version:3,inventory,slots,edits:[...homeEdits.values()]}));$('save-status').textContent='本島與背包已自動儲存';}catch{if(!saveWarned){saveWarned=true;toast('瀏覽器無法儲存，請保留此分頁；刷新將失去本次建造。');}$('save-status').textContent='儲存失敗，請保留分頁';}}
 function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,600);}
 function edited(b,type){if(Sandbox.inHome(b)){homeEdits.set(Core.key(b.x,b.y,b.z),{x:b.x,y:b.y,z:b.z,type});queueSave();}}
 function banner(text,color){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#143a49';x.fillRect(0,0,512,128);x.strokeStyle=color;x.lineWidth=8;x.strokeRect(4,4,504,120);x.fillStyle=color;x.font='bold 42px sans-serif';x.textAlign='center';x.fillText(text,256,81);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c)}));s.scale.set(3.8,.95,1);return s;}
 function buildTrim(){
   const groups=new Map();for(const d of world.details){if(!groups.has(d.type))groups.set(d.type,[]);groups.get(d.type).push(d);}
   for(const [type,ds] of groups){const m=new THREE.InstancedMesh(cube,materials[type],ds.length),matrix=new THREE.Matrix4();
    ds.forEach((d,i)=>{matrix.compose(new THREE.Vector3(d.x,d.y,d.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,d.angle)),new THREE.Vector3(d.sx,d.sy,d.sz));m.setMatrixAt(i,matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();decor.add(m);
   }
 }
 function build(preserveHome=false){
   const home=preserveHome&&world?[...world.blocks.values()].filter(b=>b.z>=-5):null;
   drops.forEach(d=>scene.remove(d.mesh));drops.length=0;
   const sharedMaterials=new Set([dirt,stone,grassTop,grassSide,track,checkpointMaterial,finishMaterial,...themedTracks,...Object.values(materials).flat()]);
   for(const child of [...decor.children]){decor.remove(child);child.dispose?.();if(child.material&&!sharedMaterials.has(child.material)){if(child.material.map)child.material.map.dispose();child.material.dispose();}if(child.geometry&&child.geometry!==cube)child.geometry.dispose();}
   world=Core.makeWorld(Courses.course(level));materials.track=themedTracks[world.course.tier];
   renderer.setClearColor(world.course.palette.sky);scene.fog.color.set(world.course.palette.sky);
   if(home){for(const [k,b] of world.blocks)if(b.z>=-5)world.blocks.delete(k);home.forEach(b=>world.blocks.set(Core.key(b.x,b.y,b.z),b));}
   world.platforms.forEach(pt=>pt.tiles.forEach(t=>{const b=world.blocks.get(Core.key(t.x,pt.y-1,t.z));b.checkpoint=pt.checkpoint;b.finish=pt.finish;}));
   const overlapCount=Sandbox.applyEdits(world.blocks,homeEdits.values());
   if(overlapCount)$('result').textContent=`保留了 ${overlapCount} 處與新大廳重疊的既有改動，可自行調整；存檔未清除。`;
   renderBlocks();buildTrim();p=Core.player();run=Courses.newRun();
   world.platforms.forEach(pt=>{const label=pt.finish?'FINISH → HOME':pt.checkpoint?`${pt.id}  CHECKPOINT`:`${pt.id} · ${pt.tiles.length} BLOCK${pt.tiles.length>1?'S':''}`;
     const s=banner(label,pt.checkpoint?'#a1ffe2':'#fff0c4');s.position.set(pt.entry.x,pt.y+2.5,pt.entry.z);s.scale.set(pt.checkpoint||pt.finish?3.8:2.3,pt.checkpoint||pt.finish?.95:.58,1);decor.add(s);
     if(pt.checkpoint||pt.finish){const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.055,6,32),new THREE.MeshBasicMaterial({color:pt.finish?0xffd45e:0x72e3c0}));ring.rotation.x=Math.PI/2;ring.position.set(pt.entry.x,pt.y+.035,pt.entry.z);decor.add(ring);}
   });
   const sign=banner(`LEVEL ${String(level+1).padStart(2,'0')}  /  ${world.platforms.length} JUMPS`,'#ffe0a1');sign.position.set(.5,3,-3);decor.add(sign);
   // Decorative clouds and distant floating islands do not participate in collisions.
   for(let i=0;i<36;i++){const m=new THREE.Mesh(cube,new THREE.MeshToonMaterial({color:0xfffaf1,transparent:true,opacity:.8,gradientMap:gradient}));m.position.set(Math.sin(i*6.4)*28,-5+(i%5)*3,12-i*4.5);m.scale.set(7+i%3,1.2,3);decor.add(m);}
   for(const [text,x,z] of [['CENTRAL HALL',3.5,8],['←  BUILD & FOREST',-5,6],['WORKSHOP  →',17,7]]){const s=banner(text,'#ffe3aa');s.position.set(x,3.6,z);decor.add(s);}
   yaw=preserveHome?0:Math.atan2(-(3.5-p.x),-(19.5-p.z));pitch=preserveHome?-.06:.14;control.clear();control.setLook(yaw,pitch);jumpQueued=false;mouseDown=false;clearMine();updateLevelMenu();updateHotbar();updateHud();
 }
 // Two articulated first-person arms; walking and sprinting use different poses and cycles.
 const arms=[];for(const side of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*.37,-.38,-.48);camera.add(pivot);const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.18,.34,.2),new THREE.MeshLambertMaterial({color:0x284d58,depthTest:false}));sleeve.position.y=-.05;sleeve.renderOrder=5;pivot.add(sleeve);const hand=new THREE.Mesh(new THREE.BoxGeometry(.17,.19,.18),new THREE.MeshLambertMaterial({color:0xdab18b,depthTest:false}));hand.position.y=-.29;hand.renderOrder=6;pivot.add(hand);arms.push(pivot);}
 function toast(t){$('toast').textContent=t;$('toast').classList.add('show');toastUntil=performance.now()+3200;}
 function updateHotbar(){selected=slots[slot];$('hotbar').replaceChildren();slots.forEach((t,i)=>{const b=document.createElement('button');b.className=i===slot?'active':'';b.innerHTML=`<i style="--swatch:${Sandbox.items[t].color}"></i>${names[t]}<small>${i+1} · ${inventory[t]} 個</small>`;b.setAttribute('aria-label',`${names[t]}，${inventory[t]} 個`);b.onclick=()=>{slot=i;updateHotbar();};$('hotbar').append(b);});if(craftOpen)renderWorkshop();}
 function renderWorkshop(){
   $('slot-label').textContent=`選取材料會裝入快捷格 ${slot+1}（用 1–8 切換）`;
   $('inventory-grid').replaceChildren(...types.map(t=>{const b=document.createElement('button');b.className=t===selected?'active':'';b.innerHTML=`<i style="background:${Sandbox.items[t].color}"></i>${names[t]}<b>${inventory[t]}</b>`;b.onclick=()=>{slots[slot]=t;selected=t;queueSave();updateHotbar();};return b;}));
   const parts=obj=>Object.entries(obj).map(([t,n])=>`${names[t]} ${n}`).join(' + ');
   $('recipes').replaceChildren(...Sandbox.recipes.map(r=>{const row=document.createElement('div');row.className='recipe';const text=document.createElement('span');text.textContent=`${r.name}：${parts(r.input)} → ${parts(r.output)}`;row.append(text);for(const n of [1,4]){const b=document.createElement('button');b.textContent=`×${n}`;b.disabled=!Object.entries(r.input).every(([t,a])=>inventory[t]>=a*n);b.onclick=()=>{const result=Sandbox.craft(inventory,r.id,n);$('craft-message').textContent=result.message;if(result.ok){queueSave();updateHotbar();}};row.append(b);}return row;}));
 }
 function openWorkshop(){craftOpen=true;pause();$('menu').hidden=true;$('workshop').hidden=false;renderWorkshop();$('workshop-close').focus();}
 async function closeWorkshop(){craftOpen=false;$('workshop').hidden=true;await start();}
 $('bag').onclick=openWorkshop;$('workshop-close').onclick=closeWorkshop;
 function format(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;}
 function updateHud(){
   $('stamina').value=p.stamina;$('energy').textContent=`${Math.ceil(p.stamina)} / 100`;
   $('motion').textContent=p.exhausted?'體力耗盡':p.sprinting?'衝刺中':p.grounded?'步行 / 休息':'跳躍中';
   $('energyhint').textContent=p.exhausted?'放開 Shift，恢復至 35 後可再衝刺':'按住 Shift 衝刺 · 放開恢復體力';
   document.body.classList.toggle('running',active&&p.sprinting);document.body.classList.toggle('exhausted',p.exhausted);
   $('course-name').textContent=`第 ${level+1} / ${Courses.names.length} 關 · ${world.course.name}`;
   $('checkpoint').textContent=`落點 ${run.passed} / ${world.platforms.length} · 重生點 ${run.saved||'本島'}`;
   const progressKey=`${level}:${run.passed}`;if(progressKey!==lastProgress){lastProgress=progressKey;$('dots').replaceChildren(...world.platforms.map(pt=>{const s=document.createElement('span');s.textContent=pt.id<=run.passed?'●':pt.checkpoint?'◆':'○';s.className=pt.checkpoint?'save':'';s.title=`落點 ${pt.id}：${pt.shape}${pt.checkpoint?'，檢查點':''}`;return s;}));}
   $('timer').textContent=format(run.elapsed);$('best').textContent=records[level]?`本關最佳 ${format(records[level])}`:'薄荷色平台 ◆ 才是重生點';$('mode').textContent=run.started?'跑酷挑戰':'本島 / 準備出發';
 }
 function updateLevelMenu(){
   $('level-select').replaceChildren(...Courses.names.map((name,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${String(i+1).padStart(2,'0')} · ${name}${records[i]?' ✓':''}`;return o;}));$('level-select').value=level;
   const c=world.course,ys=c.platforms.map(pt=>pt.y);$('level-detail').textContent=`${c.palette.name} · ${c.count} 段 · ${c.platforms.filter(pt=>pt.checkpoint).length} 個檢查點 · 高度 ${Math.min(...ys)}–${Math.max(...ys)} 格`;
 }
 function clearMine(){mine=null;crack.visible=false;$('mining').hidden=true;}
 function pause(){active=false;dragLook=null;control.clear();mouseDown=false;jumpQueued=false;clearMine();document.body.classList.remove('running');$('menu').hidden=craftOpen;$('workshop').hidden=!craftOpen;$('start').textContent='繼續探索 ↗';if(document.pointerLockElement)document.exitPointerLock();}
 function controlHint(){ $('control-hint').textContent=lookMode==='locked'?'滑鼠轉視角 · Esc 暫停':'右鍵拖曳或方向鍵轉視角 · 右鍵輕點放置 · Esc 暫停'; }
 function enterGame(){active=true;craftOpen=false;$('menu').hidden=true;$('workshop').hidden=true;try{renderer.domElement.focus({preventScroll:true});}catch{}controlHint();}
 function freeLook(){if(!active)return;if(document.pointerLockElement===renderer.domElement){lookMode='locked';controlHint();return;}lookMode='free';preferFree=true;controlHint();toast('已用免鎖定模式開始：右鍵拖曳或方向鍵轉視角。');}
 async function start(requestLock=!preferFree){
   if(gameFault)return;
   preferFree=requestLock===false;
   if(innerWidth<600)toast('建議使用電腦鍵盤與滑鼠操作');
   lookMode=document.pointerLockElement===renderer.domElement?'locked':'free';enterGame();
   if(!requestLock||typeof renderer.domElement.requestPointerLock!=='function'){freeLook();return;}
   // Starting is independent of pointer lock: denied or unresolved requests cannot trap the menu.
   try{await renderer.domElement.requestPointerLock();}catch{freeLook();}
 }
 renderer.domElement.tabIndex=0;
 document.addEventListener('pointerlockchange',()=>{const previous=lookMode;lookMode=document.pointerLockElement===renderer.domElement?'locked':'free';if(lookMode==='locked'){if(!active||craftOpen){document.exitPointerLock();return;}enterGame();}else if(previous==='locked'&&active)pause();controlHint();});
 document.addEventListener('pointerlockerror',freeLook);
 $('start').onclick=start;$('pause').onclick=pause;
 $('start-free').onclick=()=>start(false);
 $('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{toast('瀏覽器不允許全螢幕，可使用 F11。');}};
 $('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function respawn(){const pt=Courses.spawnFor(run,world.platforms);p=Core.player();Object.assign(p,pt);clearMine();mouseDown=false;control.clear();jumpQueued=false;const next=world.platforms[run.passed];yaw=next?Math.atan2(-(next.entry.x-p.x),-(next.entry.z-p.z)):0;pitch=-.06;control.setLook(yaw,pitch);toast(run.saved?`回到檢查點 ${run.saved}，中間落點需重走`:'已回到本島，這段沒有檢查點');}
 function restart(){run=Courses.newRun();respawn();yaw=0;pitch=-.06;control.setLook();updateHud();}
 function finishCourse(){const done=Courses.completion(run,level);if(!done)return;records[level]=Math.min(Number(records[level])||Infinity,done.time);const last=level===Courses.names.length-1;
   $('result').textContent=`第 ${level+1} 關完成！用時 ${format(done.time)}。已回到本島。${last?'最後一關完成，可選關重玩。':`下一關：${Courses.names[done.next]}。`}`;
   level=done.next;persist();build(true);toast($('result').textContent);
 }
 $('level-select').onchange=e=>{level=Number(e.target.value);persist();build(true);$('result').textContent='已切換關卡並返回本島，背包與本島方塊保留。';};
 $('restart').onclick=()=>{restart();toast('挑戰已歸零，島與背包保留');};$('reset').onclick=()=>{if(!window.confirm('要清除本島自建方塊、砍樹紀錄與背包，回到初始狀態嗎？關卡成績會保留。'))return;homeEdits.clear();Object.assign(inventory,Sandbox.inventory());build();saveNow();toast('本島與背包已重建');};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();saveNow();}});window.addEventListener('pagehide',saveNow);window.addEventListener('blur',()=>{if(active)pause();});
 document.addEventListener('mousemove',e=>{
   if(!active)return;
   if(lookMode==='locked'){control.look(e.movementX,e.movementY);return;}
   if(!dragLook)return;
   const dx=Number.isFinite(e.clientX)&&Number.isFinite(dragLook.x)?e.clientX-dragLook.x:e.movementX||0,dy=Number.isFinite(e.clientY)&&Number.isFinite(dragLook.y)?e.clientY-dragLook.y:e.movementY||0;
   dragLook.x=e.clientX;dragLook.y=e.clientY;dragLook.distance+=Math.hypot(dx,dy);
   if(dragLook.distance>5)control.look(dx,dy);
 });
 document.addEventListener('keydown',e=>{
   if(craftOpen){if(e.code==='KeyE'||e.code==='Escape'){e.preventDefault();if(!e.repeat)closeWorkshop();}else if(/^Digit[1-8]$/.test(e.code)){slot=Number(e.code.slice(-1))-1;updateHotbar();}return;}
   if(!active)return;
   if(e.code==='Escape'){e.preventDefault();pause();return;}
   if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyE'].includes(e.code))e.preventDefault();
   if(e.code==='KeyE'){if(!e.repeat)openWorkshop();return;}
   control.press(e.code,e.repeat);
   if(e.code==='KeyR'&&!e.repeat)respawn();
   if(/^Digit[1-8]$/.test(e.code)){slot=Number(e.code.slice(-1))-1;updateHotbar();}
 });
 document.addEventListener('keyup',e=>control.release(e.code));
 document.addEventListener('contextmenu',e=>e.preventDefault());
 renderer.domElement.addEventListener('mousedown',e=>{if(!active)return;if(e.button===0)mouseDown=true;if(e.button===2){if(lookMode==='locked')place();else{dragLook={x:e.clientX,y:e.clientY,distance:0};mouseDown=false;clearMine();}}});
 window.addEventListener('mouseup',e=>{if(e.button===0){mouseDown=false;clearMine();}if(e.button===2){const click=active&&dragLook&&dragLook.distance<=5;dragLook=null;if(click)place();}});
 function hit(){camera.updateMatrixWorld();ray.setFromCamera(new THREE.Vector2(0,0),camera);const h=ray.intersectObjects(blockBatches,false)[0];if(h)h.block=h.object.userData.blocks[h.instanceId];return h;}
 function place(){const h=hit();if(!h?.block)return;const b=h.block,n=h.face.normal,nb={x:b.x+Math.round(n.x),y:b.y+Math.round(n.y),z:b.z+Math.round(n.z),type:selected,protected:false};
   if(!Core.canPlace(p,nb,world.blocks,inventory[selected])){toast(inventory[selected]===0?'沒有這種方塊，按 E 查看合成配方':'不能在這裡放置：避開角色、出生區或島外');return;}
   world.blocks.set(Core.key(nb.x,nb.y,nb.z),nb);renderBlocks();inventory[selected]--;edited(nb,selected);updateHotbar();
 }
 function cracks(amount){crackCtx.clearRect(0,0,128,128);crackCtx.strokeStyle='#17242de6';crackCtx.lineWidth=2+amount*2;for(let i=0;i<Math.ceil(amount*12);i++){const a=i*2.399;crackCtx.beginPath();crackCtx.moveTo(64,64);crackCtx.lineTo(64+Math.cos(a)*25,64+Math.sin(a)*25);crackCtx.lineTo(64+Math.cos(a+.25)*65,64+Math.sin(a+.25)*65);crackCtx.stroke();}crackTexture.needsUpdate=true;}
 function mining(dt){const h=hit();outline.visible=!!h?.block;if(h?.block){const b=h.block;outline.position.set(b.x+.5,b.y+.5,b.z+.5);$('target').textContent=b.protected?'大廳／安全跑道 · 保護結構':`${names[b.type]} · 長按左鍵 ${Core.mineTime(b.type)} 秒`;}else $('target').textContent='';
   if(!mouseDown||!h?.block||h.block.protected){clearMine();return;}
   const b=h.block,k=Core.key(b.x,b.y,b.z);if(!mine||mine.key!==k)mine={key:k,time:0};mine.time+=dt;const amount=mine.time/Core.mineTime(b.type);$('mining').hidden=false;$('minebar').value=amount;crack.visible=true;crack.position.copy(outline.position);cracks(amount);
   if(amount>=1){world.blocks.delete(k);renderBlocks();edited(b,null);const m=new THREE.Mesh(cube,materials[b.type]);m.scale.setScalar(.25);m.position.set(b.x+.5,b.y+.5,b.z+.5);scene.add(m);drops.push({mesh:m,type:b.type,vy:3,vx:1.2,age:0});clearMine();}
 }
 function updateDrops(dt){for(let i=drops.length-1;i>=0;i--){const d=drops[i],pos=d.mesh.position;d.age+=dt;d.mesh.rotation.y+=dt;d.vy-=Core.C.gravity*dt;const before=pos.y;pos.y+=d.vy*dt;pos.x+=d.vx*dt;d.vx*=Math.exp(-5*dt);
   if(d.vy<=0){const b=world.blocks.get(Core.key(Math.floor(pos.x),Math.floor(pos.y-.125),Math.floor(pos.z)));if(b&&before>=b.y+1+.12){pos.y=b.y+1.125;d.vy=0;}}
   const dist=Math.hypot(p.x-pos.x,p.y+.65-pos.y,p.z-pos.z);if(d.age>.25&&dist<1.65&&inventory[d.type]<Sandbox.LIMIT){const target=new THREE.Vector3(p.x,p.y+.65,p.z);pos.lerp(target,Math.min(1,dt*13));if(dist<.5){inventory[d.type]++;scene.remove(d.mesh);drops.splice(i,1);queueSave();updateHotbar();toast(`拾取 ${names[d.type]} +1`);}}
   else if(pos.y<-25){scene.remove(d.mesh);drops.splice(i,1);}
 }}
 const effects=$('speedlines'),ctx=effects.getContext('2d');
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);effects.width=innerWidth;effects.height=innerHeight;}window.addEventListener('resize',resize);resize();
 function drawEffects(t){ctx.clearRect(0,0,effects.width,effects.height);if(!active||!p.sprinting||$('reduced').checked)return;const w=effects.width,h=effects.height;ctx.lineWidth=1.5;for(let i=0;i<42;i++){const a=i*2.3999,r=.45+((t*.0017+i*.137)%1)*.6;ctx.strokeStyle=`rgba(255,248,214,${.08+(r-.45)*.35})`;ctx.beginPath();ctx.moveTo(w/2+Math.cos(a)*w*r,h/2+Math.sin(a)*h*r);ctx.lineTo(w/2+Math.cos(a)*w*(r+.17),h/2+Math.sin(a)*h*(r+.17));ctx.stroke();}}
 let previous=performance.now(),accumulator=0;const fixed=1/120;
 function frame(t){if(gameFault)return;requestAnimationFrame(frame);const dt=Math.min((t-previous)/1000,.05);previous=t;
   if(active){accumulator+=dt;const ix=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),iz=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);
     while(accumulator>=fixed){Core.step(p,control.sample(fixed,p.grounded),fixed,world.blocks);updateDrops(fixed);accumulator-=fixed;}
     yaw=control.yaw;pitch=control.pitch;
     if(!run.started&&p.z<-3.5)run.started=true;
     if(run.started&&!run.finished)run.elapsed+=dt;
     if(p.y<-15)respawn();
     if(p.grounded){const pt=world.platforms[run.passed];if(pt&&Courses.onPlatform(p,pt)&&Courses.land(run,pt)){if(pt.finish)finishCourse();else toast(pt.checkpoint?`檢查點 ${pt.id} 已保存`:`落點 ${pt.id} · ${pt.shape} · 此處不保存重生點`);}}
     phase+=dt*(p.sprinting?17:9);const moving=Math.hypot(ix,iz)>0,bob=$('reduced').checked?0:moving&&p.grounded?Math.sin(phase)*(p.sprinting?.06:.018):0;
     camera.position.set(p.x,p.y+1.57+bob,p.z);camera.rotation.set(pitch,yaw,$('reduced').checked?0:moving&&p.sprinting?Math.sin(phase*.5)*.009:0);
     camera.fov+=(($('reduced').checked?76:p.sprinting?88:76)-camera.fov)*Math.min(1,dt*7);camera.updateProjectionMatrix();
     arms.forEach((a,i)=>{a.rotation.x=p.sprinting?-.7+Math.sin(phase+i*Math.PI)*.5:moving?Math.sin(phase+i*Math.PI)*.12:0;a.rotation.z=(i?1:-1)*(p.sprinting?.35:.12);});
     mining(dt);updateHud();
   }else{accumulator=0;camera.position.set(p.x,p.y+1.57,p.z);camera.rotation.set(pitch,yaw,0);}
   if(t>toastUntil)$('toast').classList.remove('show');drawEffects(t);renderer.render(scene,camera);
 }
 window.IslandOnFatal=()=>{gameFault=true;craftOpen=false;pause();};
 build();controlHint();window.IslandReady=true;requestAnimationFrame(frame);
})();
