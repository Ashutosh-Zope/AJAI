const router = require('express').Router();
const { getDb } = require('../db');
const { auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// List all documents accessible to the user
router.get('/', auth, (req, res) => {
  const db = getDb();
  const owned = db.prepare(`
    SELECT d.*, 'owner' as role, u.name as owner_name
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  const shared = db.prepare(`
    SELECT d.*, ds.permission as role, u.name as owner_name
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON u.id = d.owner_id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  res.json({ owned, shared });
});

// Create document
router.post('/', auth, (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { title = 'Untitled Document', content = '' } = req.body;
  db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)')
    .run(id, title, typeof content === 'string' ? content : JSON.stringify(content), req.user.id);
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json(doc);
});

// Get single document (owner or shared)
router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const doc = db.prepare(`
    SELECT d.*, u.name as owner_name,
      CASE WHEN d.owner_id = ? THEN 'owner'
           ELSE (SELECT permission FROM document_shares WHERE document_id = d.id AND shared_with_id = ?)
      END as role
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.id = ?
  `).get(req.user.id, req.user.id, req.params.id);

  if (!doc || !doc.role) return res.status(404).json({ error: 'Document not found' });

  const shares = db.prepare(`
    SELECT ds.*, u.email, u.name FROM document_shares ds
    JOIN users u ON u.id = ds.shared_with_id
    WHERE ds.document_id = ?
  `).all(req.params.id);

  const attachments = db.prepare('SELECT * FROM attachments WHERE document_id = ?').all(req.params.id);

  res.json({ ...doc, shares, attachments });
});

// Update document
router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const canEdit = doc.owner_id === req.user.id ||
    db.prepare("SELECT id FROM document_shares WHERE document_id=? AND shared_with_id=? AND permission='edit'")
      .get(req.params.id, req.user.id);

  if (!canEdit) return res.status(403).json({ error: 'No edit permission' });

  const { title, content } = req.body;
  const updates = [];
  const vals = [];
  if (title !== undefined) { updates.push('title = ?'); vals.push(title); }
  if (content !== undefined) { updates.push('content = ?'); vals.push(typeof content === 'string' ? content : JSON.stringify(content)); }
  updates.push('updated_at = unixepoch()');
  vals.push(req.params.id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  res.json(db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id));
});

// Delete document (owner only)
router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc || doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Share document
router.post('/:id/share', auth, (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc || doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can share' });

  const { email, permission = 'view' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const target = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  const id = uuidv4();
  try {
    db.prepare('INSERT INTO document_shares (id, document_id, shared_with_id, permission) VALUES (?, ?, ?, ?)')
      .run(id, req.params.id, target.id, permission);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      db.prepare('UPDATE document_shares SET permission=? WHERE document_id=? AND shared_with_id=?')
        .run(permission, req.params.id, target.id);
    } else throw e;
  }

  res.json({ ok: true, sharedWith: { id: target.id, name: target.name, email: target.email, permission } });
});

// Remove share
router.delete('/:id/share/:userId', auth, (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc || doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM document_shares WHERE document_id=? AND shared_with_id=?').run(req.params.id, req.params.userId);
  res.json({ ok: true });
});

// List users (for sharing autocomplete)
router.get('/:id/users', auth, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, email, name FROM users WHERE id != ?').all(req.user.id);
  res.json(users);
});

module.exports = router;
