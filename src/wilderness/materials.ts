export const enhancementMaterials=['Iron Ore','Refined Steel','Magic Crystal','Enhancement Stone',
  'Greater Enhancement Stone','Legendary Core','Mythic Core','Dragon Scale'] as const;
export type EnhancementMaterial=typeof enhancementMaterials[number];
export const enhancementTuning={max:20,weaponDamage:.05,armorDefense:.03,elemental:.02} as const;
export function enhancementLevel(value:unknown){
  return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=enhancementTuning.max?value:0;
}
export const enhancedName=(name:string,level:number)=>level?name+' +'+level:name;
export function enhancementCost(level:number,armor=false){
  const next=level+1, materials:Partial<Record<EnhancementMaterial,number>>={};
  if(next<=4) materials['Iron Ore']=2+next;
  else if(next<=9){materials['Refined Steel']=1+Math.floor((next-5)/2);materials['Enhancement Stone']=1+Math.floor((next-5)/3);}
  else if(next<=14){materials['Magic Crystal']=2+next-10;materials['Greater Enhancement Stone']=1+Math.floor((next-10)/2);}
  else if(next<=19){materials['Greater Enhancement Stone']=3+next-15;materials['Legendary Core']=1+Math.floor((next-15)/2);}
  else {materials['Mythic Core']=1;materials['Legendary Core']=2;materials['Dragon Scale']=2;}
  return {gold:(armor?9:12)+next*7+next*next*2,materials};
}
