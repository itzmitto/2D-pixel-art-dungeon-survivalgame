export const statusTuning = { burn:3.4, burnInterval:.8, stun:.8, freeze:1.4, slow:3.5, protection:5, knockback:.24 } as const;
export type Resistance = { control:number; damageOverTime:number };
export const ordinaryResistance:Resistance={control:1,damageOverTime:1};
// Boss definitions can opt into a shorter control window with this profile.
export const bossResistance:Resistance={control:.2,damageOverTime:.6};
export function statuses(resistance:Resistance=ordinaryResistance) {
  let burn=0, nextTick=0, stun=0, slow=0, frozen=0, pushTime=0, pushX=0, pushZ=0;
  return {
    ignite() {
      if(burn<=0) nextTick=statusTuning.burnInterval;
      burn=Math.max(burn,statusTuning.burn);
    },
    stun(){stun=Math.max(stun,statusTuning.stun*resistance.control);},
    slow(){slow=Math.max(slow,statusTuning.slow*resistance.control);},
    freeze(){
      frozen=Math.max(frozen,statusTuning.freeze*resistance.control);
      slow=Math.max(slow,statusTuning.slow*resistance.control);
    },
    knockback(x:number,z:number){
      pushTime=statusTuning.knockback*resistance.control;
      pushX=x;pushZ=z;
    },
    get visual(){return frozen>0?'frozen':stun>0?'stunned':burn>0?'burning':slow>0?'slowed':null;},
    get halted(){return stun>0 || frozen>0;},
    get speed(){return slow>0?.48:1;},
    update(dt:number, damage:(amount:number)=>void, move:(x:number,z:number)=>void){
      stun=Math.max(0,stun-dt); frozen=Math.max(0,frozen-dt);slow=Math.max(0,slow-dt);
      if(burn>0){
        nextTick-=Math.min(burn,dt);
        burn=Math.max(0,burn-dt);
        while(nextTick<=0){
          damage(resistance.damageOverTime);
          nextTick+=statusTuning.burnInterval;
        }
      }
      if(pushTime>0){
        const step=Math.min(dt,pushTime);
        pushTime-=step;
        move(pushX*step,pushZ*step);
      }
    },
  };
}
export function protection() {
  let time=0, capacity=0;
  return {
    activate(seconds:number, absorb:number){time=seconds;capacity=absorb;},
    update(dt:number){time=Math.max(0,time-dt);if(time===0) capacity=0;},
    absorb(damage:number){
      const absorbed=Math.min(capacity,damage);
      capacity-=absorbed;
      return damage-absorbed;
    },
    get active(){return time>0&&capacity>0;},
  };
}
