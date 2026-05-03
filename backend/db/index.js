const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      content TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      shared_with_id TEXT NOT NULL REFERENCES users(id),
      permission TEXT NOT NULL DEFAULT 'view',
      created_at INTEGER DEFAULT (unixepoch()),
      UNIQUE(document_id, shared_with_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  // Seed demo users
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@demo.com');
  if (!existing) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const hash = bcrypt.hashSync('demo1234', 10);

    const users = [
      { id: uuidv4(), email: 'alice@demo.com', name: 'Alice Chen', hash },
      { id: uuidv4(), email: 'bob@demo.com', name: 'Bob Smith', hash },
      { id: uuidv4(), email: 'carol@demo.com', name: 'Carol Davis', hash },
    ];

    const insert = db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)');
    users.forEach(u => insert.run(u.id, u.email, u.name, u.hash));

    // Seed a sample document for alice
    const alice = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@demo.com');
    const docId = uuidv4();
    db.prepare(`INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)`)
      .run(docId, 'Welcome to Ajaia Docs', JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to Ajaia Docs ✨' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'This is your collaborative document editor. You can format text with ' }, { type: 'text', marks: [{ type: 'bold' }], text: 'bold' }, { type: 'text', text: ', ' }, { type: 'text', marks: [{ type: 'italic' }], text: 'italic' }, { type: 'text', text: ', and ' }, { type: 'text', marks: [{ type: 'underline' }], text: 'underline' }, { type: 'text', text: '.' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create and edit documents' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Share with teammates' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Upload files and attachments' }] }] },
          ]},
        ]
      }), alice.id);
  }
}

module.exports = { getDb };
