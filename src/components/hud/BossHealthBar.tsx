import type { BossView } from '../../game/core/bridge';

export function BossHealthBar({ boss }: { readonly boss: BossView | null }) {
  if (!boss) return null;
  return <section className="boss-health" aria-label={`${boss.name} health`}>
    <strong>{boss.name}</strong>
    <progress max={boss.maxHealth} value={boss.health} aria-label={`${boss.health} of ${boss.maxHealth} health`} />
    <span>{boss.cue}</span>
  </section>;
}
