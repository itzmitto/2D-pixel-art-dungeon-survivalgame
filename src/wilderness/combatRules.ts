import { weapons, type Weapon } from './weapons.ts';
export const longsword=weapons.longsword;

export const wolf = {
  name: 'Blackwater Wolf', level: 1, health: 6, damage: 2, speed: 4.25,
  awareness: 19, leash: 32, windup: .57, recovery: 1.1, reach: 1.85, xp: 20,
} as const;
export const wolfLoot = { gold: 4, item: 'Wolf Fang', count: 1 } as const;
export const maxHealth = 10;
export const xpNeeded = (level: number) => level * 60;

type Point = { x: number; z: number };
export function inArc(origin: Point, target: Point, facing: number, range: number, halfAngle: number) {
  const dx=target.x-origin.x, dz=target.z-origin.z, distance=Math.hypot(dx,dz);
  return distance <= range && (distance === 0 ||
    (dx*Math.sin(facing)+dz*Math.cos(facing))/distance >= Math.cos(halfAngle));
}

export function swingTimer() {
  let elapsed=longsword.cooldown, attack=longsword;
  return {
    get busy(){return elapsed<attack.cooldown;},
    start(weapon:Weapon=longsword) {
      if(elapsed<attack.cooldown) return false;
      attack=weapon;
      elapsed=0;
      return true;
    },
    advance(dt:number) {
      const previous=elapsed;
      elapsed=Math.min(attack.cooldown,elapsed+dt);
      return previous<attack.impactTime && elapsed>=attack.impactTime;
    },
    cancel() { elapsed=attack.cooldown; },
  };
}
