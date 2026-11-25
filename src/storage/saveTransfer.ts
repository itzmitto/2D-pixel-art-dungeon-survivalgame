export type ImportableSave = Record<string, unknown>;

export function parseSaveFile(text: string): ImportableSave {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Save must be a JSON object');
  }
  const candidate = value as Record<string, unknown>;
  const recognizable = ['version', 'bag', 'position', 'wood', 'items', 'buildings']
    .some((key) => key in candidate);
  if (!recognizable || ('version' in candidate && typeof candidate.version !== 'number')) {
    throw new Error('Unrecognized Vonkje save format');
  }
  return candidate;
}

export function exportSaveText(storage: Pick<Storage, 'getItem'>, key: string): string {
  const save = storage.getItem(key);
  if (!save) throw new Error('No browser save was found');
  parseSaveFile(save);
  return save;
}
