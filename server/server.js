import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lostfound';
const JWT_SECRET = process.env.JWT_SECRET || 'demo-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisAdminPassword!123';
const STATIC_DIR = process.env.STATIC_DIR || '../';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Mongo setup
const client = new MongoClient(MONGO_URI);
let db, items;
async function initMongo() {
  await client.connect();
  db = client.db();
  items = db.collection('items');
  await items.createIndex({ title: 'text', description: 'text', location: 'text', category: 1 });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7) : '';
  try { jwt.verify(token, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
}

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.get('/api/items', async (req, res) => {
  const all = await items.find({}).sort({ dateFound: -1 }).toArray();
  res.json({ items: all });
});

app.post('/api/items', requireAuth, async (req, res) => {
  const { title, category, location, dateFound, description, imageData } = req.body || {};
  if (!title || !category || !location || !dateFound || !description) return res.status(400).json({ error: 'Missing fields' });
  const doc = {
    title, category, location, dateFound, description,
    imageData: imageData || null,
    status: 'unclaimed', createdAt: Date.now()
  };
  const r = await items.insertOne(doc);
  res.status(201).json({ _id: r.insertedId, ...doc });
});

app.patch('/api/items/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { toggleStatus } = req.body || {};
  const _id = new ObjectId(id);
  const doc = await items.findOne({ _id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  let update = {};
  if (toggleStatus) update.status = doc.status === 'claimed' ? 'unclaimed' : 'claimed';
  await items.updateOne({ _id }, { $set: update });
  const fresh = await items.findOne({ _id });
  res.json(fresh);
});

app.delete('/api/items/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await items.deleteOne({ _id: new ObjectId(id) });
  res.status(204).end();
});

// Serve static site for convenience (optional)
app.use(express.static(STATIC_DIR));

initMongo().then(() => {
  app.listen(PORT, () => console.log('Server running on http://localhost:'+PORT));
}).catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
