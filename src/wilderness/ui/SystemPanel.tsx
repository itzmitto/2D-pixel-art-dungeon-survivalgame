import { useId, type ReactNode } from 'react';

const outline='M2 35 35 2H285L304 14H896L915 2H1165L1198 35V745L1165 778H915L896 766H304L285 778H35L2 745Z';

function SystemFrame(){
  return <div className="system-frame" aria-hidden="true">
    <svg className="system-traces" viewBox="0 0 1200 780" preserveAspectRatio="none">
      <path className="frame-aura" d={outline}/>
      <path className="frame-line" d={outline}/>
      <path className="frame-inner" d="M10 46 46 10H273L302 24H898L927 10H1154L1190 46V734L1154 770H927L898 756H302L273 770H46L10 734Z"/>
      <path className="frame-corners" d="M2 93V35L35 2H135M1065 2h100l33 33v58M2 687v58l33 33h100m930 0h100l33-33v-58"/>
      <path className="frame-edge-light" d={outline} pathLength="1000"/>
    </svg>
    <svg className="system-sigil" viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="179"/><circle cx="200" cy="200" r="161" strokeDasharray="1 6"/>
      <circle cx="200" cy="200" r="125"/><circle cx="200" cy="200" r="88"/>
      <path d="M200 21 354 283H46ZM200 379 46 117h308ZM200 75 325 200 200 325 75 200Z"/>
      {Array.from({length:12},(_,i)=><path key={i} d="m193 31 7 8 7-8m-7 7v10" transform={'rotate('+i*30+' 200 200)'}/>)}
    </svg>
  </div>;
}

export function SystemPanel({title,section,close,children,style=''}:{
  title:string;section:string;close:()=>void;children:ReactNode;style?:string;
}){
  const id=useId();
  const hunter=!style.includes('atlas-panel');
  const content=<>
    <header className="system-heading"><div><span className="system-kicker">{section}</span><h2 id={id}>{title}</h2></div>
      <button className="system-close" autoFocus onClick={close} aria-label="Close overlay">× <kbd>Esc</kbd></button>
    </header>
    {children}
  </>;
  return <div className={'system-shade'+(hunter?' hunter-shade':'')}><section className={'system-panel '+style+(hunter?' hunter-window':'')} role="dialog" aria-modal="true" aria-labelledby={id}>
    {hunter?<><SystemFrame/><div className="hunter-scroll">{content}</div></>:content}
  </section></div>;
}
