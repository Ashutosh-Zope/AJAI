const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db');
const { auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, and .json files are supported'));
    }
  },
});

// Upload file as new document
router.post('/import', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = fs.readFileSync(req.file.path, 'utf-8');
  const title = path.basename(req.file.originalname, path.extname(req.file.originalname));

  // Convert plain text to basic Tiptap JSON
  const paragraphs = text.split('\n').filter(l => l.trim()).map(line => ({
    type: 'paragraph',
    content: [{ type: 'text', text: line }],
  }));

  const content = JSON.stringify({ type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] });

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)')
    .run(id, title, content, req.user.id);

  // Clean up temp file
  fs.unlinkSync(req.file.path);

  res.status(201).json(db.prepare('SELECT * FROM documents WHERE id = ?').get(id));
});

// Upload attachment to a document
router.post('/attach/:docId', auth, upload.single('file'), (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const canEdit = doc.owner_id === req.user.id ||
    db.prepare("SELECT id FROM document_shares WHERE document_id=? AND shared_with_id=? AND permission='edit'")
      .get(req.params.docId, req.user.id);
  if (!canEdit) return res.status(403).json({ error: 'No edit permission' });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const id = uuidv4();
  db.prepare('INSERT INTO attachments (id, document_id, filename, original_name, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.docId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  res.status(201).json({ id, filename: req.file.filename, original_name: req.file.originalname, size: req.file.size });
});

module.exports = router;
