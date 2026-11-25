import { ArmorBar } from './ArmorBar';
import { HealthBar } from './HealthBar';
import { BossHealthBar } from './BossHealthBar';
import type { GameSnapshot } from '../../game/core/bridge';

export function HUD({ snapshot }: { readonly snapshot: GameSnapshot }) {
  return <>
    <section className="hud-status" aria-label="Game status">
      <strong>{snapshot.region}</strong>
      <HealthBar hearts={snapshot.hearts} />
      <ArmorBar defense={snapshot.defense} />
      <span>{snapshot.fireballLabel}</span>
      {snapshot.hasKey && <span>Keep key found</span>}
    </section>
    <BossHealthBar boss={snapshot.boss} />
  </>;
}
