export function LootNotifications({ message }: { readonly message: string }) {
  return message ? <p className="loot-notification" role="status" aria-live="polite">{message}</p> : null;
}
