import { bank, extent, height, inForest } from '../layout';
import { randomSequence } from '../layout';

// Atlas artwork is derived once from the same height and forest functions as the world.
const step=6;
const samples=extent*2/step;
const elevations=Array.from({length:samples+1},(_,row)=>
  Array.from({length:samples+1},(_,col)=>height(-extent+col*step,-extent+row*step)));

export function contours(levels:readonly number[]){
  return levels.map(level=>{
    const path:string[]=[];
    for(let row=0;row<samples;row++) for(let col=0;col<samples;col++){
      const x=-extent+col*step,z=-extent+row*step;
      const corners=[[x,z,elevations[row][col]],[x+step,z,elevations[row][col+1]],
        [x+step,z+step,elevations[row+1][col+1]],[x,z+step,elevations[row+1][col]]];
      const edges:string[]=[];
      for(let i=0;i<4;i++){
        const [ax,az,a]=corners[i],[bx,bz,b]=corners[(i+1)%4];
        if((a<level)===(b<level)) continue;
        const t=(level-a)/(b-a);
        edges.push((ax+(bx-ax)*t).toFixed(1)+' '+(az+(bz-az)*t).toFixed(1));
      }
      for(let i=0;i+1<edges.length;i+=2) path.push('M'+edges[i]+'L'+edges[i+1]);
    }
    return path.join('');
  });
}
let texture:string|undefined;
export function terrainTexture(){
  if(texture) return texture;
  const canvas=document.createElement('canvas');
  const size=480;
  canvas.width=canvas.height=size;
  const context=canvas.getContext('2d');
  if(!context) return '';
  const data=context.createImageData(size,size);
  for(let row=0;row<size;row++) for(let col=0;col<size;col++){
    const x=-extent+col/size*extent*2,z=-extent+row/size*extent*2;
    const elevation=height(x,z), forest=inForest(x,z);
    const slope=(height(x-2,z-2)-height(x+2,z+2))*18;
    const grain=Math.sin(x*7.29+z*15.72)*3+Math.sin(x*.38-z*.24)*2;
    const blend=Math.min(1,Math.max(0,(elevation-3)/8));
    const shade=slope+grain;
    const base=forest?[33,56,48]:[75,75,53];
    const index=(row*size+col)*4;
    for(let channel=0;channel<3;channel++) data.data[index+channel]=base[channel]*(1-blend)+[109,102,83][channel]*blend+shade;
    data.data[index+3]=255;
  }
  context.putImageData(data,0,0);
  texture=canvas.toDataURL();
  return texture;
}
const random=randomSequence(387);
export const cartographicTrees=Array.from({length:1600},()=>{
  const x=random()*extent*2-extent,z=random()*extent*2-extent;
  return {x,z,s:2+random()*2.1};
}).filter(({x,z})=>inForest(x,z)&&bank(x,z)>11);
