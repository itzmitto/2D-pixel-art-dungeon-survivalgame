interface ArmorBarProps { readonly defense: number }

export function ArmorBar({ defense }: ArmorBarProps) {
  return <span className="armor-display" aria-label={`Armor ${defense}`}>Armor {defense}</span>;
}
