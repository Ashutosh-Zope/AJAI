import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import ShareModal from '../components/ShareModal';
import AttachPanel from '../components/AttachPanel';
import styles from './Editor.module.css';

const AUTOSAVE_DELAY = 1500;

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const saveTimer = useRef(null);
  const isOwner = doc?.owner_id === user?.id;
  const canEdit = isOwner || doc?.role === 'edit';

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    editorProps: {
      attributes: { class: 'ProseMirror' },
    },
    onUpdate: ({ editor }) => {
      if (!canEdit) return;
      setSaveState('unsaved');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(editor.getJSON()), AUTOSAVE_DELAY);
    },
  });

  async function load() {
    try {
      const data = await api.documents.get(id);
      setDoc(data);
      setTitle(data.title);
      if (editor && data.content) {
        try {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          editor.commands.setContent(parsed, false);
        } catch {
          editor.commands.setContent(data.content, false);
        }
      }
    } catch (e) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (editor) load();
  }, [editor, id]);

  // Set editable based on permissions
  useEffect(() => {
    if (editor && doc) {
      editor.setEditable(canEdit);
    }
  }, [editor, doc, canEdit]);

  const save = useCallback(async (content) => {
    setSaveState('saving');
    try {
      await api.documents.update(id, { content });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, [id]);

  async function handleTitleBlur() {
    if (!title.trim()) setTitle(doc?.title || 'Untitled Document');
    else if (title !== doc?.title) {
      await api.documents.update(id, { title });
      setDoc(d => ({ ...d, title }));
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.target.blur();
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #e8e4de', borderTopColor: '#1a1612', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} title="Back to documents">
            ←
          </button>
          {canEdit ? (
            <input
              className={styles.titleInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Untitled Document"
            />
          ) : (
            <span className={styles.titleStatic}>{title}</span>
          )}
          <span className={styles.saveState}>
            {saveState === 'saving' && '○ Saving…'}
            {saveState === 'saved' && '● Saved'}
            {saveState === 'unsaved' && '○ Unsaved'}
          </span>
        </div>
        <div className={styles.headerRight}>
          {!canEdit && <span className={styles.viewBadge}>View only</span>}
          {isOwner && (
            <button className={styles.shareBtn} onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
          <button className={styles.attachBtn} onClick={() => setShowAttach(s => !s)} title="Attachments">
            📎 {doc?.attachments?.length > 0 ? doc.attachments.length : ''}
          </button>
        </div>
      </header>

      {canEdit && <Toolbar editor={editor} />}

      <div className={styles.page}>
        <EditorContent editor={editor} className={styles.editorWrap} />
      </div>

      {showShare && (
        <ShareModal doc={doc} onClose={() => setShowShare(false)} onUpdate={load} />
      )}
      {showAttach && (
        <AttachPanel doc={doc} canEdit={canEdit} onClose={() => setShowAttach(false)} onUpdate={load} />
      )}
    </div>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;

  const btn = (label, action, active) => (
    <button
      key={label}
      className={`${styles.toolBtn} ${active ? styles.toolActive : ''}`}
      onClick={action}
      title={label}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolGroup}>
        {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      </div>
      <div className={styles.divider} />
      <div className={styles.toolGroup}>
        {['H1','H2','H3'].map((h, i) => btn(h,
          () => editor.chain().focus().toggleHeading({ level: i + 1 }).run(),
          editor.isActive('heading', { level: i + 1 })
        ))}
      </div>
      <div className={styles.divider} />
      <div className={styles.toolGroup}>
        {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      </div>
    </div>
  );
}
