export type Obstacle = { x: number; z: number; r: number };

export function obstacleGrid(obstacles: readonly Obstacle[], size = 24) {
  const cells = new Map<string, Obstacle[]>();
  const cell = (value: number) => Math.floor(value / size);
  const key = (x: number, z: number) => x + ',' + z;
  for (const obstacle of obstacles) {
    const radius = obstacle.r + 1;
    for (let z = cell(obstacle.z-radius); z <= cell(obstacle.z+radius); z++) {
      for (let x = cell(obstacle.x-radius); x <= cell(obstacle.x+radius); x++) {
        const id = key(x,z);
        const list = cells.get(id);
        if (list) list.push(obstacle);
        else cells.set(id,[obstacle]);
      }
    }
  }
  const empty: readonly Obstacle[] = [];
  return (x: number,z: number): readonly Obstacle[] => cells.get(key(cell(x),cell(z))) ?? empty;
}
