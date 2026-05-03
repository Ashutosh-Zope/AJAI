import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import styles from './Modal.module.css';

export default function ShareModal({ doc, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.documents.users(doc.id).then(setUsers).catch(() => {});
  }, [doc.id]);

  async function handleShare(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await api.documents.share(doc.id, email, permission);
      setSuccess(`Shared with ${res.sharedWith.name}`);
      setEmail('');
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId) {
    await api.documents.unshare(doc.id, userId);
    onUpdate();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Share "{doc.title}"</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleShare} className={styles.form}>
          <div className={styles.row}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              list="user-list"
              className={styles.input}
            />
            <datalist id="user-list">
              {users.map(u => <option key={u.id} value={u.email} label={u.name} />)}
            </datalist>
            <select value={permission} onChange={e => setPermission(e.target.value)} className={styles.select}>
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
            <button type="submit" className={styles.shareBtn} disabled={loading}>
              {loading ? '…' : 'Share'}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
        </form>

        {doc.shares?.length > 0 && (
          <div className={styles.shareList}>
            <h3>Shared with</h3>
            {doc.shares.map(s => (
              <div key={s.id} className={styles.shareRow}>
                <div className={styles.shareAvatar}>{s.name?.[0]?.toUpperCase()}</div>
                <div className={styles.shareInfo}>
                  <span className={styles.shareName}>{s.name}</span>
                  <span className={styles.shareEmail}>{s.email}</span>
                </div>
                <span className={styles.permBadge}>{s.permission}</span>
                <button className={styles.removeBtn} onClick={() => handleRemove(s.shared_with_id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
