import { useRef, useState } from 'react';
import styles from '../../styles/App.module.css';
import { exportSaveText, parseSaveFile } from '../../storage/saveTransfer';

export function SaveTransfer() {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const exportSave = () => {
    try {
      const data = exportSaveText(localStorage, 'vonkje-survival-v1');
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'vonkje-save.json'; link.click(); URL.revokeObjectURL(url);
      setMessage('Save exported.');
    } catch { setMessage('No accessible browser save was found. Export from the previous version first.'); }
  };
  const importSave = async (file?: File) => {
    if (!file) return;
    try {
      const save = parseSaveFile(await file.text());
      const current = localStorage.getItem('vonkje-survival-v1');
      if (current !== null) {
        const backup = `vonkje-survival-v1:backup:${crypto.randomUUID()}`;
        localStorage.setItem(backup, current);
      }
      localStorage.setItem('vonkje-survival-v1', JSON.stringify(save));
      window.vonkje?.stop();
      window.location.reload();
    } catch { setMessage('That save file is invalid. Your current save was not changed.'); }
  };
  return <div className={styles.saveTools} aria-label="Save transfer">
    <button type="button" onClick={exportSave}>Export save</button>
    <button type="button" onClick={() => input.current?.click()}>Import save</button>
    <input ref={input} type="file" accept="application/json,.json" hidden onChange={(event) => void importSave(event.target.files?.[0])} />
    <span role="status">{message}</span>
  </div>;
}
