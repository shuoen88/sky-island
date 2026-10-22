(function(root){
 'use strict';
 // All footprints are connected and include a front-edge tile at [0, 0].
 const shapes=[
  {name:'單格',tiles:[[0,0]]},
  {name:'橫雙格',tiles:[[0,0],[1,0]]},
  {name:'直雙格',tiles:[[0,0],[0,1]]},
  {name:'L 轉角',tiles:[[0,0],[0,1],[1,1]]},
  {name:'反 L 轉角',tiles:[[0,0],[0,1],[-1,1]]},
  {name:'田字台',tiles:[[0,0],[1,0],[0,1],[1,1]]},
  {name:'T 字台',tiles:[[0,0],[-1,1],[0,1],[1,1]]},
  {name:'十字台',tiles:[[0,0],[-1,1],[0,1],[1,1],[0,2]]},
  {name:'窄長條',tiles:[[0,0],[0,1],[0,2]]},
  {name:'階梯折線',tiles:[[0,0],[0,1],[1,1],[1,2],[2,2]]},
  {name:'寬長台',tiles:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]},
  {name:'休息廣場',tiles:[[0,0],[1,0],[-1,0],[0,1],[1,1],[-1,1],[0,2],[1,2],[-1,2]]}
 ];
 const names=['雲端起步','青草階梯','雙格節奏','轉角練習','薄荷山丘','天空花園','窄道試煉','折線上升','浮雲落差','糖果天梯','雙翼跳台','高空折返','單格挑戰','彩虹稜線','雲海俯衝','精準落點','孤石連跳','風切高塔','交錯步伐','天際攀登','一線之間','極限雲梯','星空獨步','風行之巔'];
 const palettes=[{name:'薄荷草原',track:'#ffd56c',edge:'#ad7739',sky:0xbde6ef},{name:'莓果雲境',track:'#f7a7c7',edge:'#a95683',sky:0xd4d9f5},{name:'蜜桃高地',track:'#ffbd8a',edge:'#b77452',sky:0xffe3cf},{name:'星空稜線',track:'#b7b0f7',edge:'#7567af',sky:0xc5d9f2}];
 function course(index){
  index=Math.max(0,Math.min(names.length-1,Math.trunc(Number(index)||0)));
  const count=8+Math.floor(index/2),tier=Math.floor(index/6),platforms=[];
  let lastZ=-5,x=0,y=1;
  for(let i=0;i<count;i++){
   const checkpoint=(i+1)%(tier<1?4:tier<3?6:8)===0&&i<count-1;
   let shapeIndex;
   if(checkpoint||i===count-1)shapeIndex=11;
   else if(tier===0)shapeIndex=[10,5,3,7,2,6,4,8][(i+index)%8];
   else if(tier===1)shapeIndex=[3,2,6,1,4,8,0,9][(i+index)%8];
   else if(tier===2)shapeIndex=[0,1,2,3,0,8,4,0][(i+index)%8];
   else shapeIndex=[0,1,0,2,0,3,0,4][(i+index)%8];
   const shape=shapes[shapeIndex],depth=Math.max(...shape.tiles.map(t=>t[1]))+1;
   // Every climb is one block, within the unchanged 1.64-block jump height.
   // Advanced courses climb longer before a larger descent.
   const period=5+tier,phase=i%period;
   const dy=phase<period-2?1:phase===period-2?-(tier+1):0;
   y+=dy;
   const gap=dy>0?(index<8?1:2):dy<0?(2+Math.floor(index/8)):(index<6?2:3);
   const turn=((i+index)%4<2?1:-1)*(index<6?1:2);
   x=Math.max(-5,Math.min(5,x+turn));
   const z=lastZ-gap-depth;
   const tiles=shape.tiles.map(([dx,dz])=>({x:x+dx,z:z+dz}));
   const entryTile=tiles.filter(t=>t.z===z+depth-1).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
   platforms.push({id:i+1,x:x+.5,z:z+.5,y,tiles,shape:shape.name,checkpoint,finish:i===count-1,
    entry:{x:entryTile.x+.5,z:entryTile.z+.5,y},exit:{x:x+.5,z:z+.2,y},gap,dy});
   lastZ=z;
  }
  return {index,name:names[index],count,tier,palette:palettes[tier],platforms};
 }
 function newRun(){return {passed:0,saved:0,elapsed:0,started:false,finished:false};}
 function land(run,pt){if(pt.id!==run.passed+1||run.finished)return false;run.passed=pt.id;if(pt.checkpoint)run.saved=pt.id;if(pt.finish)run.finished=true;return true;}
 function spawnFor(run,platforms){run.passed=run.saved;const pt=platforms[run.saved-1];return pt?{...pt.entry}:{x:.5,y:1,z:5.5};}
 function onPlatform(p,pt){return p.grounded&&Math.abs(p.y-pt.y)<.05&&pt.tiles.some(t=>p.x>=t.x&&p.x<=t.x+1&&p.z>=t.z&&p.z<=t.z+1);}
 function completion(run,index){if(!run.finished)return null;return {completed:index,next:Math.min(index+1,names.length-1),time:run.elapsed,home:{x:.5,y:1,z:5.5}};}
 const api={shapes,names,palettes,course,newRun,land,spawnFor,onPlatform,completion};
 if(typeof module!=='undefined')module.exports=api;else root.IslandCourses=api;
})(typeof window!=='undefined'?window:globalThis);
