import * as T from 'three';
import { rarity, weapons, type Rarity, type WeaponId } from './weapons.ts';

export function weaponModel(id:Exclude<WeaponId,'longsword'>) {
  const right=new T.Group(), left=new T.Group();
  const steel=new T.MeshStandardMaterial({color:'#cad6e5',metalness:.72,roughness:.25});
  const iron=new T.MeshStandardMaterial({color:'#343b54',metalness:.7,roughness:.36});
  const leather=new T.MeshStandardMaterial({color:'#322523',roughness:.94});
  const accent=new T.MeshStandardMaterial({color: {greatsword:0xa74722,axe:0x7aa4db,staff:0x8dd9ed,shield:0x39608a,katana:0x749e89}[id],
    metalness:.56,roughness:.28,emissive:weapons[id].color,emissiveIntensity:.16});
  function add(geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0,parent=right) {
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function profile(points:readonly (readonly [number,number])[], depth:number, material:T.Material,parent=right,z=0,bevel=true) {
    const shape=new T.Shape();
    points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
    shape.closePath();
    return add(new T.ExtrudeGeometry(shape,{steps:1,depth,bevelEnabled:bevel,bevelThickness:.018,bevelSize:.015,bevelSegments:1,curveSegments:1}),material,0,0,z-depth/2,parent);
  }
  function handle(length:number,radius:number) {
    add(new T.CylinderGeometry(radius*.91,radius,length,7),leather,0,length*.25-.08);
    const gripBand=new T.CylinderGeometry(radius*1.09,radius*1.09,.022,7,1,true);
    for(let i=0;i<5;i++) add(gripBand,iron,0,(i-2)*length*.16+length*.25-.08);
    add(new T.IcosahedronGeometry(radius*1.48,0),iron,0,-length*.25-.09);
  }
  if(id==='staff'){
    add(new T.CylinderGeometry(.062,.047,1.7,7),leather,0,.27);
    for(const y of [-.56,.48,.96,1.12]) add(new T.CylinderGeometry(.095,.077,.12,7),iron,0,y);
    const crystal=new T.CylinderGeometry(.18,.092,.46,6).translate(0,-.05,0);
    add(crystal,accent,0,1.39).rotation.y=.32;
    add(new T.ConeGeometry(.18,.29,6),steel,0,1.715).rotation.y=.32;
    add(new T.OctahedronGeometry(.12),accent,0,1.43,.17).scale.set(.50,1.72,.42);
    for(const direction of [-1,1]) profile([[direction*.05,.99],[direction*.22,1.22],[direction*.16,1.42],[direction*.09,1.23]],.065,steel);
  } else if(id==='axe'){
    add(new T.CylinderGeometry(.068,.051,1.46,7),leather,0,.37);
    for(const y of [-.33,.20,.68,1.05]) add(new T.CylinderGeometry(.089,.075,.14,7),iron,0,y);
    for(const side of [-1,1]){
      profile([[0,.86],[side*.23,.83],[side*.56,.60],[side*.67,.87],[side*.64,1.16],[side*.48,1.36],[side*.22,1.12],[0,1.09]],.11,steel);
      profile([[side*.20,1.05],[side*.43,1.13],[side*.34,.99],[side*.55,.95],[side*.27,.83],[side*.38,.97]],.01,accent,right,.075,false);
      profile([[side*.29,.92],[side*.56,.63],[side*.64,.84],[side*.62,1.15],[side*.48,1.34],
        [side*.56,1.10],[side*.58,.86],[side*.53,.78]],.014,iron,right,.063,false);
    }
    add(new T.OctahedronGeometry(.16),accent,0,1.02).scale.set(.84,1.37,.75);
  } else if(id==='katana'){
    handle(.39,.047);
    add(new T.CylinderGeometry(.14,.14,.047,12),iron,0,.195);
    profile([[-.049,.21],[.05,.21],[.085,.71],[.157,1.18],[.266,1.45],[.209,1.48],[.085,1.21],[.001,.74]],.043,steel);
    profile([[.021,.32],[.061,.72],[.136,1.19],[.228,1.41],[.121,1.17],[.045,.72]],.007,accent,right,.034,false);
  } else {
    const big=id==='greatsword', width=big?.157:.086, length=big?1.86:1.21;
    handle(big?.57:.28,big?.066:.047);
    profile([[-width,.27],[width,.27],[width*.87,length-.28],[0,length],[-width*.87,length-.28]],big?.085:.052,steel);
    const guard=big?.36:.239;
    profile([[-guard,.18],[-guard*.9,.31],[0,.24],[guard*.9,.31],[guard,.18],[0,.13]],.12,iron);
    for(const sign of [-1,1]){
      profile([[-width*.39,.31],[width*.39,.31],[width*.22,length-.25],[0,length-.09],[-width*.22,length-.25]],
        .014,iron,right,sign*(big?.053:.033),false);
      profile([[-width*.21,.37],[width*.09,.43],[width*.23,.64],[width*.08,.79],[width*.13,length-.28],
        [-width*.04,length-.16],[-width*.10,.81],[width*.04,.66]],.008,accent,right,sign*(big?.066:.045),false);
    }
    add(new T.OctahedronGeometry(big?.106:.075),accent,0,.24,.08).scale.set(.84,1.05,.48);
    if(id==='shield'){
      profile([[-.36,.42],[.36,.42],[.37,-.09],[.25,-.44],[0,-.65],[-.25,-.44],[-.37,-.09]],.09,steel,left);
      profile([[-.31,.36],[.31,.36],[.32,-.07],[.21,-.40],[0,-.57],[-.21,-.40],[-.32,-.07]],.045,iron,left,.055);
      profile([[-.18,.24],[0,.34],[.18,.24],[.13,-.21],[0,-.44],[-.13,-.21]],.027,accent,left,.094);
      add(new T.IcosahedronGeometry(.10,0),steel,0,.02,.14,left).scale.z=.55;
    }
  }
  const clock={value:0}, rank={value:0};
  const energyMaterial=new T.ShaderMaterial({
    uniforms:{clock,rank,tint:{value:new T.Color(weapons[id].color)},crown:{value:new T.Color()}},
    vertexShader:`
      attribute vec2 flow;
      varying vec2 vFlow;
      void main(){
        vFlow=flow;
        vec3 p=position;
        if(flow.y>1.5){
          p.x+=sin(clock*11.+flow.x*15.)*.037;
          p.z+=cos(clock*9.+flow.x*18.)*.033;
        }
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`
      uniform float clock,rank;
      uniform vec3 tint,crown;
      varying vec2 vFlow;
      void main(){
        float surge=pow(.5+.5*sin(vFlow.x*22.-clock*9.),2.);
        float engraving=vFlow.y<.5?1.:0.;
        float alpha=mix((.15+.70*surge)*smoothstep(.04,.59,rank),.26+.41*rank+surge*.28,engraving);
        vec3 color=mix(tint,crown,rank*rank*.43);
        gl_FragColor=vec4(mix(color,vec3(1.),surge*.66),alpha);
        #include <colorspace_fragment>
      }`,
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
  });

  function inscriptions(parent:T.Group,shield=false){
    const points:number[]=[], flow:number[]=[];
    function stroke(vertices:number[][],kind:number){
      for(let i=1;i<vertices.length;i++) for(const j of [i-1,i]){
        const [x,y,z]=vertices[j];
        points.push(x,y,z);
        flow.push(y+x*.85,kind);
      }
    }
    const offset=(y:number)=>id==='katana'?.04+.19*y**3:0;
    if(shield){
      for(let i=0;i<3;i++){
        const size=.11+i*.072;
        stroke([[0,.23+size*.23,.131],[size,.067,.131],[size*.75,-.115,.131],
          [0,-.15-size*.9,.131],[-size*.75,-.115,.131],[-size,.067,.131],[0,.23+size*.23,.131]],i===0?0:1);
      }
      for(let i=0;i<3;i++){
        const y=-.16+i*.155;
        stroke([[-.15,y,.133],[-.075,y+.037,.133],[.025,y-.024,.133],[.12,y+.017,.133]],1);
      }
    }else if(id==='axe'){
      for(const z of [-.083,.083]) for(const y of [.88,1,1.12]){
        stroke([[-.53,y,z],[-.34,y+.075,z],[-.19,y-.015,z],[0,y+.035,z],
          [.18,y-.076,z],[.37,y+.068,z],[.53,y+.023,z]],2);
        for(const side of [-1,1]) stroke([[side*.38,y-.054,z],[side*.28,y,z],[side*.39,y+.052,z]],0);
      }
    }else{
      const tip={greatsword:1.74,katana:1.40,shield:1.12,staff:1.83}[id];
      const base=id==='staff'?.99:.40;
      const front={greatsword:.076,katana:.041,shield:.055,staff:.17}[id];
      for(const face of [-1,1]){
        for(let i=0;i<5;i++){
          const y=base+(tip-base)*i/5, x=offset(y);
          const z=face*front;
          stroke([[x,y-.044,z],[x-.018,y+.012,z],[x+.018,y+.056,z],[x,y-.044,z]],0);
          stroke([[x-.026,y+.029,z],[x+.026,y+.016,z]],0);
        }
      }
      for(let lane=0;lane<5;lane++){
        const a=lane*Math.PI*2/5;
        const trace=Array.from({length:22},(_,i)=>{
          const f=i/21,y=base+(tip-base)*f,pulse=Math.sin(f*15+a);
          const spread=id==='greatsword'?.19:id==='staff'?.25:id==='shield'?.097:.095;
          return [offset(y)+spread*Math.sin(f*Math.PI)*pulse,y,
            spread*Math.sin(f*Math.PI)*Math.cos(f*11+a)+.035*Math.cos(a)];
        });
        stroke(trace,2);
      }
    }
    const geometry=new T.BufferGeometry()
      .setAttribute('position',new T.Float32BufferAttribute(points,3))
      .setAttribute('flow',new T.Float32BufferAttribute(flow,2));
    const lines=new T.LineSegments(geometry,energyMaterial);
    lines.frustumCulled=false;
    parent.add(lines);
  }
  inscriptions(right);
  if(id==='shield') inscriptions(left,true);

  if(id==='greatsword'||id==='shield'||id==='katana'){
    const fire=id==='greatsword',wind=id==='katana';
    const bladeLength=fire?1.64:wind?1.27:1.04;
    const positions:number[]=[], uv:number[]=[], indices:number[]=[];
    for(let lane=0;lane<3;lane++) for(let i=0;i<=18;i++){
      const t=i/18;
      for(const edge of [0,1]){
        positions.push(0,.29+t*bladeLength,0);
        uv.push(t,(lane+edge*.82)/3);
      }
      if(i>0){
        const end=lane*38+i*2;
        indices.push(end-2,end-1,end,end,end-1,end+1);
      }
    }
    const geometry=new T.BufferGeometry()
      .setAttribute('position',new T.Float32BufferAttribute(positions,3))
      .setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);
    const material=new T.ShaderMaterial({
      uniforms:{...energyMaterial.uniforms,style:{value:fire?0:wind?2:1}},
      vertexShader:`
        uniform float clock, rank, style;
        varying vec2 flowUv;
        void main(){
          flowUv=vec2(uv.x,fract(uv.y*3.)/.82);
          float lane=floor(uv.y*3.);
          float phase=lane*2.094+uv.x*(style==0.?15.:9.)-clock*(style==0.?7.4:4.8);
          float taper=sin(uv.x*3.14159);
          float width=taper*(.04+rank*.085);
          float windCenter=style==2.?(.033+.25*uv.x*uv.x*uv.x):0.;
          vec3 p=position;
          p.x+=windCenter+(cos(phase)*width+(flowUv.y-.5)*width*(style==0.?2.5:1.));
          p.z+=sin(phase)*width+(lane-1.)*.047;
          p.y+=taper*.038*sin(phase*1.43);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
        }`,
      fragmentShader:`
        uniform float clock,rank,style;
        uniform vec3 tint,crown;
        varying vec2 flowUv;
        void main(){
          float pulse=.5+.5*sin(flowUv.x*(style==0.?38.:23.)-clock*(style==0.?14.:9.));
          float edge=sin(flowUv.y*3.14159);
          float lengthFade=sin(flowUv.x*3.14159);
          vec3 hue=style==0.?vec3(1.,.115,.011):tint;
          vec3 color=mix(hue,crown,rank*rank*.25);
          color=mix(color,vec3(1.,.94,.82),pulse*edge*.69);
          gl_FragColor=vec4(color,edge*lengthFade*(.14+pulse*.55)*smoothstep(.06,.58,rank));
          #include <colorspace_fragment>
        }`,
      transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
      blending:T.AdditiveBlending,toneMapped:false,
    });
    const stream=new T.Mesh(geometry,material);
    stream.frustumCulled=false;
    right.add(stream);
  }
  const floating=new T.InstancedMesh(new T.OctahedronGeometry(1),new T.MeshBasicMaterial({
    color:weapons[id].color,transparent:true,opacity:.58,depthWrite:false,blending:T.AdditiveBlending,
  }),10);
  floating.count=0;floating.visible=false;floating.frustumCulled=false;
  floating.instanceMatrix.setUsage(T.DynamicDrawUsage);
  right.add(floating);
  const matrix=new T.Object3D();
  function update(time:number,tier:Rarity){
    const strength=(rarity[tier].multiplier-1)/2.2;
    const level=Object.keys(rarity).indexOf(tier);
    clock.value=time;rank.value=strength;
    energyMaterial.uniforms.crown.value.set(rarity[tier].color);
    accent.emissiveIntensity=.08+strength*(.82+.22*Math.sin(time*5.2));
    floating.count=Math.min(10,(id==='staff'||id==='greatsword'?2:0)+level*2);
    floating.visible=floating.count>0;
    const focus=id==='staff'?1.42:id==='axe'?1:.84;
    for(let i=0;i<floating.count;i++){
      const age=(time*(id==='greatsword'?1.55:.81)+i*.237)%1;
      const a=time*4.7+i*2.399;
      const radius=(id==='axe'?.43:.17)+strength*.12;
      matrix.position.set(Math.cos(a)*radius,focus+(age-.5)*(id==='staff'?.59:.92),Math.sin(a)*radius);
      matrix.rotation.set(a,age*4,i);
      const size=(.015+strength*.024)*(Math.sin(age*Math.PI))*(i%3+2)*.56;
      matrix.scale.set(size,size*(id==='staff'?2.9:id==='greatsword'?3.7:1.35),size);
      matrix.updateMatrix();floating.setMatrixAt(i,matrix.matrix);
    }
    floating.instanceMatrix.needsUpdate=true;
  }
  return {right,left,update};
}
