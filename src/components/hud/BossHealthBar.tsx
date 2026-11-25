import type { BossView } from '../../game/core/bridge';

export function BossHealthBar({ boss }: { readonly boss: BossView | null }) {
  if (!boss) return null;
  return <section id="warden-hud" aria-label={`${boss.name} health`}>
    <strong>{boss.name}</strong>
    <progress id="warden-health" max={boss.maxHealth} value={boss.health} aria-label={`${boss.health} of ${boss.maxHealth} health`} />
    <span id="warden-cue">{boss.cue}</span>
  </section>;
}
