(function(root){
 'use strict';
 const items={
  grass:{name:'草地',color:'#9edc8b',kind:'grass',mine:.7},dirt:{name:'泥土',color:'#cd9b70',kind:'dirt',mine:.7},stone:{name:'石頭',color:'#a5b6d1',kind:'stone',mine:2},
  log:{name:'原木',color:'#b58051',kind:'log',mine:1.1},leaves:{name:'樹葉',color:'#79c779',kind:'leaves',mine:.3},plank:{name:'木板',color:'#e4bb82',kind:'plank',mine:.8},
  beam:{name:'木樑',color:'#98654c',kind:'beam',mine:1},brick:{name:'石磚',color:'#a7b4cc',kind:'brick',mine:1.5},marble:{name:'白石',color:'#f5e8cf',kind:'marble',mine:1.5},
  sand:{name:'砂岩',color:'#ebd393',kind:'dirt',mine:.6},glass:{name:'玻璃',color:'#b7e9ef',kind:'glass',mine:.4},stained:{name:'彩繪玻璃',color:'#bd9ae8',kind:'stained',mine:.4},
  roof:{name:'藍瓦',color:'#638ac1',kind:'roof',mine:1},gold:{name:'金飾磚',color:'#f7d071',kind:'gold',mine:1},lantern:{name:'燈磚',color:'#ffe7a2',kind:'lantern',mine:.6},
  plumroof:{name:'紫紅瓦',color:'#96556f',kind:'roof',mine:1},copper:{name:'銅飾磚',color:'#b97e54',kind:'copper',mine:1},cobble:{name:'粗石基',color:'#75899a',kind:'cobble',mine:1.8}
 };
 const recipes=[
  {id:'saw',name:'分解原木',input:{log:1},output:{plank:4}},
  {id:'bundle',name:'拼合原木',input:{plank:4},output:{log:1}},
  {id:'beam',name:'製作木樑',input:{plank:2},output:{beam:2}},
  {id:'brick',name:'切製石磚',input:{stone:2},output:{brick:4}},
  {id:'marble',name:'磨製白石',input:{stone:4},output:{marble:4}},
  {id:'sand',name:'篩製砂岩',input:{dirt:4},output:{sand:4}},
  {id:'glass',name:'熔製玻璃',input:{sand:2},output:{glass:2}},
  {id:'stained',name:'染製彩繪玻璃',input:{glass:2,leaves:1},output:{stained:4}},
  {id:'roof',name:'製作藍瓦',input:{brick:4},output:{roof:4}},
  {id:'gold',name:'製作金飾磚',input:{marble:2,stained:1},output:{gold:2}},
  {id:'lantern',name:'製作燈磚',input:{plank:2,glass:1},output:{lantern:2}},
  {id:'reclaim-brick',name:'分解石磚',input:{brick:4},output:{stone:2}},
  {id:'reclaim-roof',name:'分解藍瓦',input:{roof:4},output:{brick:4}},
  {id:'reclaim-beam',name:'分解木樑',input:{beam:2},output:{plank:2}},
  {id:'plumroof',name:'染製紫紅瓦',input:{roof:2,leaves:1},output:{plumroof:2}},
  {id:'copper',name:'製作銅飾磚',input:{sand:2,gold:1},output:{copper:4}},
  {id:'cobble',name:'製作粗石基',input:{stone:2},output:{cobble:4}}
 ];
 const LIMIT=999;
 const isItem=t=>typeof t==='string'&&Object.hasOwn(items,t);
 function inventory(){const b=Object.fromEntries(Object.keys(items).map(t=>[t,0]));return Object.assign(b,{plank:32,brick:48,marble:24,glass:16,roof:24,lantern:8});}
 function craft(bag,id,amount=1){const r=recipes.find(r=>r.id===id);if(!r||!Number.isInteger(amount)||amount<1||amount>64)return {ok:false,message:'無效的配方或數量'};
  const next={...bag};for(const [t,n] of Object.entries(r.input)){if((next[t]||0)<n*amount)return {ok:false,message:'材料不足'};next[t]-=n*amount;}
  for(const [t,n] of Object.entries(r.output)){next[t]=(next[t]||0)+n*amount;if(next[t]>LIMIT)return {ok:false,message:'背包已滿，請先使用材料'};}
  Object.assign(bag,next);return {ok:true,message:`${r.name} × ${amount} 完成`};
 }
 function inHome(b){return Number.isInteger(b.x)&&Number.isInteger(b.y)&&Number.isInteger(b.z)&&b.x>=-24&&b.x<=30&&b.z>=-5&&b.z<=38&&b.y>=-4&&b.y<40;}
 function restore(raw){
  try{const s=JSON.parse(raw);if(s?.version!==3)return null;const bag=inventory();for(const t of Object.keys(items))if(Number.isInteger(s.inventory?.[t])&&s.inventory[t]>=0&&s.inventory[t]<=LIMIT)bag[t]=s.inventory[t];
   const edits=Array.isArray(s.edits)?s.edits.slice(0,120000).filter(b=>b&&inHome(b)&&(b.type===null||isItem(b.type))):[];
   return {inventory:bag,edits,slots:Array.isArray(s.slots)&&s.slots.length===8&&s.slots.every(isItem)?s.slots:null};
  }catch{return null;}
 }
 function applyEdits(blocks,edits){
  let overlaps=0;
  for(const b of edits){if(!inHome(b)||(b.type!==null&&!isItem(b.type)))continue;const k=`${b.x},${b.y},${b.z}`,base=blocks.get(k);
   // Keep the original parkour travel strip and respawn clearance safe.
   if(base?.protected&&base.type==='track'||b.x>=-1&&b.x<=1&&b.z>=4&&b.z<=6&&b.y>=1&&b.y<=3)continue;
   if(base?.protected)overlaps++;
   if(b.type===null)blocks.delete(k);else blocks.set(k,{x:b.x,y:b.y,z:b.z,type:b.type,protected:false});
  }
  return overlaps;
 }
 const api={items,recipes,LIMIT,isItem,inventory,craft,inHome,restore,applyEdits};if(typeof module!=='undefined')module.exports=api;else root.IslandSandbox=api;
})(typeof window!=='undefined'?window:globalThis);
