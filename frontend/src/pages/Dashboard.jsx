import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDistanceToNow } from 'date-fns';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const importRef = useRef();

  async function load() {
    try {
      const data = await api.documents.list();
      setOwned(data.owned);
      setShared(data.shared);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createDoc() {
    setCreating(true);
    try {
      const doc = await api.documents.create({ title: 'Untitled Document' });
      navigate(`/doc/${doc.id}`);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const doc = await api.upload.import(file);
      navigate(`/doc/${doc.id}`);
    } catch (err) {
      setError(err.message);
      setImporting(false);
    }
  }

  async function deleteDoc(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    await api.documents.delete(id);
    load();
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>A</span>
            <span className={styles.logoText}>jaia <em>Docs</em></span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userName}>{user?.name}</span>
            <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.actions}>
          <button className={styles.createBtn} onClick={createDoc} disabled={creating}>
            <span className={styles.createIcon}>+</span>
            {creating ? 'Creating…' : 'New document'}
          </button>
          <button className={styles.importBtn} onClick={() => importRef.current.click()} disabled={importing}>
            {importing ? 'Importing…' : '↑ Import file'}
          </button>
          <input ref={importRef} type="file" accept=".txt,.md,.json" hidden onChange={handleImport} />
          <p className={styles.importNote}>Supports .txt, .md, .json</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <div className={styles.loader}><div className={styles.spin} /></div>
        ) : (
          <>
            <Section title="My Documents" docs={owned} onOpen={(id) => navigate(`/doc/${id}`)} onDelete={deleteDoc} showDelete />
            <Section title="Shared with me" docs={shared} onOpen={(id) => navigate(`/doc/${id}`)} badge="shared" />
            {owned.length === 0 && shared.length === 0 && (
              <div className={styles.empty}>
                <p>No documents yet.</p>
                <p>Create your first document or import a file to get started.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, docs, onOpen, onDelete, showDelete, badge }) {
  if (!docs.length) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.grid}>
        {docs.map((doc, i) => (
          <DocCard key={doc.id} doc={doc} onOpen={onOpen} onDelete={onDelete}
            showDelete={showDelete} badge={badge} style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </section>
  );
}

function DocCard({ doc, onOpen, onDelete, showDelete, badge, style }) {
  return (
    <div className={styles.card} style={style} onClick={() => onOpen(doc.id)}>
      <div className={styles.cardIcon}>📄</div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{doc.title}</h3>
        <p className={styles.cardMeta}>
          {badge && <span className={styles.badge}>{doc.role}</span>}
          {doc.owner_name && !badge && <span>by {doc.owner_name}</span>}
          {doc.updated_at && (
            <span>{formatDistanceToNow(new Date(doc.updated_at * 1000), { addSuffix: true })}</span>
          )}
        </p>
      </div>
      {showDelete && (
        <button className={styles.deleteBtn} onClick={(e) => onDelete(doc.id, e)} title="Delete">×</button>
      )}
    </div>
  );
}
