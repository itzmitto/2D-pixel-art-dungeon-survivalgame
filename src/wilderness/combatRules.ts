export const longsword = {
  name: 'Longsword', damage: 3, range: 2.9, reachAngle: 1.05,
  impactTime: .32, cooldown: .78, rarity: 'Common',
} as const;

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
  let elapsed=longsword.cooldown as number;
  return {
    start() {
      if(elapsed<longsword.cooldown) return false;
      elapsed=0;
      return true;
    },
    advance(dt:number) {
      const previous=elapsed;
      elapsed=Math.min(longsword.cooldown,elapsed+dt);
      return previous<longsword.impactTime && elapsed>=longsword.impactTime;
    },
    cancel() { elapsed=longsword.cooldown; },
  };
}
