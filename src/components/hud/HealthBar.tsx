interface HealthBarProps { readonly hearts: number; readonly maximum?: number }

export function HealthBar({ hearts, maximum = 3 }: HealthBarProps) {
  return <div className="health-display" role="img" aria-label={`${hearts} of ${maximum} hearts`}>
    {Array.from({ length: maximum }, (_, index) => <span key={index} aria-hidden="true">{hearts > index ? '♥' : '♡'}</span>)}
  </div>;
}
