export function InteractionPrompt({ hint }: { readonly hint: string | null }) {
  return hint ? <p className="interaction-prompt" role="status">{hint}</p> : null;
}
