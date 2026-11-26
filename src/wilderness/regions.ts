import { frontierAt } from './frontier.ts';
import { inAurelia } from './aurelia.ts';
import { caveAt } from './bossCaves.ts';
import { briarWatch, towerFloorAt } from './briarWatch.ts';
import { inDen } from './denLayout.ts';
export const regions=[
  {id:'velren',name:'Velren Forest',difficulty:'Levels 1–15',state:'Playable',detail:'Blackwater Wilds · Ember Clearing, the crossings, Hollow Fang Den and Briar Watch.'},
  {id:'aurelia',name:'Aurelia',difficulty:'Safe capital',state:'Playable',detail:'Golden Tree, merchant, blacksmith and Hunter Guild.'},
  {id:'elaris',name:'Elaris Highlands',difficulty:'Levels 15–30',state:'Playable',detail:'Moonfall Cascade, Frostpine Road and the Forsaken Fortress.'},
  {id:'mournshade',name:'Mournshade Marshes',difficulty:'Levels 30–50',state:'Planned',detail:'Marshlands beyond the surveyed forest.'},
  {id:'sunken',name:'Sunken Bastion',difficulty:'Levels 50–75',state:'Planned',detail:'A future coastal stronghold.'},
  {id:'crimson',name:'Crimson Wastes',difficulty:'Levels 75–100',state:'Planned',detail:'A future frontier of scorched valleys.'},
  {id:'stormveil',name:'Stormveil Heights',difficulty:'Levels 100–150',state:'Planned',detail:'A future mountain route.'},
  {id:'shadowspire',name:'Shadowspire Monolith',difficulty:'Levels 150–200+',state:'Planned',detail:'A future endgame region.'},
] as const;
export type RegionId=typeof regions[number]['id'];
export const regionLabel=(z:number,x=Infinity)=>inAurelia(x,z)?'Aurelia':frontierAt(z)?.name??caveAt(z)?.name??(towerFloorAt(z)?briarWatch.name:inDen(z)?'Hollow Fang Den':'Velren Forest');
