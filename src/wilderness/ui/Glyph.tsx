import { armorPiece, isArmorId, type ArmorSlot } from '../armor';
import { useId } from 'react';

type Art={color:string; silhouette:string; shade:string; detail:string};
const art:Record<string,Art>={
  'Mountain Crystal':{color:'#86d9ff',silhouette:'M8 49 16 24l10 12 3-21L42 4l9 16-6 20 11-5-2 14-18 10Z',shade:'M29 15 42 4l-5 24-12 28-9-10 12-9ZM42 33l9-13-5 25-10 13Z',detail:'m31 17 7 9 9-6M16 27l6 18m15-18-9 25'},
  'Ancient Stone':{color:'#95a0b9',silhouette:'M7 38 15 19l18-8 20 7 5 20-13 16-23 2Z',shade:'m7 38 15-8 23 2 13 6-13 16-23 2Z',detail:'m20 24 8-4 5 5 8-8m-8 8-7 10 10 8 12-4m-12 4-5 9'},
  'Troll Fang':{color:'#d8d3a2',silhouette:'M12 18 23 8l18 2 9 12-7 15Q28 55 10 59l-3-6q18-14 18-25Z',shade:'m12 18 12-9 17 2 7 10-13 5-12-1Zm23 10q-4 15-24 28 22-6 31-24Z',detail:'m18 17 8 3 7-4 9 3m-10 13-7 12'},
  'Cursed Steel':{color:'#af9be9',silhouette:'M8 43 15 23l17 3 9-17 14 8 2 17-12 19-29 3Z',shade:'m16 24 16 3 9-17 7 6-9 23-15 3-8 13-8-12Z',detail:'m20 29 14 5 9-8m-5 12-7 10m15-13 7 1'},
  'Swamp Essence':{color:'#6deabd',silhouette:'M31 5q4 12 13 17 15 10 12 23-5 16-25 15Q11 60 8 46q-2-12 11-23Z',shade:'M16 43q9 6 18-4 9-9 17-3 7 15-11 21-16 5-24-14Z',detail:'M19 40q4-9 10-11m2 16 6-5 6 5-6 7Zm-17-8 3-6'},
  'Titan Core':{color:'#67c8ff',silhouette:'M17 12 34 4l17 9 10 19-9 19-19 10-20-9L3 31Z',shade:'M34 4l17 9 10 19-17 5-11 24-8-23L3 31l14-19Z',detail:'M33 13 47 30 33 50 18 31Zm0 0v37m-15-19h29m-14-8 7 8-7 10-7-10Z'},
  'Ancient Rune':{color:'#dab1f8',silhouette:'M13 9 38 4l17 10 2 21-11 23-27 1L7 45Z',shade:'M38 4l17 10 2 21-11 23-7-11-3-25-23-13Z',detail:'m20 44 11-28 13 26M24 33l15-7m-9 20 8-9m-22 11 4 5 21-1'},

  longsword:{color:'#8baad9',silhouette:'M12 49l5-6 4 3 7-8-5-4 2-3 7 4L49 9l9-5-2 11-19 24 5 7-3 2-6-5-8 8 3 4-5 5Z',shade:'M32 35 56 7 52 17 36 39Z M14 49l9 7-3 2Z',detail:'m25 47 3 3m0-7 3 3m6-11L53 12m-25 25 10 8'},
  greatsword:{color:'#ff794d',silhouette:'M7 54l5-9 5 1 9-9-7-8 2-3 9 4L47 8 60 3l-2 18-19 19 1 9-4 2-6-8-9 9 1 5-8 5Z',shade:'m31 30 20-20 8-5-5 14-20 19Z M22 30l13 12 2 6-6-6Z',detail:'m32 35 5-8 4-1 3-7 6-2 5-9M14 48l5 4m-7 0 5 4m22-21 14-16'},
  axe:{color:'#85a8ff',silhouette:'M8 56l3-5 4 1 21-25-5-3-13 8-8-4 1-12 8-10 4 9 10 3 7-7 11-5 10 7-5 12-12 7-4-3-21 27 1 5-6 1Z',shade:'M10 28 12 17 19 9l1 6-5 7 4 5-2 5Z M44 12 51 6l10 7-5 12-4-4 3-6-6-3Z',detail:'m19 23 7-5 7 2 5-6 2 7 8-3-4 7m-24 21 3 3m2-9 3 3m2-9 3 3'},
  staff:{color:'#83e8ff',silhouette:'M6 58l5-8 4 1 22-27-2-10 5 4 4-7 1-6 9-3 6 11-4 9-6 3-4 9-3-4-22 27-1 5-7 1Z',shade:'M45 18 47 6l7-4-1 13-7 9Z M53 15l6-3-3 10-9 4Z M14 54l4 4-4 2Z',detail:'M42 24l5-4 6-5 5-3m-6-8 1 11-6 9m-13 6 5 4m-9 1 4 3m-14 8 4 3'},
  shield:{color:'#73c6ff',silhouette:'M5 54l6-8 4 1 7-8-6-6 3-3 7 3L47 9l9-4-2 9-17 20 5 5-4 4-9-4-9 12 1 4-8 6Z M26 20l14 3 14-6 5 4-1 17q-3 13-18 21Q29 55 25 44l-2-20Z',shade:'M40 24 55 19l2 6-1 13q-4 11-16 19Z M26 34 51 9 54 8 36 30Z',detail:'M29 26l12 2 12-5-1 14q-2 9-12 15-8-4-10-11Zm4 9q4-6 8 0t8 0m-16 6q4-5 7 0t8-1'},
  katana:{color:'#a1edd4',silhouette:'M6 54l4-5 4 1 10-10-7-5 2-3 9 4Q49 22 59 5q-1 14-9 24L34 43l3 7-3 2-6-6-10 10 1 4-7 2Z',shade:'M32 39Q49 26 58 8l-3 10-10 13-11 11Z M11 51l7 6-4 3Z',detail:'M29 38Q49 25 56 13m-40 35 4 3m0-7 4 3m-12 6 4 3'},
  potion:{color:'#f485ba',silhouette:'M24 5h16l3 7-3 3v8l10 8 4 11-4 11-11 6H23l-12-7-3-10 4-10 12-9v-8l-3-3Z',shade:'M12 38q9-6 19 0t19 0l2 8-5 8-10 3H23l-9-6-4-8Z M25 6h14l1 7H24Z',detail:'M25 17h14m-15 7h16M16 42q5-3 10-1m15 8 5-5m-15-3v11m-5-5h10'},
  'Wolf Fang':{color:'#e4c493',silhouette:'M18 9q13-8 25 2l5 9Q44 46 18 59l-4-4q12-12 8-24l-8-10Z',shade:'M18 9q13-7 24 3l3 9-8-3-10 7-10-5Z M28 33q1 13-10 22 23-14 27-32-8 12-17 10Z',detail:'m23 12 6 4 7-6m-5 19q2 9-6 17'},
  'Dire Fang':{color:'#c6a2fa',silhouette:'M14 9 25 4l12 4 12-4 5 8-1 12Q43 50 12 60l-4-5q17-12 16-25l-10-8Z',shade:'m26 7 11 4 11-5 3 8-9 11-13-5-11 4-4-9Z M43 27Q32 49 13 56 32 53 47 33Z',detail:'m20 13 8 1 5 8 5-2m9-11-6 7m2 12-7 8-3 8-10 5'},
  'Wolf Hide':{color:'#bcaab7',silhouette:'M15 6l14 5 10-5 10 7-3 9 11 9-7 8-9-1-4 11 3 9-10-2-9 4 1-13-6-9-10-2-1-10 10-6Z',shade:'m15 8 14 8 10-7 6 8-4 10 9 7-11-2-8 18-2-14-8-8-12 3 8-9Z',detail:'m21 19 4 7-8 5m18-13-6 12 5 5-5 12m13-20-4 7'},
  'Goblin Hide':{color:'#a1bf7b',silhouette:'M12 10l10 2 11-7 13 5 4 10-4 6 10 11-7 7-10-4-7 8-4 11-10-5 2-16-11-4-4-10 8-5Z',shade:'m24 15 9-7 11 4 3 7-9 9 12 11-13-4-10 13 1-13-13-7 6-7Z',detail:'m20 17 6 7-4 7m14-13-6 7 8 7-7 5m-12-5 6 3-2 12'},
  'Orc Tusks':{color:'#e3c898',silhouette:'M8 17l11-8 9 9-1 13Q20 50 7 53l-2-5q10-8 7-17Z M39 12l12-5 8 8-2 18Q50 50 34 57l-5-4q12-13 12-24Z',
    shade:'M15 14l7-3 4 7-4 14L8 49q13-13 7-30Zm28 4 12-9 3 7-7 20-14 15q14-18 6-33Z',detail:'m15 20 4 8-4 11m28-18 4 9-8 15'},
  Leather:{color:'#be946b',silhouette:'M10 16 25 7l22 2 8 9-2 15 4 11-11 10-16 2-15-6-8-7 5-11Z',
    shade:'M12 18 25 9l22 2 6 7-5 11 5 14-9 8-15 2-16-8 5-16Z',detail:'M18 19 29 14l12 1 6 5-5 10 4 11-7 6-12 1-10-6 5-10Z m7 1 11-4m-11 11 10-3'},
  Bones:{color:'#dfc9a2',silhouette:'M8 12q5-5 10 1l4 8 24 19q11-3 13 4 1 6-7 6 0 8-7 8-6-2-4-11L17 28Q5 30 5 23q-1-5 6-6Z M38 6q9-3 10 5 6 1 4 6-2 4-8 3l-8 9-6-5 8-10Z',shade:'m21 22 25 20-4 4-24-20Z M39 14l7 5-9 10-5-4Z',detail:'m10 21 6 2m30 23 5-1m-6 6 2 3m-7-40 4 1'},
  coin:{color:'#f5bc66',silhouette:'M9 27C9 16 19 8 32 8s23 8 23 19v11c0 11-10 18-23 18S9 49 9 38Z',shade:'M9 27c0 11 10 19 23 19s23-8 23-19v11c0 11-10 18-23 18S9 49 9 38Z',detail:'M15 27c0-8 8-14 17-14s17 6 17 14-8 14-17 14-17-6-17-14Zm9 0 8-9 8 9-8 9ZM18 45v5m8-2v5m12-5v5m8-8v5'},
  'Magic Crystal':{color:'#a590ff',silhouette:'M8 43l6-20 10 6 2-17L38 4l11 13-3 11 9-4 4 15-13 16-17 5Z',shade:'M26 12l12-8-7 16-6 27 13 8-9 5-12-18 7-13Zm12-8 11 13-16 2Zm8 24 9-4-8 16-11 10Z',detail:'m15 25 2 17 9 5m6-27 7 6-8 20m17-27-9 7m8 14 10-1'},
  armor:{color:'#b1c6ec',silhouette:'M8 17 20 9l12 9 12-9 12 8 4 15-11 3-3 19-14 5-14-5-3-19-11-3Z',shade:'m8 17 12-8 12 9-12 13-14-1Zm24 1 12-9 12 8 2 13-14 1Zm0 12 12 5-4 16-8 7Z',detail:'m20 17 12 8 12-8M18 32l14 6 14-6M21 43l11 5 11-5m-11-5v16'},
  Iron:{color:'#9eb3ce',silhouette:'M5 43l9-19 28-9 15 12 3 16-31 13Z',shade:'m5 43 31-10 21-6 3 16-31 13Z M14 24l22 9 21-6-15-12Z',detail:'m16 28 16 7-3 18m-17-9 13 7m14-14 14-5'},
  All:{color:'#bba4ff',silhouette:'M32 6l25 26-25 26L7 32Z',shade:'M32 7v25h25L32 57V32H7Z',detail:'M32 17l14 15-14 15-14-15Zm0 0v30M18 32h28'},
  Accessories:{color:'#efcb8b',silhouette:'M16 20 25 7h14l9 13-8 8q13 5 13 16 0 15-21 15T11 44q0-11 13-16Z',shade:'m25 8 7 13 7-13 9 12-16 10-16-10Z',detail:'M23 35q-10 13 9 18 19-5 9-18m-23-15h28'},
  Fire:{color:'#ff8055',silhouette:'M32 58Q8 55 10 36q1-13 13-20-1 10 5 11 0-15 13-23-4 13 5 22 15 13 5 25-7 7-19 7Z',shade:'M31 54q-12-3-9-13l6 3 9-13q13 18-6 23Z',detail:'M16 35q-4 13 9 19m15-38 2 12'},
  Lightning:{color:'#a5bcff',silhouette:'M34 4 10 36h19l-6 24 31-36H34l9-20Z',shade:'M34 5 17 32h19l-9 21 26-28H33l9-20Z',detail:'M28 19 16 33h18m8-5h7'},
  Ice:{color:'#8fe3ff',silhouette:'M31 3l6 8-1 14 12-6 10 1-4 9-12 4 12 5 4 9-11-1-11-6 1 13-6 8-5-8 1-13-11 6-10 1 4-9 11-5-11-4-4-9 10-1 11 6-1-14Z',shade:'M31 15v39l-4-21Zm17 12-32 14 14-10Z',detail:'M31 25l7 8-7 8-7-8Z'},
  Water:{color:'#78c8ff',silhouette:'M32 5c6 11 21 24 21 35a21 21 0 0 1-42 0C11 29 26 16 32 5Z',shade:'M14 41q9-9 17-1t20-2q0 18-19 19-15-1-18-16Z',detail:'M20 38q0-7 9-17m-8 26q4 6 10 6'},
  Wind:{color:'#b3efd6',silhouette:'M5 30q21 3 33-10 7-8-4-11 18-5 20 9 3 17-25 22 16 4 21-4 5 11-8 16-14 7-37-14l19-3Z',shade:'M6 32q35 8 47-14 0 19-28 22l-9-4Z',detail:'M18 44q13 9 23 4m-22-15q20 0 27-15'},
};
const armorArt:Record<ArmorSlot,Art>={
  helmet:{color:'#bccbef',silhouette:'M10 30Q10 9 32 5q22 4 22 25l-2 18-13 9v-8H25v8l-13-9Z',shade:'M32 6q22 5 23 24l-3 18-13 9v-8l9-8 2-12-10-5Z',detail:'M15 29 32 21l17 8-3 8-11-4v9h-6v-9l-11 4Zm4-6 7-9m20 10-7-10M32 7v12'},
  chestplate:{color:'#bdc7f2',silhouette:'M5 17 16 8l11 4 5 3 5-3 11-4 11 9-5 15-7-2-3 22-12 8-12-8-3-22-7 2Z',shade:'M32 16l17-7 10 8-6 14-6-2-3 23-12 7Z',detail:'m9 19 13-6 10 7 10-7 13 6M17 30l15 4 15-4M22 43l10 6 10-6m-10-9v20'},
  gauntlets:{color:'#aeb9dd',silhouette:'M25 58 10 43l5-11-4-8 3-5 7 4-4-14 5-4 8 13 1-13h6l2 14 4-9 6 2-2 13 7-3 4 4-9 17-13 15Z',shade:'m24 34 13-7 4-10-2 18 12-4-5 14-11 12Z',detail:'M13 42l13 3 12 9m-19-22 8 5m-2-15 5 10m3-12 2 9m4 15 10-8'},
  legs:{color:'#b7bfe6',silhouette:'M13 7h39l-3 19 1 26-6 6H35l-5-24-6 23H13L9 49l4-21Z',shade:'M31 8h21l-3 18 1 26-6 6h-9l-5-24Z',detail:'M14 15h35M15 25l9 5-6 17m17-22 8 5 1 20m-30 0h10m12 0h12M32 16l-1 14'},
  boots:{color:'#a9b5d6',silhouette:'M13 8h26l-3 19 6 14 15 4 3 10-7 5H13L7 55l3-20Z',shade:'M27 9h12l-3 19 6 13 15 4 3 10-7 5H22l5-12-4-12Z',detail:'M13 14h24M11 27l25 1m-26 8 27 1m-19 13 13-6 25 5M10 55h47'},
  cape:{color:'#c888b2',silhouette:'M14 6 26 13h12L50 6l3 22 7 28-12-2-9 6-10-3-11 3L5 56l6-28Z',shade:'M28 15h14l8-9 3 24 6 26-13-3-8 5-1-30Z',detail:'M15 12l6 8-6 31m34-38-7 9 7 28M32 15v40m-5-28 5-6 5 6-5 8Z'},
  amulet:{color:'#9bd8f4',silhouette:'M9 7h7l4 9 12 9 12-9 4-9h7l-5 14-12 9 10 10-16 19-16-19 10-10-12-9Z',shade:'M32 29l16 11-16 19-6-12 6-6Z',detail:'M32 32l8 9-8 12-8-12ZM15 12l4 8m31-8-4 8m-14 16v13'},
  ring:{color:'#b9a7fc',silhouette:'M12 28 22 11l10-5 10 5 10 17 1 16-8 12-13 6-13-6-8-12Z M24 34l-4 9 5 8 7 3 7-3 5-8-4-9Z',shade:'M32 7l10 5 9 16-17 2-6-9Z M46 30l7 13-8 13-13 6 6-8 6-5 1-9Z',detail:'M19 22l13-12 13 12-13 8Zm13-12v20m-19 6 5 9m33-9-5 9'},
};
export const categoryIcon:Record<string,string>={All:'All',Weapons:'longsword',Armor:'armor',Consumables:'potion',Materials:'Magic Crystal',Accessories:'Accessories'};
export function Glyph({kind}:{kind:string}){
  const id=useId();
  const piece=isArmorId(kind)?armorPiece(kind):undefined;
  const {color:base,silhouette,shade,detail}=piece?armorArt[piece.slot]:art[kind]??art.Iron;
  const color=piece?(piece.set==='iron'?'#c7aa8c':piece.set==='abyssal'?'#b57bf2':base):base;
  return <svg className="item-glyph" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id={id} x2=".88" y2="1">
      <stop stopColor="#fff"/><stop offset=".42" stopColor={color}/><stop offset="1" stopColor="#29243e"/>
    </linearGradient></defs>
    <path d={silhouette} fill={'url(#'+id+')'} stroke="#f7f6ff" strokeWidth="1.1"/>
    <path d={shade} fill={color} opacity=".48"/>
    {piece?.set!=='iron'&&piece&&<path d="m51 7 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill={color} opacity=".86"/>}
    <path d={detail} fill="none" stroke="#fff" strokeWidth="1.3" opacity=".86"/>
  </svg>;
}
