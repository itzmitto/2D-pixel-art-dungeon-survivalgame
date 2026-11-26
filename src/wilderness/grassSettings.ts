export const grassPresets={
  Off: {budget:0,distance:0,density:0,near:0,mid:0,interaction:0,actors:0,spells:0},
  Low: {budget:15_000,distance:39,density:.58,near:0,mid:24,interaction:16,actors:2,spells:1},
  Medium: {budget:35_000,distance:55,density:.82,near:20,mid:36,interaction:23,actors:4,spells:2},
  High: {budget:65_000,distance:67,density:.94,near:27,mid:47,interaction:29,actors:5,spells:3},
  Ultra: {budget:100_000,distance:80,density:1,near:35,mid:55,interaction:34,actors:6,spells:3},
} as const;

export type GrassQuality=keyof typeof grassPresets;
export type GrassBudgets=Partial<Record<Exclude<GrassQuality,'Off'>,number>>;
export type GrassSettings={quality:GrassQuality;budgets:GrassBudgets};

export const maxGrassBudget=200_000;
const settingsKey='vonkje-wilderness-grass';

export function readGrassSettings():GrassSettings{
  const settings:GrassSettings={quality:'Medium',budgets:{}};
  try {
    const saved=JSON.parse(localStorage.getItem(settingsKey)??'null');
    if(!saved||typeof saved!=='object') return settings;
    if(typeof saved.quality==='string'&&Object.hasOwn(grassPresets,saved.quality)) settings.quality=saved.quality;
    for(const quality of ['Low','Medium','High','Ultra'] as const){
      const budget=saved.budgets?.[quality];
      if(Number.isInteger(budget)&&budget>0&&budget<=maxGrassBudget) settings.budgets[quality]=budget;
    }
  } catch {
    // Private mode or a malformed preference can fall back to Medium.
  }
  return settings;
}

export function saveGrassSettings(settings:GrassSettings){
  try {localStorage.setItem(settingsKey,JSON.stringify(settings));}
  catch { /* The current session still uses the selected settings. */ }
}
