(function(root){
 'use strict';
 const layout={center:{x:3.5,z:19.5},hall:{x0:-4,x1:10,z0:11,z1:27},tower:{x:11,z:20,top:27},entrance:{x:3.5,y:1,z:8.5},style:'fantasy-guildhall'};
 function build(put){
  const p=(x,y,z,t)=>put(x,y,z,t,true);
  const box=(x0,x1,y0,y1,z0,z1,t)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)p(x,y,z,t);};
  for(let x=-24;x<=30;x++)for(let z=-5;z<=38;z++){put(x,0,z,'grass');put(x,-1,z,'dirt');if(x>-22&&x<29&&z>-3&&z<37)put(x,-2,z,'stone');}
  for(let z=-5;z<=6;z++)for(let x=-1;x<=1;x++)p(x,0,z,'track');
  // Central forecourt and layered plinth. The main entrance stays level and walkable.
  for(let x=-6;x<=12;x++)for(let z=9;z<=29;z++)p(x,0,z,(x===-6||x===12||z===9||z===29)?'cobble':'brick');
  for(let x=-4;x<=10;x++)for(let z=11;z<=27;z++)p(x,0,z,(x+z)%4===0?'plank':'marble');
  for(let x=-2;x<=8;x++)for(let z=6;z<=10;z++)p(x,0,z,(x+z)%3===0?'cobble':'brick');
  for(const x of [-5,11])for(const z of [11,16,22,27]){box(x,x,1,2,z,z,'cobble');box(x,x,3,8,z,z,'beam');p(x,9,z,'copper');}
  // Long central hall: recessed windows, wood columns and contrasting stone footings.
  for(const x of [-4,10])for(let z=11;z<=27;z++)for(let y=1;y<=10;y++){
   if(y<=4&&(x===-4&&z>=16&&z<=18||x===10&&(z>=19&&z<=21||z>=24&&z<=26)))continue;
   const post=[11,16,22,27].includes(z),window=!post&&y>=3&&y<=6;
   p(x,y,z,y<=2?'cobble':post?'beam':y===8?'plank':window?'glass':'marble');
  }
  for(const z of [11,27])for(let x=-4;x<=10;x++)for(let y=1;y<=16-Math.floor(Math.abs(x-3)*.7);y++){
   if(x>=1&&x<=5&&y<=5)continue;
   const wood=y===2||y===8||x===-4||x===10;
   p(x,y,z,wood?'beam':y>=10&&Math.abs(x-3)<=1?'stained':'marble');
  }
  // Main blue gable roof, deep overhangs and copper ridge.
  for(let x=-6;x<=12;x++)for(let z=9;z<=29;z++){
   const y=11+Math.floor((9-Math.abs(x-3))*.65);
   p(x,y,z,x===3||z===9||z===29?'copper':'roof');
   if(x===-6||x===12)p(x,y-1,z,'beam');
  }
  // Projecting timber entrance porch and balcony, framing a clear five-block doorway.
  for(const x of [-1,6])box(x,x,1,5,7,7,'beam');
  box(-1,7,6,6,7,11,'plank');box(-1,7,7,7,9,10,'beam');
  for(const x of [-1,7])box(x,x,8,9,9,10,'log');
  p(0,5,8,'lantern');p(6,5,8,'lantern');
  // West guild/library wing, lower warm copper roof and timber framing.
  for(let x=-12;x<=-5;x++)for(let z=13;z<=20;z++){
   p(x,0,z,'plank');
   for(let y=1;y<=5;y++)if(x===-12||x===-5||z===13||z===20){
    if(x===-5&&z>=16&&z<=18&&y<=3)continue;
    p(x,y,z,y===1?'cobble':x%3===0||y===5?'beam':y>=3&&y<=4&&z===13?'glass':'sand');
   }
  }
  for(let x=-13;x<=-4;x++)for(let z=12;z<=21;z++)p(x,6+Math.floor((5-Math.abs(x+8))*.5),z,z===12||z===21?'beam':'copper');
  // Attached octagonal enchanting tower, white masonry, wood collars and a plum spire.
  for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
   if(Math.abs(dx)+Math.abs(dz)>5)continue;
   const edge=Math.max(Math.abs(dx),Math.abs(dz))===3||Math.abs(dx)+Math.abs(dz)===5;
   p(11+dx,0,20+dz,'plank');if(!edge)continue;
   for(let y=1;y<=16;y++){
    if(dx===-3&&Math.abs(dz)<=1&&y<=4)continue;
    const window=(Math.abs(dx)<=1&&Math.abs(dz)===3||Math.abs(dz)<=1&&Math.abs(dx)===3)&&[7,8,9,13,14].includes(y);
    p(11+dx,y,20+dz,y<4?'cobble':[5,11,16].includes(y)?'beam':window?'stained':'marble');
   }
  }
  for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)if(Math.abs(dx)+Math.abs(dz)<=7&&Math.max(Math.abs(dx),Math.abs(dz))>=3)p(11+dx,10,20+dz,'plank');
  const radii=[5,5,4,3,3,2,2,1,1,0];
  radii.forEach((r,i)=>{for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(Math.abs(dx)+Math.abs(dz)<=r*1.65+.1)p(11+dx,17+i,20+dz,i===0?'copper':'plumroof');});
  p(11,27,20,'gold');
  // East workshop pavilion, its own silhouette and a recessed front veranda.
  for(let x=19;x<=25;x++)for(let z=9;z<=15;z++){
   p(x,0,z,'plank');for(let y=1;y<=5;y++)if(x===19||x===25||z===9||z===15){
    if(z===9&&x>=21&&x<=23&&y<=3)continue;
    p(x,y,z,y===1?'brick':x===19||x===25||y===5?'log':y>=3&&y<=4?'glass':'plank');
   }
  }
  for(let x=18;x<=26;x++)for(let z=7;z<=16;z++)p(x,6+Math.floor((4-Math.abs(x-22))*.65),z,z===7||z===16?'copper':'plumroof');
  for(const x of [19,25])box(x,x,1,5,7,7,'beam');
  // Open rear terrace and pergola, with multiple heights rather than a flat rectangle.
  box(13,21,0,0,27,32,'plank');
  for(const [x,z] of [[13,27],[21,27],[13,32],[21,32]]){box(x,x,1,5,z,z,'log');p(x,6,z,'lantern');}
  for(let x=13;x<=21;x++)for(const z of [27,29,32])p(x,6,z,'beam');
  for(let z=27;z<=32;z++)for(const x of [13,21])p(x,1,z,'beam');
  // Interior gallery furniture stays outside the central through-route.
  for(const z of [15,21,25])for(const x of [-2,8]){box(x,x,1,1,z,z+1,'plank');p(x,2,z+1,'beam');}
  for(const x of [-3,9]){p(x,1,8,'cobble');p(x,2,8,'leaves');}
  // Keep the existing resource positions to preserve harvesting saves.
  for(const [x,z] of [[-18,2],[-10,1],[-5,2],[-21,13],[-17,28],[-8,32],[2,32],[28,18],[28,30]]){
   const h=4+(Math.abs(x)%2);for(let y=1;y<=h;y++)put(x,y,z,'log');
   for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=h-1;dy<=h+1;dy++)if(Math.abs(dx)+Math.abs(dz)+(dy===h+1?1:0)<=3&&!(dx===0&&dz===0&&dy<=h))put(x+dx,dy,z+dz,'leaves');
  }
  for(let x=-22;x<=-19;x++)for(let z=19;z<=23;z++)for(let y=1;y<=2;y++)put(x,y,z,'stone');
  for(let x=-8;x<=-5;x++)for(let z=22;z<=25;z++)put(x,1,z,'sand');
  // Forecourt paving must not replace the existing protected parkour approach.
  for(let z=-5;z<=6;z++)for(let x=-1;x<=1;x++)p(x,0,z,'track');
 }
 function details(){
  const d=[],box=(x,y,z,sx,sy,sz,type='beam',angle=0)=>d.push({x,y,z,sx,sy,sz,type,angle});
  // Slender jambs, overhanging sills, diagonal braces and half-height rails are visual trim.
  for(const x of [-4.16,11.16])for(const z of [14,20,25]){
   for(const zz of [z-.8,z+.8])box(x,5,z===20?zz+.5:zz,.2,3,.16);
   box(x,6.6,z,.25,.2,2);box(x,3.5,z,.75,.25,2.2,'plank');box(x,5,z,.2,.12,1.8);
  }
  for(const x of [-2,8]){box(x,8.9,10.85,.22,3.2,.22,'beam',x<3?-.65:.65);box(x,8.1,10.75,2.6,.22,.35,'plank');}
  for(const z of [13,19,25])for(const x of [-2,8])box(x,9.5,z,.2,2.5,.2,'beam');
  for(let x=0;x<=6;x++){box(x,8.65,9,.13,1.3,.13);box(x,9.3,9,1.05,.16,.2,'plank');}
  // A suspended chandelier, safely above head height.
  box(3.5,13,19.5,.14,6,.14,'gold');box(3.5,10,19.5,4,.18,.18,'gold');box(3.5,10,19.5,.18,.18,4,'gold');
  for(const [x,z] of [[1.5,19.5],[5.5,19.5],[3.5,17.5],[3.5,21.5]]){box(x,9.6,z,.12,.7,.12,'gold');box(x,9.1,z,.5,.6,.5,'lantern');}
  for(const x of [7,15])for(let z=18;z<=22;z++){box(x,11.7,z,.13,1.3,.13);box(x,12.4,z,.2,.16,1.1,'plank');}
  for(const z of [16,24])for(let x=8;x<=14;x++){box(x,11.7,z,.13,1.3,.13);box(x,12.4,z,1.1,.16,.2,'plank');}
  // Repeated small corbels support the projecting roof collars.
  for(const z of [12,16,22,27])for(const x of [-5.1,11.1])box(x,9.3,z,.2,2,.2,'beam',x<3?-.65:.65);
  for(const [x,z] of [[0,7],[6,7],[19,7],[25,7]]){box(x,4.8,z+.8,.18,1.6,.18,'beam',.65);box(x,4.4,z,.55,.7,.55,'lantern');}
  return d;
 }
 const api={build,details,layout};if(typeof module!=='undefined')module.exports=api;else root.IslandHome=api;
})(typeof window!=='undefined'?window:globalThis);
