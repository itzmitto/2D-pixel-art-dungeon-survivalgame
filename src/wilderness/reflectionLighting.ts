import * as T from 'three';

export function reflectionLighting(studio=false){
  const width=128,height=64, data=new Uint16Array(width*height*4);
  const moon=new T.Vector3(-.37,.83,-.40).normalize();
  const fill=new T.Vector3(.78,.41,.48).normalize();
  const rim=new T.Vector3(.29,.31,-.91).normalize();
  for(let y=0;y<height;y++){
    const polar=(y+.5)/height*Math.PI;
    const vertical=-Math.cos(polar), ring=Math.sin(polar);
    for(let x=0;x<width;x++){
      const angle=((x+.5)/width-.5)*Math.PI*2;
      const dx=Math.cos(angle)*ring,dz=Math.sin(angle)*ring;
      const key=Math.max(0,dx*moon.x+vertical*moon.y+dz*moon.z);
      const bounce=Math.max(0,dx*fill.x+vertical*fill.y+dz*fill.z);
      const edge=Math.max(0,dx*rim.x+vertical*rim.y+dz*rim.z);
      const strip=key**(studio?25:52)*(studio?8.4:3.7);
      const halo=key**7*(studio?.48:.25);
      const warm=bounce**(studio?18:9)*(studio?2.4:.15);
      const blue=edge**(studio?32:13)*(studio?4.6:.21);
      const sky=.020+Math.max(0,vertical)*.047, ground=Math.max(0,-vertical)*.019;
      const i=(y*width+x)*4;
      data[i]=T.DataUtils.toHalfFloat(sky*.65+ground+strip*.78+halo*.56+warm+blue*.26);
      data[i+1]=T.DataUtils.toHalfFloat(sky*.82+ground*.76+strip*.88+halo*.73+warm*.73+blue*.62);
      data[i+2]=T.DataUtils.toHalfFloat(sky+ground*.59+strip+halo+warm*.46+blue);
      data[i+3]=T.DataUtils.toHalfFloat(1);
    }
  }
  const texture=new T.DataTexture(data,width,height,T.RGBAFormat,T.HalfFloatType);
  texture.mapping=T.EquirectangularReflectionMapping;
  texture.minFilter=texture.magFilter=T.LinearFilter;
  texture.needsUpdate=true;
  return texture;
}
