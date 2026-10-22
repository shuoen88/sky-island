(function (root) {
  'use strict';
  const C = {walk:3.6, run:7.5, jump:8.5, gravity:22, radius:0.28, height:1.75, drain:25, recovery:22};
  const key=(x,y,z)=>`${x},${y},${z}`;
  function makeWorld(course){
    const blocks=new Map(), platforms=[];
    function put(x,y,z,type='grass',protectedBlock=false){blocks.set(key(x,y,z),{x,y,z,type,protected:protectedBlock});}
    const home=typeof module!=='undefined'?require('./home.js'):root.IslandHome;home.build(put);
    if(!course){const courses=typeof module!=='undefined'?require('./courses.js'):root.IslandCourses;course=courses.course(0);}
    course.platforms.forEach(pt=>{
      pt.tiles.forEach(t=>put(t.x,pt.y-1,t.z,'track',true));
      platforms.push(pt);
    });
    return {blocks,platforms,put,course,details:home.details(),layout:home.layout};
  }
  function player(){return {x:0.5,y:1,z:5.5,vy:0,grounded:true,stamina:100,exhausted:false,rest:0,sprinting:false};}
  function overlaps(p,b){return p.x+C.radius>b.x&&p.x-C.radius<b.x+1&&p.z+C.radius>b.z&&p.z-C.radius<b.z+1&&p.y+C.height>b.y+0.001&&p.y<b.y+0.999;}
  function collision(p,blocks){for(let x=Math.floor(p.x-C.radius);x<=Math.floor(p.x+C.radius);x++)for(let y=Math.floor(p.y);y<=Math.floor(p.y+C.height);y++)for(let z=Math.floor(p.z-C.radius);z<=Math.floor(p.z+C.radius);z++){const b=blocks.get(key(x,y,z));if(b&&overlaps(p,b))return b;}return null;}
  function step(p,input,dt,blocks){
    const len=Math.hypot(input.x,input.z), moving=len>0.01;
    if(p.exhausted&&p.stamina>=35&&!input.shift)p.exhausted=false;
    p.sprinting=moving&&input.shift&&!p.exhausted&&p.stamina>0;
    if(p.sprinting){p.stamina=Math.max(0,p.stamina-C.drain*dt);p.rest=0;if(p.stamina===0){p.exhausted=true;p.sprinting=false;}}
    else {p.rest+=dt;if(p.rest>0.8)p.stamina=Math.min(100,p.stamina+C.recovery*dt);}
    if(input.jump&&p.grounded){p.vy=C.jump;p.grounded=false;}
    const speed=p.sprinting?C.run:C.walk;
    const dx=moving?input.x/len*speed*dt:0,dz=moving?input.z/len*speed*dt:0;
    p.x+=dx;let b=collision(p,blocks);if(b)p.x=dx>0?b.x-C.radius:b.x+1+C.radius;
    p.z+=dz;b=collision(p,blocks);if(b)p.z=dz>0?b.z-C.radius:b.z+1+C.radius;
    p.vy-=C.gravity*dt;const dy=p.vy*dt;p.y+=dy;p.grounded=false;
    b=collision(p,blocks);if(b){if(dy<0){p.y=b.y+1;p.grounded=true;}else p.y=b.y-C.height;p.vy=0;}
    return p;
  }
  function mineTime(type){const s=typeof module!=='undefined'?require('./sandbox.js'):root.IslandSandbox;return s.items[type]?.mine||.7;}
  function canPlace(p,b,blocks,count){const s=typeof module!=='undefined'?require('./sandbox.js'):root.IslandSandbox;const spawn=b.x>=-1&&b.x<=1&&b.z>=4&&b.z<=6&&b.y>=1&&b.y<=3;return count>0&&s.isItem(b.type||'grass')&&!spawn&&!blocks.has(key(b.x,b.y,b.z))&&!overlaps(p,b)&&s.inHome(b);}
  const api={C,key,makeWorld,player,overlaps,collision,step,mineTime,canPlace};
  if(typeof module!=='undefined')module.exports=api;else root.IslandCore=api;
})(typeof window!=='undefined'?window:globalThis);
