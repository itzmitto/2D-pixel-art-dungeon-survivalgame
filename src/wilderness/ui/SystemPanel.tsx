import { useId, type ReactNode } from 'react';

export function SystemPanel({title,section,close,children,style=''}:{
  title:string;section:string;close:()=>void;children:ReactNode;style?:string;
}){
  const id=useId();
  return <div className="system-shade"><section className={'system-panel '+style} role="dialog" aria-modal="true" aria-labelledby={id}>
    <header className="system-heading"><div><span className="system-kicker">{section}</span><h2 id={id}>{title}</h2></div>
      <button className="system-close" autoFocus onClick={close} aria-label="Close overlay">× <kbd>Esc</kbd></button>
    </header>
    {children}
  </section></div>;
}
