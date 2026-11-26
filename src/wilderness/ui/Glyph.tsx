import { useId } from 'react';

type Art={color:string; silhouette:string; shade:string; detail:string};
const art:Record<string,Art>={
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
export const categoryIcon:Record<string,string>={All:'All',Weapons:'longsword',Armor:'armor',Consumables:'potion',Materials:'Magic Crystal',Accessories:'Accessories'};
export function Glyph({kind}:{kind:string}){
  const id=useId();
  const {color,silhouette,shade,detail}=art[kind]??art.Iron;
  return <svg className="item-glyph" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id={id} x2=".88" y2="1">
      <stop stopColor="#fff"/><stop offset=".42" stopColor={color}/><stop offset="1" stopColor="#29243e"/>
    </linearGradient></defs>
    <path d={silhouette} fill={'url(#'+id+')'} stroke="#f7f6ff" strokeWidth="1.1"/>
    <path d={shade} fill={color} opacity=".48"/>
    <path d={detail} fill="none" stroke="#fff" strokeWidth="1.3" opacity=".86"/>
  </svg>;
}
