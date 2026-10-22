(function(root){
 'use strict';
 function create(){
  const keys=new Set();let yaw=0,pitch=-.06,jump=0;
  return {keys,get yaw(){return yaw;},get pitch(){return pitch;},
   press(code,repeat=false){if(repeat)return;keys.add(code);if(code==='Space')jump=.13;},release(code){keys.delete(code);},
   look(dx,dy){if(Number.isFinite(dx))yaw-=dx*.0022;if(Number.isFinite(dy))pitch=Math.max(-1.45,Math.min(1.45,pitch-dy*.0022));},
   setLook(y=0,p=-.06){yaw=y;pitch=p;},clear(){keys.clear();jump=0;},
   sample(dt,grounded){
    // Look and jump are independent of translation, including while airborne.
    yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*1.8*dt;
    pitch=Math.max(-1.45,Math.min(1.45,pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*1.4*dt));
    const x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0),doJump=jump>0&&grounded;
    jump=Math.max(0,jump-dt);if(doJump)jump=0;
    return {x:x*Math.cos(yaw)+z*Math.sin(yaw),z:-x*Math.sin(yaw)+z*Math.cos(yaw),shift:keys.has('ShiftLeft')||keys.has('ShiftRight'),jump:doJump,moving:!!(x||z)};
   }
  };
 }
 const api={create};if(typeof module!=='undefined')module.exports=api;else root.IslandInput=api;
})(typeof window!=='undefined'?window:globalThis);
