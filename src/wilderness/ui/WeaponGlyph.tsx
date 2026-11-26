import { bossRelics, type RelicId } from '../itemInstances';
import { weaponFinish } from '../weaponAppearance';
import { isWeaponId } from '../weapons';

const gem='M0-5 3-1 2 4 0 6-2 4-3-1Z';
const sword='M-4 4-5-12-4-23 0-30 4-23 5-12 4 4Z';
const great='M-4 5-6 2-7-7-6-21-5-25 0-32 5-25 6-21 7-7 6 2 4 5Z';
const katana='M-3 5q3-24 13-34l2-2-1 8Q4-11 2 5Z';
const fang='M-5 4q0-16 8-24l7-9q1 10-4 19l-4 14Z';
const shield='M13 29q6 3 12-2 7 4 13 1l-1 10q-2 11-11 17l-2 4-3-4q-9-6-10-16l-1-10Z';
const axeHead='M0-14Q-8-15-17-10l-3-6-1-8 3-7 5-4q2 7 13 8 11-1 13-8l5 4 3 7-1 8-3 6Q8-15 0-14Z';
const scythe='M0-22q10-15 26-13 12 1 17 14-8-7-17-7l-4 3-3-2-4 4-3-2-6 6Z';
const wrap='M-2 10 2 12m-4 1 4 2m-4 1 4 2m-4 1 4 2m-4 1 4 2';

