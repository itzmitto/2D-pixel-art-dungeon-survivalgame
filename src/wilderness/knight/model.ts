import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Ring = readonly [y: number, halfWidth: number, front: number, back: number, centerZ?: number];

// Profile rings run from sole or lower hem to crown. Front and back depths differ
// so the breastplate, visor, sabatons and blade each have their own silhouette.
function shell(rings: readonly Ring[], sides = 10) {
  const vertices: number[] = [], indices: number[] = [];
  for (const [y, width, front, back, center = 0] of rings) {
    for (let i = 0; i < sides; i++) {
      const a = i * Math.PI * 2 / sides;
      const c = Math.cos(a);
      vertices.push(Math.sin(a) * width, y, center + c * (c >= 0 ? front : back));
    }
  }
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < sides; i++) {
      const a = j * sides + i, b = j * sides + (i + 1) % sides;
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  }
  const top = (rings.length - 1) * sides;
  for (let i = 1; i < sides - 1; i++) indices.push(0, i + 1, i, top, top + i, top + i + 1);
  const indexed = new T.BufferGeometry();
  indexed.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  indexed.setIndex(indices);
  const geometry = indexed.toNonIndexed();
  indexed.dispose();
  geometry.computeVertexNormals();
  return geometry;
}

export function createKnightModel() {
  const root = new T.Group();
  root.name = 'Dark Knight';
  const rig = new T.Group();
  rig.scale.setScalar(1.18);
  root.add(rig);
  const materials = [
    new T.MeshStandardMaterial({ color: '#30343A', metalness: .47, roughness: .57 }),
    new T.MeshStandardMaterial({ color: '#656C73', metalness: .42, roughness: .48 }),
    new T.MeshStandardMaterial({ color: '#30251F', roughness: .92 }),
    new T.MeshStandardMaterial({ color: '#A8ADB3', metalness: .48, roughness: .42 }),
    new T.MeshStandardMaterial({ color: '#101317', roughness: .98 }),
  ];
  const [steel, edge, leather, blade, shadow] = materials;
  const parts = new Map<T.Group, Map<T.Material, T.BufferGeometry[]>>();
  const joint = (parent: T.Group, name: string, x = 0, y = 0, z = 0) => {
    const group = new T.Group();
    group.name = name;
    group.position.set(x, y, z);
    parent.add(group);
    return group;
  };
  const plate = (parent: T.Group, mat: T.Material, rings: readonly Ring[], sides = 10,
    x = 0, y = 0, z = 0, tilt = 0) => {
    const mesh = shell(rings, sides).rotateZ(tilt).translate(x, y, z);
    let group = parts.get(parent);
    if (!group) parts.set(parent, group = new Map());
    const batch = group.get(mat);
    if (batch) batch.push(mesh);
    else group.set(mat, [mesh]);
  };

  const hips = joint(rig, 'Hips', 0, 1.02);
  const torso = joint(hips, 'Torso', 0, .09);
  plate(torso, steel, [[-.04,.24,.144,.13],[.05,.25,.174,.15],[.26,.33,.226,.182],[.44,.37,.19,.17],[.51,.235,.133,.13]]);
  // Raised central keel and two beveled chest flanges catch the moonlight.
  plate(torso, edge, [[.025,.014,.018,.006,.174],[.23,.035,.034,.01,.213],[.41,.05,.021,.008,.183],[.47,.018,.007,.006,.154]], 6);
  for (const side of [-1,1]) {
    plate(torso, edge, [[.25,.018,.018,.013],[.38,.035,.028,.02],[.46,.016,.013,.01]], 6, side*.173,0,.17,-side*.42);
  }
  plate(torso, edge, [[.464,.173,.12,.109],[.51,.177,.13,.123],[.56,.135,.104,.106]]);
  plate(hips, steel, [[-.185,.282,.171,.16],[-.135,.31,.179,.177],[-.025,.277,.164,.15],[.11,.249,.147,.137]]);
  plate(hips, leather, [[-.025,.284,.174,.169],[.017,.291,.186,.178],[.069,.274,.176,.165]]);
  plate(hips, edge, [[-.012,.041,.018,.01],[.002,.061,.027,.018],[.063,.061,.027,.018],[.077,.04,.018,.01]], 8,0,0,.174);
  for (const side of [-1,1]) {
    plate(hips, steel, [[-.26,.096,.054,.043],[-.207,.124,.067,.047],[-.078,.125,.071,.038],[-.052,.094,.043,.025]], 8,side*.161,0,.141,side*.20);
    plate(hips, edge, [[-.205,.10,.016,.009],[-.176,.125,.026,.01],[-.151,.11,.017,.01]], 8,side*.163,0,.192,side*.2);
  }
  const head = joint(torso,'Helmet',0,.545,.013);
  plate(head, steel, [[-.012,.139,.153,.119],[.051,.181,.201,.146],[.166,.19,.2,.15],[.244,.176,.164,.154],[.323,.116,.114,.111],[.354,.039,.041,.04]],12);
  plate(head, shadow, [[.147,.148,.008,.009],[.157,.155,.019,.008],[.184,.151,.019,.008],[.19,.139,.008,.008]],8,0,0,.202);
  plate(head, edge, [[.185,.147,.028,.011],[.214,.157,.039,.027],[.25,.126,.02,.015]], 10,0,0,.172);
  plate(head, steel, [[.022,.119,.022,.018],[.081,.158,.039,.032],[.144,.146,.035,.024]],10,0,0,.146);
  plate(head, edge, [[.04,.021,.022,.013],[.105,.028,.044,.017],[.146,.017,.03,.013]], 6,0,0,.174);
  for (const side of [-1,1]) for (let i = 0; i < 3; i++) {
    plate(head,shadow,[[.068,.008,.006,.006],[.076,.011,.011,.007],[.092,.008,.006,.006]],6,side*(.054+.028*i),0,.177-.012*i);
  }

  const arms = ([-1,1] as const).map(side => {
    const shoulder = joint(torso, side < 0 ? 'Left shoulder' : 'Right shoulder', side*.345,.402,0);
    const upper = joint(shoulder, 'Upper arm', side*.083,-.04);
    const fore = joint(upper,'Forearm',0,-.314);
    const hand = joint(fore,'Gauntlet',0,-.275);
    plate(shoulder, steel, [[-.147,.114,.134,.117],[-.065,.207,.174,.152],[.055,.19,.161,.14],[.123,.125,.108,.09],[.145,.064,.058,.054]],10,side*.063,0,0,-side*.22);
    for(let i=0;i<2;i++) {
      plate(upper,edge,[[-.113,.104,.101,.104],[-.086,.143,.125,.121],[-.056,.135,.116,.11]],10,side*.021,-i*.065,0,-side*.16);
    }
    plate(upper,steel,[[-.306,.073,.077,.076],[-.25,.102,.103,.097],[-.122,.111,.095,.094],[-.064,.087,.082,.082]]);
    plate(fore,steel,[[-.273,.059,.071,.061],[-.242,.083,.093,.075],[-.095,.107,.112,.098],[-.029,.105,.106,.095],[.025,.08,.082,.071]]);
    plate(fore,edge,[[-.25,.039,.017,.015],[-.18,.06,.026,.014],[-.046,.05,.035,.014],[.009,.021,.013,.013]],8,0,0,.079);
    plate(hand,steel,[[-.12,.044,.047,.041],[-.093,.068,.062,.053],[-.026,.072,.07,.059],[.018,.055,.052,.051]],8);
    plate(hand,edge,[[-.093,.046,.022,.016],[-.075,.062,.026,.017],[-.051,.053,.02,.016]],8,0,0,.046);
    const socket = joint(hand, side < 0 ? 'Shield socket' : 'Weapon socket',0,-.064,.01);
    return { shoulder, upper, fore, hand, socket };
  });
  const legs = ([-1,1] as const).map(side => {
    const upper = joint(hips, side < 0 ? 'Left thigh' : 'Right thigh',side*.143,-.013);
    const lower = joint(upper,'Shin',0,-.453);
    const foot = joint(lower,'Boot',0,-.434);
    plate(upper,steel,[[-.445,.088,.089,.08],[-.36,.105,.111,.095],[-.15,.12,.125,.107],[-.073,.109,.1,.102],[.005,.087,.078,.084]]);
    plate(lower,steel,[[-.421,.059,.068,.068],[-.34,.074,.086,.082],[-.15,.093,.108,.105],[-.061,.089,.097,.086],[.018,.073,.074,.065]]);
    plate(lower,edge,[[-.097,.051,.037,.025],[-.055,.093,.077,.036],[.017,.101,.077,.038],[.069,.056,.042,.026]],10,0,0,.06);
    plate(lower,edge,[[-.4,.028,.013,.01],[-.29,.043,.028,.016],[-.12,.038,.031,.016]],8,0,0,.079);
    plate(foot, leather,[[-.12,.082,.213,.095],[-.091,.103,.237,.11],[-.064,.102,.22,.103]],10);
    plate(foot,steel,[[-.082,.099,.219,.102],[-.035,.099,.21,.096],[.022,.079,.139,.089],[.08,.065,.071,.075]],10);
    plate(foot,edge,[[-.079,.083,.218,.046],[-.054,.094,.231,.049],[-.023,.082,.189,.038]],10);
    return { upper, lower, foot };
  });

  const sword = arms[1].socket;
  plate(sword,blade,[[.219,.061,.018,.018],[.25,.072,.022,.022],[.83,.059,.017,.017],[1.149,.035,.011,.011],[1.313,.001,.001,.001]],4);
  plate(sword,edge,[[.23,.015,.006,.004],[.27,.027,.013,.006],[.86,.016,.009,.005],[1.04,.006,.004,.004]],4,0,0,.013);
  plate(sword,leather,[[-.161,.039,.031,.031],[-.129,.039,.033,.033],[.134,.035,.029,.029],[.18,.041,.035,.035]],8);
  for (const y of [-.125,-.066,-.009,.05,.108]) {
    plate(sword,edge,[[y,.036,.031,.031],[y+.009,.04,.034,.034]],8);
  }
  plate(sword,steel,[[-.254,.022,.026,.026],[-.225,.058,.041,.041],[-.181,.054,.041,.041],[-.158,.035,.032,.032]],8);
  for(const side of [-1,1]) {
    plate(sword,edge,[[-.224,.02,.026,.026],[-.18,.033,.036,.036],[-.055,.037,.043,.043],[.03,.051,.045,.045]],8,0,.184,0,side*(Math.PI/2-.19));
  }

  // Bake rigid details per joint/material. Articulation remains in the scene tree.
  for (const [parent, group] of parts) for (const [material, geometries] of group) {
    const geometry = mergeGeometries(geometries);
    for (const source of geometries) source.dispose();
    if (!geometry) throw new Error('Incompatible knight geometry');
    const mesh = new T.Mesh(geometry,material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  const capeGeometry = new T.PlaneGeometry(1,1,10,12);
  const cape = new T.Mesh(capeGeometry,new T.MeshStandardMaterial({
    color:'#591F28', roughness:.91, side:T.DoubleSide, vertexColors:true,
  }));
  const capeColors = [];
  const tint = new T.Color();
  for(let row=0;row<=12;row++) for(let col=0;col<=10;col++) {
    tint.setRGB(1,.97,.96).multiplyScalar(.66+.30*Math.sin(col*.91)**2 + (col === 0 || col === 10 ? .13 : 0));
    capeColors.push(tint.r,tint.g,tint.b);
  }
  capeGeometry.setAttribute('color',new T.Float32BufferAttribute(capeColors,3));
  capeGeometry.boundingSphere = new T.Sphere(new T.Vector3(0,-.3,-.5),1.45);
  capeGeometry.attributes.position.setUsage(T.DynamicDrawUsage);
  cape.castShadow = true;
  cape.receiveShadow = true;
  cape.name = 'Burgundy cape';
  torso.add(cape);
  return { root, hips, torso, head, arms, legs, cape };
}
