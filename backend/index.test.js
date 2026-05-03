const request = require('supertest');
const app = require('./index');

// Use in-memory DB for tests
process.env.DB_PATH = ':memory:';

describe('Auth', () => {
  it('rejects login with bad credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@x.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('allows login with seeded alice account', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@demo.com', password: 'demo1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe('Documents', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@demo.com', password: 'demo1234' });
    token = res.body.token;
  });

  it('creates a document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Doc', content: '{}' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Doc');
  });

  it('lists owned documents', async () => {
    const res = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.owned)).toBe(true);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });
});