export function WeaponGlyph({kind,id}:{kind:string;id:string}){
  const relic=Object.hasOwn(bossRelics,kind)?kind as RelicId:undefined;
  const weapon=relic?bossRelics[relic].type:kind;
  if(!isWeaponId(weapon)) return null;
  const [steel,body,trim,energy]=weaponFinish(weapon,relic).map(n=>'#'+n.toString(16).padStart(6,'0'));
  const metal='url(#'+id+'-metal)', dark='url(#'+id+'-dark)', light='url(#'+id+'-light)';
  const edged=weapon==='greatsword'?great:weapon==='katana'?katana:relic==='fangblade'?fang:sword;
  const staff=weapon==='staff', scytheWeapon=weapon==='scythe', axe=weapon==='axe';
  return <svg className="item-glyph" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id={id+'-metal'} x2="1" y2=".22">
        <stop stopColor="#3b3547"/><stop offset=".22" stopColor={steel}/><stop offset=".43" stopColor="#f2eee0"/>
        <stop offset=".63" stopColor={steel}/><stop offset="1" stopColor="#34364a"/>
      </linearGradient>
      <linearGradient id={id+'-dark'} x2=".85" y2=".72">
        <stop stopColor={body}/><stop offset=".60" stopColor="#222134"/><stop offset=".86" stopColor={body}/><stop offset="1" stopColor="#151322"/>
      </linearGradient>
      <radialGradient id={id+'-light'} cx=".35" cy=".24" r=".79">
        <stop stopColor="#f7fcff"/><stop offset=".34" stopColor={energy}/><stop offset="1" stopColor={body}/>
      </radialGradient>
    </defs>
    <g transform={scytheWeapon?'translate(20 36) rotate(29) scale(.86)':axe?'translate(30 35) rotate(29) scale(.92)':
      weapon==='shield'?'translate(27 28) rotate(28) scale(.78)':'translate(33 32) rotate(38) scale(.95)'} strokeLinejoin="round">
      <path d={staff||axe||scytheWeapon?'M-2.8-22H2.8L2.2 29 0 33-3 29Z':'M-3 5H3L2.6 23 5 26 3 30-3 30-5 26-2.6 23Z'} fill={dark} stroke="#141522" strokeWidth="1.9"/>
      <path d={staff||axe||scytheWeapon?'M0-21-1.1 29m-2 0h6M-2-8h4m-4 5h4m-4 6h4':wrap} fill="none" stroke={trim} strokeWidth="1.05"/>
      <path d="M-3 10h6m-6 14h6" fill="none" stroke={metal} strokeWidth="1.55"/>
      {staff?<g>
        <path d="M-2-15-7-20-10-29-8-32-6-25-2-23 0-20 2-23 6-25 8-32 10-29 7-20 2-15Z" fill={metal} stroke={body} strokeWidth="1.5"/>
        <path d={gem} transform={relic==='arcaneDominion'?'translate(0 -29) rotate(36) scale(2.4)':'translate(0 -28) scale(2 2.55)'} fill={light} stroke={steel} strokeWidth=".42"/>
        <path d="M0-41 1-27 0-17-2-28Z" fill={steel} opacity=".43"/>
        <path d={gem} transform="translate(-10 -35) rotate(-20) scale(.75)" fill={light}/>
        <path d={gem} transform="translate(10 -32) rotate(26) scale(.60)" fill={light}/>
        <path d="m-2-13 4 3-4 3 4 4-2 4" fill="none" stroke={energy} strokeWidth=".88"/>
      </g>:axe?<g>
        <path d={axeHead} fill={metal} stroke="#1c1b2a" strokeWidth="1.7"/>
        <path d="M0-16Q-10-17-16-13l-3-10 3-8q6 7 16 7 10 0 16-7l3 8-3 10Q10-17 0-16Z" fill={dark} stroke={trim} strokeWidth=".88"/>
        <path d={gem} transform="translate(0 -21) scale(1.68)" fill={light} stroke={trim} strokeWidth=".61"/>
        <path d="M-15-25l3 5 3-3 3 5m12-4 3 3 2-6 3 3" fill="none" stroke={energy} strokeWidth="1.16"/>
        {relic&&<path d="m-17-13 4-5 2 5m22-1 2-4 3 5" fill="none" stroke={steel} strokeWidth="1.5"/>}
      </g>:scytheWeapon?<g>
        <path d={scythe} fill={metal} stroke="#21162b" strokeWidth="1.7"/>
        <path d="M1-23q9-13 25-10 10 1 15 10-13-9-28-5L6-22Z" fill={dark}/>
        <path d="m5-25 5-3 4 .5 3-2 4 1 5-2 5 2 4 1" fill="none" stroke={energy} strokeWidth="1.15"/>
        <path d="m16-18 4-4 4 2-3 4Zm12 0 4-4 4 3-3 2Z" fill={light} opacity=".72"/>
        <path d={gem} transform="translate(0 -22) scale(1.33)" fill={light} stroke={trim} strokeWidth=".8"/>
      </g>:<g>
        <path d={edged} fill={metal} stroke="#242032" strokeWidth="1.3"/>
        <path d={weapon==='katana'?'M-2 4q4-22 13-33Q4-12 0 4Z':
          relic==='fangblade'?'M-3 4q0-12 10-27L2-9 0 4Z':'M-2 5-3-12 0-27 3-12 2 5Z'} fill={dark}/>
        <path d={weapon==='katana'?'M0 2q4-20 10-29':weapon==='greatsword'?'M0 0 2-5-1-8 1-13-1-17 1-23 0-27':
          relic==='fangblade'?'M-1 3 0-7 3-16 7-23':'M0 2v-23'} fill="none" stroke={energy} strokeWidth={weapon==='longsword'?'.68':'1.15'}/>
        {relic&&<path d="M-3-7 0-10 3-7 0-4Z M-2-15 0-18 2-15 0-13Z" fill="none" stroke={energy} strokeWidth=".9"/>}
        <path d={weapon==='katana'?'M-9 5q1-4 9-4t9 4q-1 4-9 4t-9-4Z':
          'M-13 2-9 3-6 5H6l3-2 4-1-1 5-4 1-3 2H-5l-3-2-4-1Z'} fill={dark} stroke={trim} strokeWidth="1.55"/>
        <path d={gem} transform="translate(0 6) scale(.65)" fill={light} stroke={trim} strokeWidth=".5"/>
      </g>}
    </g>
    {weapon==='shield'&&<g transform="translate(21 -2)" strokeLinejoin="round">
      <path d={shield} fill={metal} stroke="#1b2030" strokeWidth="1.8"/>
      <path d="M13 31q5 3 12-2 5 3 11 1l-1 8q-2 10-11 17-9-7-10-16Z" fill={dark} stroke={trim} strokeWidth="1"/>
      <path d="M16 39q4-5 8-1t8-1m-14 7q3-3 6-1t6 0m-8 6 2 3 2-3" fill="none" stroke={energy} strokeWidth="1.16"/>
      <path d={gem} fill={light} transform="translate(24 40) scale(.66)"/>
    </g>}
  </svg>;
}
