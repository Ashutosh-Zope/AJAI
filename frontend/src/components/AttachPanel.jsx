import { useRef, useState } from 'react';
import { api } from '../lib/api';
import styles from './AttachPanel.module.css';

export default function AttachPanel({ doc, canEdit, onClose, onUpdate }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleAttach(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await api.upload.attach(doc.id, file);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>Attachments</h3>
        <button onClick={onClose} className={styles.closeBtn}>×</button>
      </div>
      {canEdit && (
        <div className={styles.upload}>
          <button className={styles.uploadBtn} onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '↑ Attach file'}
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,.json" hidden onChange={handleAttach} />
          <p className={styles.note}>Supports .txt, .md, .json (10MB max)</p>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
      {doc.attachments?.length > 0 ? (
        <ul className={styles.list}>
          {doc.attachments.map(a => (
            <li key={a.id} className={styles.item}>
              <span className={styles.icon}>📎</span>
              <span className={styles.name}>{a.original_name}</span>
              <span className={styles.size}>{(a.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No attachments yet.</p>
      )}
    </div>
  );
}
