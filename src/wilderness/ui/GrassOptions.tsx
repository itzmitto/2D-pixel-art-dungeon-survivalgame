import { grassPresets, maxGrassBudget, type GrassQuality, type GrassSettings } from '../grassSettings';
import { SystemPanel } from './SystemPanel';

const qualities=Object.keys(grassPresets) as GrassQuality[];

export function GrassOptions({settings,changeQuality,changeBudget,close}:{
  settings:GrassSettings;
  changeQuality:(quality:GrassQuality)=>void;
  changeBudget:(quality:Exclude<GrassQuality,'Off'>,budget:number|undefined)=>void;
  close:()=>void;
}){
  const {quality,budgets}=settings;
  return <SystemPanel title="Graphics" section="Settings" style="graphics-panel" close={close}>
    <div className="grass-options">
      <label>Grass quality
        <select value={quality} onChange={event=>changeQuality(event.currentTarget.value as GrassQuality)}>
          {qualities.map(value=><option key={value}>{value}</option>)}
        </select>
      </label>
      {quality!=='Off'&&<label>Visible blade limit
        <input key={quality} type="number" min={1} max={maxGrassBudget}
          defaultValue={budgets[quality]??grassPresets[quality].budget}
          onKeyDown={event=>{if(event.key==='Enter') event.currentTarget.blur();}}
          onBlur={event=>{
            const input=event.currentTarget;
            const number=input.valueAsNumber;
            const limit=Number.isFinite(number)?Math.min(maxGrassBudget,Math.max(1,Math.round(number))):undefined;
            changeBudget(quality,limit===grassPresets[quality].budget?undefined:limit);
            input.value=String(limit??grassPresets[quality].budget);
          }}/>
      </label>}
    </div>
  </SystemPanel>;
}
