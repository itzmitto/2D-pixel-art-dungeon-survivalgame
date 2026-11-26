import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RelicId } from './itemInstances.ts';
import { surfaceNoise } from './surfaceDetail.ts';
import { weaponFinish } from './weaponAppearance.ts';
import { rarity, type Rarity, type WeaponId } from './weapons.ts';

type Point=readonly [number,number];
type Station=readonly [y:number,center:number,width:number,ridge:number];
type Rune=readonly [number,number,number];
const tierOrder=Object.keys(rarity) as Rarity[];

function edgeMetal(color:number,roughness:number,metalness:number){
  const material=new T.MeshStandardMaterial({color,roughness,metalness});
  material.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 forgedPosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nforgedPosition=position;');
    s.fragmentShader=surfaceNoise+'varying vec3 forgedPosition;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 steelUV=vec2(forgedPosition.x+forgedPosition.z*.61,forgedPosition.y);
      float mottling=grain(steelUV*12.);
      float brushed=grain(steelUV*vec2(175.,31.));
      float flag=grain(steelUV*vec2(118.,4.)+mottling*.57);
      float forge=surfaceContrast(steelUV*vec2(105.,27.));
      diffuseColor.rgb*=.82+mottling*.24+forge*(brushed*.09+flag*.13);
      `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+.24*(mottling-.5)+.09*(flag-.5)*forge,.16,1.);
      `).replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
      metalnessFactor=clamp(metalnessFactor+.11*(brushed-.5)*forge,0.,1.);
      `);
  };
  return material;
}

function plate(points:readonly Point[],depth:number,bevel:number){
  const shape=new T.Shape();
  points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  return new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel*.74,bevelSize:bevel,bevelSegments:2,curveSegments:1})
    .translate(0,0,-depth/2);
}

function ribbon(paths:readonly (readonly Rune[])[],width:number){
  const vertices:number[]=[], uv:number[]=[], indices:number[]=[];
  for(const path of paths) for(let i=1;i<path.length;i++){
    const [x,y,z]=path[i-1], [xx,yy,zz]=path[i], length=Math.hypot(xx-x,yy-y)||1;
    const dx=(yy-y)*width/length,dy=(x-xx)*width/length,j=vertices.length/3;
    vertices.push(x+dx,y+dy,z,x-dx,y-dy,z,xx+dx,yy+dy,zz,xx-dx,yy-dy,zz);
    uv.push((i-1)/(path.length-1),0,(i-1)/(path.length-1),1,i/(path.length-1),0,i/(path.length-1),1);
    indices.push(j,j+1,j+2,j+1,j+3,j+2);
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3))
    .setAttribute('uv',new T.Float32BufferAttribute(uv,2)).setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function blade(stations:readonly Station[],edge:boolean,offset=.52){
  const vertices:number[]=[], uv:number[]=[];
  for(let i=1;i<stations.length;i++) for(const side of [-1,1]) for(const face of [-1,1]){
    const point=([y,x,w,r]:Station,part:number)=>{
      if(part===0) return [x,y,face*r];
      return [x+side*w*(part===1?offset:1),y,face*(part===1?r*.55:.001)];
    };
    const a=point(stations[i-1],edge?1:0),b=point(stations[i-1],edge?2:1),
      c=point(stations[i],edge?1:0),d=point(stations[i],edge?2:1);
    vertices.push(...(side===face?[a,b,c,b,d,c]:[a,c,b,b,c,d]).flat());
    uv.push(0,0,1,0,0,1,1,0,1,1,0,1);
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3))
    .setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.computeVertexNormals();
  return geometry;
}

function gemstone(w:number,h:number,facets=6){
  const points:number[]=[], colors:number[]=[],uv:number[]=[];
  const rings=[[-h*.53,0],[-h*.27,w*.77],[h*.17,w],[h*.59,0]];
  for(let i=0;i<facets;i++){
    const a=i*2*Math.PI/facets,b=(i+1)*2*Math.PI/facets;
    for(let j=1;j<rings.length;j++){
      const [y,r]=rings[j], [base,q]=rings[j-1];
      const p=[Math.cos(a)*q,base,Math.sin(a)*q],k=[Math.cos(b)*q,base,Math.sin(b)*q];
      const m=[Math.cos(a)*r,y,Math.sin(a)*r],n=[Math.cos(b)*r,y,Math.sin(b)*r];
      points.push(...p,...m,...k,...k,...m,...n);
      const tone=.49+(i*7%facets)/facets*.57+j*.045;
      for(let k=0;k<6;k++) colors.push(tone*.93,tone,tone*1.07);
      uv.push(0,0,0,1,1,0,1,0,0,1,1,1);
    }
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(points,3))
    .setAttribute('color',new T.Float32BufferAttribute(colors,3)).setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.computeVertexNormals();
  return geometry;
}

export function weaponModel(id:WeaponId,relic?:RelicId) {
  const right=new T.Group(),left=new T.Group(), rankDetails=new T.Group();
  right.add(rankDetails);
  const [silver,dark,fittings,element]=weaponFinish(id,relic);
  const steel=edgeMetal(silver,.29,.78),core=edgeMetal(dark,.46,.68), trim=edgeMetal(fittings,.37,.72);
  const grip=edgeMetal(id==='staff'?0x3c2c2b:0x261e23,.92,.04);
  const wrap=edgeMetal(id==='staff'?0x604839:0x4d3a32,.85,.03);
  wrap.side=T.DoubleSide;
  const crystal=new T.MeshPhysicalMaterial({color:element,vertexColors:true,metalness:.15,roughness:.22,
    clearcoat:.72,clearcoatRoughness:.15,emissive:element,emissiveIntensity:.11,flatShading:true});
  const clock={value:0},rank={value:0},energyColor={value:new T.Color(element)};
  const engraving=new T.ShaderMaterial({
    uniforms:{clock,rank,energyColor},transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    vertexShader:`varying vec2 mark; varying vec3 markPosition;
      void main(){mark=uv;markPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float clock,rank; uniform vec3 energyColor; varying vec2 mark; varying vec3 markPosition;
      void main(){
        float i=markPosition.y*7.+markPosition.x*3.3;
        float wave=pow(.5+.5*sin(i-clock*4.7),5.);
        float edge=1.-smoothstep(.19,.5,abs(mark.y-.5));
        float light=smoothstep(.23,.79,rank);
        vec3 ink=mix(energyColor*.32,mix(energyColor,vec3(.87,.94,1.),wave*.66),light);
        gl_FragColor=vec4(ink,edge*(.24+rank*.58+wave*.22*light));
        #include <colorspace_fragment>
      }`,
  });
  const edges=new T.ShaderMaterial({
    uniforms:{clock,rank,energyColor},transparent:true,depthWrite:false,side:T.DoubleSide,
    forceSinglePass:true,blending:T.AdditiveBlending,
    vertexShader:`uniform float clock; varying vec2 vUv; void main(){vUv=uv;vec3 p=position;
      p.z+=sin(22.*uv.x-clock*17.)*.038*sin(uv.x*3.14159);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float clock,rank; uniform vec3 energyColor; varying vec2 vUv;
      void main(){
        float t=vUv.x;
        float sway=sin(t*56.-clock*23.)*.14+sin(t*23.+clock*9.)*.12;
        float fil=1.-smoothstep(.009,.29,abs(vUv.y-.5+sway));
        float pulse=pow(.5+.5*sin(t*18.-clock*8.),3.);
        float envelope=pow(max(0.,sin(t*3.14159)),.45);
        gl_FragColor=vec4(mix(energyColor,vec3(.82,.91,1.),pulse*.62),envelope*fil*rank*(.18+.53*pulse));
        #include <colorspace_fragment>
      }`,
  });

  const rigid=new Map<T.Group,Map<T.Material,T.BufferGeometry[]>>();
  function add(geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0,parent=right,tilt=0){
    geometry.rotateZ(tilt).translate(x,y,z);
    const materials=rigid.get(parent)??new Map<T.Material,T.BufferGeometry[]>();
    rigid.set(parent,materials);
    const parts=materials.get(material)??[];
    parts.push(geometry);materials.set(material,parts);
  }
  function fit(points:readonly Point[],depth:number,bevel:number,material:T.Material,parent=right,z=0){
    add(plate(points,depth,bevel),material,0,0,z,parent);
  }
  function ring(radius:number,tube:number,y:number,material:T.Material=trim,x=0,z=0,angle=0){
    add(new T.TorusGeometry(radius,tube,5,16).rotateX(Math.PI/2),material,x,y,z,right,angle);
  }
  function shaft(lo:number,hi:number,width:number,metal=false){
    add(new T.CylinderGeometry(width*.94,width,hi-lo,10),metal?core:grip,0,(hi+lo)/2);
  }
  function bound(lo:number,hi:number,w:number,diamond=false){
    shaft(lo,hi,w);
    const n=Math.ceil((hi-lo)/.043);
    if(diamond){
      for(const side of [-1,1]) for(let i=0;i<n-1;i++){
        const z=side*(w*.94),y=lo+.038+i*.037;
        add(ribbon([[[-w*.62,y,z],[0,y+.029,z*1.13],[w*.62,y,z]]],.008),wrap);
        add(ribbon([[[w*.62,y,z],[0,y-.029,z*1.13],[-w*.62,y,z]]],.008),wrap);
      }
    }else{
      const helix=new class extends T.Curve<T.Vector3>{
        constructor(){super();}
        override getPoint(t:number,target=new T.Vector3()){
          return target.set(Math.cos(t*n*6.283)*w,lo+t*(hi-lo),Math.sin(t*n*6.283)*w);
        }
      }();
      add(new T.TubeGeometry(helix,n*8,w*.136,5,false),wrap);
    }
    for(const y of [lo-.006,hi+.008]){
      add(new T.CylinderGeometry(w*1.23,w*1.08,.029,12),core,0,y);
      ring(w*1.19,.006,y+.009);
    }
  }
  function cuts(stations:readonly Station[],ratio=.60){
    add(blade(stations,false,ratio),core);add(blade(stations,true,ratio),steel);
  }
  function runeMarks(points:readonly Rune[],spacing:number,sequence=0,parent=right){
    const paths:Rune[][]=[];
    const letters:readonly (readonly Point[])[]=[
      [[-.36,-.52],[0,.48],[.37,-.42],[-.29,-.08]],
      [[-.30,.41],[.34,-.35],[.05,-.46],[.04,.51]],
      [[-.36,.05],[.04,.48],[.36,.12],[.09,-.44],[-.36,.05]],
      [[-.31,-.40],[.27,.21],[-.12,.47],[.13,-.38],[.38,-.14]],
      [[-.38,.37],[.22,.31],[-.16,-.39],[.31,-.42]],
    ];
    points.forEach(([x,y,z],i)=>{
      const shape=letters[(i+sequence)%letters.length];
      const size=spacing*(.88+(i%3)*.09);
      paths.push(shape.map(([u,v])=>[x+u*size,y+v*size,z]));
    });
    add(ribbon(paths,spacing*.057),engraving,0,0,0,parent);
  }
  function pommel(y:number,r:number){
    add(new T.IcosahedronGeometry(r,0).scale(.87,1.23,.72),core,0,y);
    ring(r*.79,.008,y);
    add(new T.SphereGeometry(r*.45,8,5).scale(1,.91,.56),trim,0,y,r*.51);
  }
  function studs(points:readonly Point[],z:number,r=.024,parent=right){
    for(const [x,y] of points) add(new T.IcosahedronGeometry(r,0).scale(1,1,.51),trim,x,y,z,parent);
  }
  let focus=id==='greatsword'?1.19:1, activeEdges:T.Mesh|undefined;
  if(id==='longsword'||id==='greatsword'||id==='shield'){
    const large=id==='greatsword',fang=relic==='fangblade', titan=relic==='titanEdge',infernal=relic==='infernalRuin';
    const bone=relic==='boneSovereign',oath=relic==='oathbreaker';
    const w=large?.235:fang?.127:.102, l=large?1.96:fang?1.48:1.36;
    const stations:Station[]=[
      [.235,0,w*.63,.045],[.31,0,w*.72,.063],[.42,fang?.020:0,w*(titan?1.16:1),large?.086:.052],
      [.55,fang?.044:0,w*(bone?.69:infernal?1.04:.93),large?.076:.046],
      [l*.56,fang?.121:0,w*(infernal?1.07:.86),large?.066:.040],
      [l*.73,fang?.173:0,w*(titan?1.02:.78),large?.059:.034],
      [l*.88,fang?.200:0,w*(infernal?.50:.67),.029],[l,fang?.158:oath?.021:0,.001,.001],
    ];
    cuts(stations,large?.67:.49);
    const guard=large?.40:fang?.278:.238;
    const gripEnd=large?-.34:-.166, gripTop=large?.185:.153;
    bound(gripEnd,gripTop,large?.059:.046);pommel(gripEnd-.078,large?.098:.062);
    for(const side of [-1,1]){
      fit([[0,.148],[side*guard*.54,.146],[side*guard,.239],[side*guard*.99,.323],
        [side*guard*.79,.289],[side*guard*.66,.213],[0,.255]],large?.132:.095,.019,core);
      fit([[0,.216],[side*guard*.52,.214],[side*guard*.81,.265],
        [side*guard*.94,.294],[side*guard*.84,.239],[side*guard*.52,.186]],.012,.009,trim,right,.070);
      const points: Rune[]=stations.slice(2,-1).map(([y,x,,r])=>[x+(large?Math.sin(y*29)*.034:0),y,side*(r+.008)]);
      const full:Rune[][]=[];
      for(let i=1;i<points.length;i++){
        const [a,b,c]=points[i-1],[d,e,f]=points[i];
        full.push([[a,b,c],[(a+d)*.5-.018,(b+e)*.5,(c+f)*.5+.005*side],[d,e,f]]);
      }
      add(ribbon(full,large?.008:.0045),engraving);
      runeMarks(points.map(([x,y,z])=>[x+.038,y,z]),large?.071:.043,large?2:0);
    }
    add(gemstone(large?.085:.049,.153),id==='longsword'&&!fang?trim:crystal,0,.212,.099);
    if(large){
      studs([[-.253,.218],[.253,.218]],.079,.024);
      for(const side of [-1,1]){
        const tip=side*(titan?.41:infernal?.34:.29);
        fit([[side*.10,.31],[side*.26,.40],[tip,.53],[tip*.69,.38],[side*.17,.27]],.031,.010,trim,relic?right:rankDetails);
      }
      if(relic){
        const collars=titan?[.56,.93,1.3]:bone?[.49,.62,.75]:infernal?[.49,1.1,1.48]:[.48,.79,1.21];
        for(const [i,y] of collars.entries()) for(const z of [-1,1]){
          const span=w*(.57-i*.095);
          fit([[-span,y],[0,y+.091],[span,y],[0,y+.037]],.014,.007,trim,right,z*.081);
        }
      }
    }
    if(id==='shield'){
      const silhouette:Point[]=[[-.368,.35],[-.27,.415],[0,.365],[.27,.415],[.368,.35],[.341,-.107],
        [.236,-.378],[.11,-.507],[0,-.626],[-.11,-.507],[-.236,-.378],[-.341,-.107]];
      const shieldSkin=(scale:number,depth:number,material:T.Material,z:number)=>{
        const geometry=plate(silhouette.map(([x,y])=>[x*scale,y*scale]),depth,.018);
        const pos=geometry.attributes.position;
        for(let i=0;i<pos.count;i++) pos.setZ(i,pos.getZ(i)+.054*(1-(pos.getX(i)/.40)**2)-.014*Math.abs(pos.getY(i)));
        geometry.computeVertexNormals();
        add(geometry,material,0,0,z,left);
      };
      shieldSkin(1,.091,steel,0);shieldSkin(.94,.051,trim,.038);shieldSkin(.83,.044,core,.075);
      studs(silhouette.filter((_,i)=>i%2===0).map(([x,y])=>[x*.9,y*.9]),.111,.026,left);
      add(new T.SphereGeometry(.15,12,7).scale(1,.86,.45),trim,0,.025,.146,left);
      add(gemstone(.099,.241),crystal,0,.022,.197,left);
      const scrolls:Rune[][]=[];
      for(const side of [-1,1]) for(let i=0;i<3;i++){
        scrolls.push(Array.from({length:19},(_,j)=>{
          const t=j/18,a=t*4.6+i*.41,y=.234-t*.49;
          return [side*(.11+Math.sin(a)*.066+i*.054)*(1-t*.68),y,.161-(i*.002)];
        }));
      }
      add(ribbon(scrolls,.008),engraving,0,0,0,left);
      runeMarks(silhouette.filter((_,i)=>i%2===0).map(([x,y])=>[x*.72,y*.76,.150]),.052,1,left);
      for(const y of [-.20,.14]) add(new T.TorusGeometry(.09,.025,5,12).rotateY(Math.PI/2),grip,0,y,-.095,left);
      const flowing=new T.Mesh(ribbon(scrolls,.020),edges);
      flowing.position.z=.006;left.add(flowing);activeEdges=flowing;
    }
  }else if(id==='axe'){
    const slate=relic==='slatebreaker',blood=relic==='bloodfang';
    shaft(-.41,1.20,.061,true);bound(-.35,.48,.065);pommel(-.45,.092);
    for(const y of [.53,.72,.86,1.13,1.21]){
      add(new T.CylinderGeometry(.093,.081,.086,10),core,0,y);
      ring(.094,.011,y+.023);
    }
    for(const side of [-1,1]){
      const w=slate?.81:blood?.77:.72;
      fit([[0,.80],[side*.19,.71],[side*.39,.67],[side*w*.86,.53],[side*w,.71],
        [side*w*.96,.88],[side*w*.99,1.04],[side*w*.87,1.26],[side*w*.64,1.39],
        [side*.28,1.18],[side*.06,1.12]],.095,.024,steel);
      fit([[side*.053,.82],[side*.29,.75],[side*w*.75,.635],[side*w*.86,.78],[side*w*(blood?.73:.82),.965],
        [side*w*.75,1.18],[side*w*.60,1.30],[side*.22,1.11],[side*.052,1.08]],.13,.018,core);
      fit([[side*.11,.89],[side*.39,.82],[side*w*.77,.71],[side*.40,.93],
        [side*w*.65,1.23],[side*.35,1.07],[side*.11,1.01]],.024,.012,trim,right,.074);
      for(const z of [-1,1]){
        runeMarks([[side*.37,.93,z*.105],[side*.46,.98,z*.089],[side*.50,1.07,z*.074]],.087,side>0?1:3);
        if(blood||slate) fit([[side*.34,1.16],[side*w*.76,1.31],[side*.47,1.05]],.014,.008,trim,right,z*.068);
      }
    }
    add(gemstone(.118,.231),crystal,0,.991,.091);add(gemstone(.118,.231),crystal,0,.991,-.091);
    const fork:Rune[]=[[-.63,.91,.13],[-.46,.98,.14],[-.30,.89,.15],[-.17,1.04,.17],
      [.04,.94,.172],[.18,1.07,.16],[.36,.98,.14],[.49,1.10,.12],[.62,1.05,.13]];
    activeEdges=new T.Mesh(ribbon([fork,[fork[4],[.12,.83,.14],[.38,.79,.13],[.57,.71,.12]]],.022),edges);
    right.add(activeEdges);
  }else if(id==='staff'){
    const arcane=relic==='arcaneDominion',frost=relic==='frostbound';
    shaft(-.67,1.28,.055);bound(-.32,.32,.067);pommel(-.70,.087);
    for(const y of [-.56,.43,.74,.99,1.14]){
      add(new T.CylinderGeometry(.083,.077,.097,9),core,0,y);
      for(const d of [-.037,.037]) ring(.080,.008,y+d);
    }
    for(let i=0;i<5;i++){
      const a=i*2*Math.PI/5,reach=frost?.29:arcane?.34:.24;
      const mount=plate([[.038,.94],[.114,1.00],[reach*.89,1.14],[reach,1.49],[reach*.81,1.62],
        [reach*.58,1.40],[reach*.52,1.20],[.069,1.12]],.077,.017).rotateY(a);
      add(mount,i%2?trim:core);
      add(gemstone(.066,.24+i%2*.06),crystal,Math.cos(a)*reach,1.39+i%2*.09,-Math.sin(a)*reach,right,-Math.cos(a)*.29);
    }
    add(gemstone(arcane?.172:.163,frost?.77:.69,7).rotateY(.35),crystal,0,1.54);
    add(gemstone(.084,.30),crystal,0,1.15);
    runeMarks([[0,.51,.070],[0,.63,.064],[0,.81,.063],[0,.93,.061]],.081,2);
    focus=1.60;
  }else if(id==='katana'){
    const scale=relic==='dragonheart',reed=relic==='venomReed';
    bound(-.25,.195,.048,true);pommel(-.272,.058);
    add(new T.CylinderGeometry(.128,.128,.032,scale?8:20).scale(1,1,.78),core,0,.23);
    add(new T.TorusGeometry(.119,.009,6,22).rotateX(Math.PI/2).scale(1,1,.79),trim,0,.247);
    add(new T.CylinderGeometry(.061,.055,.083,8),trim,0,.278);
    const stations:Station[]=Array.from({length:13},(_,i)=>{
      const t=i/12,c=(reed?.33:.25)*t**2.28;
      return [.31+t*(reed?1.32:1.23),c,.065*(1-t*.27)*(i===12?.018:i===11?.68:1),.027*(1-t*.51)*(i===12?.07:1)];
    });
    cuts(stations,.37);
    for(const s of [-1,1]) {
      const line:Rune[]=stations.map(([y,x,w,r],i)=>[x+w*(.33+.13*Math.sin(i*1.75)),y,s*(r*.67+.005)]);
      add(ribbon([line],.0045),engraving);
      runeMarks(stations.slice(1,10).filter((_,i)=>i%2===0).map(([y,x,,r])=>[x-.012,y,s*(r+.004)]),.047,reed?3:scale?4:1);
    }
    const current:Rune[]=stations.map(([y,x,w],i)=>[x+w+.026+.048*Math.sin(i*.33),y,.047]);
    activeEdges=new T.Mesh(ribbon([current],.035),edges);
    right.add(activeEdges);
    if(scale) for(let i=0;i<6;i++){
      const y=.32+i*.095,x=stations[i][1];
      fit([[x-.055,y],[x-.104,y+.05],[x-.051,y+.079],[x-.016,y+.054]],.012,.007,trim,right,.021);
    }
  }else{
    shaft(-1.12,1.68,.068,true);bound(-.46,.38,.079);pommel(-1.17,.106);
    for(const y of [-1.02,-.78,-.55,.50,.84,1.20,1.46,1.61,1.73]){
      add(new T.CylinderGeometry(.089,.082,.075,10),core,0,y);
      ring(.09,.011,y+.025);
    }
    const scythe:Point[]=[[-.16,1.47],[.17,1.72],[.57,1.86],[1.02,1.92],[1.46,1.81],[1.82,1.57],
      [2.13,1.16],[2.29,.63],[2.06,.82],[1.74,1.07],[1.40,1.23],[1.15,1.31],
      [1.06,1.15],[.86,1.36],[.63,1.38],[.49,1.26],[.30,1.50],[-.10,1.31]];
    fit(scythe,.090,.022,steel);
    fit([[-.16,1.48],[.20,1.71],[.60,1.83],[1.01,1.88],[1.47,1.77],[1.81,1.53],[2.11,1.13],
      [2.24,.75],[1.94,.96],[1.69,1.18],[1.36,1.34],[1.11,1.41],[.68,1.47],[.29,1.57],[-.11,1.38]],.121,.019,core);
    for(const side of [-1,1]){
      const vein:Rune[]=[[.05,1.53,side*.095],[.39,1.64,side*.083],[.62,1.57,side*.081],[.86,1.72,side*.084],
        [1.16,1.60,side*.087],[1.44,1.58,side*.083],[1.68,1.38,side*.084],[1.91,1.19,side*.080],[2.14,.89,side*.072]];
      add(ribbon([vein],.012),engraving);
      runeMarks(vein.slice(1,-1).map(([x,y,z])=>[x,y+.105,z]),.112,2);
    }
    fit([[-.10,1.29],[-.23,1.43],[-.17,1.78],[.04,1.91],[.17,1.81],[.10,1.55],[.19,1.42]],.16,.022,trim);
    add(gemstone(.101,.31,6),crystal,.036,1.55,.13);
    const spectral:Rune[]=[[.15,1.36,.095],[.46,1.28,.10],[.76,1.36,.11],[1.05,1.23,.11],
      [1.35,1.25,.11],[1.65,1.073,.10],[1.93,.92,.088],[2.30,.62,.074]];
    activeEdges=new T.Mesh(ribbon([spectral],.055),edges);
    right.add(activeEdges);
  }
  const adornment=id==='staff'?[.214,1.51]:id==='axe'?[.165,.989]:
    id==='scythe'?[.173,1.66]:id==='shield'?[.133,.213]:id==='katana'?[.110,.233]:[.14,.211];
  for(const side of [-1,1]){
    const [w,y]=adornment;
    fit([[side*w*.63,y-.030],[side*w*1.19,y-.013],[side*w*1.43,y+.082],
      [side*w*.91,y+.046],[side*w*.53,y+.024]],.034,.009,trim,rankDetails,.061);
  }
  for(const [parent,patterns] of rigid) for(const [material,parts] of patterns){
    const colored=material===crystal&&parts.every(p=>p.hasAttribute('color'));
    const compatible=parts.map(source=>{
      const geometry=source.index?source.toNonIndexed():source;
      if(!colored) geometry.deleteAttribute('color');
      return geometry;
    });
    const geometry=mergeGeometries(compatible)!;
    new Set([...parts,...compatible]).forEach(source=>source.dispose());
    const mesh=new T.Mesh(geometry,material);
    mesh.castShadow=material!==engraving;parent.add(mesh);
  }
  const floats=id==='longsword'?null:new T.InstancedMesh(gemstone(.040,.135),crystal,8);
  if(floats){floats.frustumCulled=false;floats.instanceMatrix.setUsage(T.DynamicDrawUsage);right.add(floats);}
  const wisps=id==='staff'||id==='scythe'||id==='greatsword'?new T.InstancedMesh(
    new T.PlaneGeometry(.34,.34),new T.ShaderMaterial({
      uniforms:{clock,energyColor,shade:{value:id==='staff'?.31:id==='scythe'?.78:.55}}, transparent:true,depthWrite:false,
      side:T.DoubleSide,forceSinglePass:true,vertexShader:`varying vec2 field;void main(){
        field=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);
      }`,
      fragmentShader:surfaceNoise+`uniform float clock,shade; uniform vec3 energyColor; varying vec2 field;
        void main(){
          float f=pow(max(0.,1.-length(field)),1.65)*grain(field*3.6+vec2(clock*.39,-clock*.63));
          gl_FragColor=vec4(mix(energyColor,vec3(.026,.018,.042),shade),f*.48);
          #include <colorspace_fragment>
        }`,
    }),5):null;
  if(wisps){wisps.frustumCulled=false;wisps.instanceMatrix.setUsage(T.DynamicDrawUsage);right.add(wisps);}
  const stamp=new T.Object3D();
  const baseTrim=new T.Color(fittings), tierColor=new T.Color();
  let previousTier:Rarity|undefined;
  function update(time:number,tier:Rarity){
    const level=tierOrder.indexOf(tier);
    clock.value=time;
    rank.value=level/5;
    if(previousTier!==tier){
      previousTier=tier;tierColor.set(rarity[tier].color);
      trim.color.copy(baseTrim).lerp(tierColor,level>=4?.31:level>=1?.14:0);
      energyColor.value.setHex(element).lerp(tierColor,.12*rank.value);
      rankDetails.visible=level>=4;
      engraving.visible=level>=2||Boolean(relic);
    }
    crystal.emissiveIntensity=.04+rank.value*(.65+.23*Math.sin(time*4.3));
    if(activeEdges) activeEdges.visible=level>=(id==='axe'||id==='shield'?1:3);
    if(floats){
      floats.count=level<2?0:Math.min(8,(id==='staff'||id==='scythe'?3:0)+level-2);
      for(let i=0;i<floats.count;i++){
        const f=(time*(id==='greatsword'?1.28:.55)+i*.227)%1,a=time*(i%2?-1.8:2.2)+i*2.399;
        const radius=(id==='staff'?.282:.18)+i*.021;
        stamp.position.set(id==='scythe'?.19+2.05*f:Math.cos(a)*radius,
          id==='scythe'?1.43-.70*f**3:focus+(f-.50)*(id==='staff'?.47:1.06),Math.sin(a)*radius);
        stamp.rotation.set(a,f*4,a*.58);
        const size=Math.sin(f*Math.PI)*(.41+i%3*.21);
        stamp.scale.set(size,size*(id==='greatsword'?.76:1.38),size);
        stamp.updateMatrix();floats.setMatrixAt(i,stamp.matrix);
      }
      if(floats.count) floats.instanceMatrix.needsUpdate=true;
    }
    if(wisps){
      wisps.count=level<3?0:5;
      for(let i=0;i<wisps.count;i++){
        const p=(time*.68+i*.21)%1,a=i*2.39+time*.85;
        stamp.position.set(id==='scythe'?.24+i*.37+Math.cos(a)*.09:Math.cos(a)*.21,
          (id==='scythe'?1.29-i*.056:focus-.35)+p*.53,Math.sin(a)*.19);
        stamp.rotation.set(a*.23,a,p*2);
        stamp.scale.setScalar(.38+Math.sin(p*Math.PI)*.82);
        stamp.updateMatrix();wisps.setMatrixAt(i,stamp.matrix);
      }
      if(wisps.count) wisps.instanceMatrix.needsUpdate=true;
    }
  }
  update(0,'Common');
  return {right,left,update,dispose(){
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>([steel,core,trim,grip,wrap,crystal,engraving,edges]);
    for(const group of [right,left]){
      group.removeFromParent();
      group.traverse(node=>{
        if(node instanceof T.InstancedMesh) node.dispose();
        if(node instanceof T.Mesh){geometries.add(node.geometry);materials.add(node.material);}
      });
    }
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
  }};
}
