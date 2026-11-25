import * as T from 'three';
import { createKnightModel } from './model.ts';

import { weapons, elementalIds, type Weapon, type WeaponId } from '../weapons.ts';
import { weaponModel } from '../weaponModels.ts';

type Motion = { speed: number; sprinting: boolean; blocking?: boolean; facing?: number };

export function createDarkKnight() {
  const model = createKnightModel();
  const {root,hips,torso,head,arms,legs,cape} = model;
  let time=0, phase=0, stride=0, run=0, guard=0, turn=0, attack=1;
  let weapon=weapons.longsword, poseWeapon=weapon, duration=weapon.attackDuration;
  const starter=arms[1].socket.children.slice();
  const models=new Map(elementalIds.map(id=>{
    const model=weaponModel(id);
    arms[1].socket.add(model.right);
    arms[0].fore.add(model.left);
    model.left.position.set(-.12,-.13,.12);
    model.left.rotation.y=-.52;
    return [id,model] as const;
  }));
  function equip(id:WeaponId){
    weapon=weapons[id];
    for(const part of starter) part.visible=id==='longsword';
    for(const [key,model] of models) model.right.visible=model.left.visible=key===id;
  }
  equip('longsword');
  const swing = new Float32Array(8);

  function playAttack(config:Weapon=weapon, ability=false) {
    if (attack < duration) return false;
    poseWeapon=config;
    duration=ability?.69:config.attackDuration;
    attack=0;
    return true;
  }

  function update(dt: number, motion: Motion) {
    time+=dt;
    const weight=1-Math.exp(-13*dt);
    const motionWeight=T.MathUtils.clamp(motion.speed/6,0,1);
    stride=T.MathUtils.lerp(stride,motionWeight,weight);
    run=T.MathUtils.lerp(run,motion.sprinting ? motionWeight : 0,weight);
    const delta=motion.facing === undefined ? 0 : motion.facing-root.rotation.y;
    const yaw=Math.atan2(Math.sin(delta),Math.cos(delta))*weight;
    root.rotation.y+=yaw;
    turn=T.MathUtils.lerp(turn,dt>0 ? T.MathUtils.clamp(yaw/dt,-4,4) : 0,weight);
    phase=(phase+dt*stride*(8.7+3.7*run))%(Math.PI*2);

    attack=Math.min(duration,attack+dt);
    guard=T.MathUtils.lerp(guard,motion.blocking && attack===duration ? 1 : 0,weight);
    const fraction=attack/duration;
    const impact=poseWeapon.impactTime/poseWeapon.attackDuration;
    const windupEnd=impact*.78, followEnd=impact+.14;
    for(let i=0;i<swing.length;i++){
      const {windup,strike}=poseWeapon.animation;
      swing[i]=fraction<windupEnd
        ? windup[i]*T.MathUtils.smoothstep(fraction,0,windupEnd)
        : fraction<followEnd
          ? T.MathUtils.lerp(windup[i],strike[i],T.MathUtils.smoothstep(fraction,windupEnd,followEnd))
          : strike[i]*(1-T.MathUtils.smoothstep(fraction,followEnd,1));
    }

    hips.position.y=1.02-.055*stride-.036*run+.026*Math.cos(phase*2)*stride;
    hips.rotation.y=.086*Math.sin(phase)*stride;
    torso.rotation.x=.045*stride+.19*run;
    torso.rotation.y=-.15*Math.sin(phase)*stride+swing[0];
    torso.rotation.z=.029*Math.sin(phase)*stride-turn*.021;
    torso.position.y=.09+.009*Math.sin(time*2.4)*(1-stride*.7);
    head.rotation.x=-torso.rotation.x*.53;
    head.rotation.y=-torso.rotation.y*.32;

    for(let i=0;i<2;i++){
      const side=i===0?-1:1;
      const step=Math.sin(phase+i*Math.PI), cycle=Math.cos(phase+i*Math.PI);
      const {upper,lower,foot}=legs[i];
      // The thigh swings from the hip. The knee folds on the return
      // stroke, and the boot counter-rotates through the planted phase.
      const thigh=step*(.38+.27*run)*stride;
      const knee=.11+(.10+Math.max(0,-cycle)*(.68+.31*run))*stride;
      upper.rotation.x=thigh-knee*.43;
      lower.rotation.x=knee;
      foot.rotation.x=-(upper.rotation.x+knee)*(.87-.35*Math.max(0,-cycle));

      const arm=arms[i];
      arm.shoulder.rotation.y=i===1?swing[1]:-swing[0]*.3;
      arm.shoulder.rotation.z=side*(.085+.06*run);
      const attacking=i===1? Math.sin(Math.PI*attack/duration):0;
      arm.upper.rotation.x=-step*(.29+.17*run)*stride*(1-attacking)+ (i===1?swing[2]:.13*swing[0]);
      arm.upper.rotation.z=side*.087+(i===1?swing[3]:-.19*Math.abs(swing[0]));
      arm.fore.rotation.x=-.2-.40*run+(i===1?swing[4]:0);
      arm.hand.rotation.y=i===1?swing[5]:0;
    }
    arms[1].upper.rotation.x-=.72*guard;
    arms[1].upper.rotation.z+=.3*guard;
    arms[1].fore.rotation.x-=.63*guard;
    arms[0].upper.rotation.x-=.49*guard;
    arms[0].fore.rotation.x-=.35*guard;
    if(weapon.model.twoHanded && attack<duration){
      arms[0].upper.rotation.x-=.64*Math.sin(fraction*Math.PI);
      arms[0].shoulder.rotation.y+=.6*Math.sin(fraction*Math.PI);
      arms[0].fore.rotation.x-=.53*Math.sin(fraction*Math.PI);
    }
    if(weapon.model.shield){
      arms[0].upper.rotation.x-=.24+.46*guard;
      arms[0].fore.rotation.x-=.27+.5*guard;
    }
    arms[1].socket.rotation.set(-.38+swing[6]+1.08*guard,0,weapon.model.grip+swing[7]+2.57*guard);

    const cloth=cape.geometry.attributes.position;
    for(let row=0;row<=12;row++){
      const down=row/12;
      const slack=down*down;
      const width=.56+.32*Math.sin(down*1.7);
      for(let col=0;col<=10;col++){
        const u=col/5-1;
        const tail=.10*stride+.46*run;
        const flutter=.042*Math.sin(time*4.1-down*6+u*3)+.028*Math.sin(time*7.2+u*7-down*4);
        cloth.setXYZ(row*11+col,
          u*width*.5-turn*.074*slack+.071*Math.sin(time*2.6-down*4)*slack,
          .406-down*(1.13-.19*run)+slack*(.09*Math.abs(u)+flutter*.6),
          -.153-down*(.31+tail)+.045*Math.cos(u*10+down*1.4)*down-flutter*down);
      }
    }
    cloth.needsUpdate=true;
    cape.geometry.computeVertexNormals();
  }

  update(0,{speed:0,sprinting:false});
  return {root,update,playAttack,equip};
}
