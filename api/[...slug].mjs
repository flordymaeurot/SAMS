import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));

function getDbPath() {
  let dbPath = path.join(__dir, '..', 'db.json');
  if (!fs.existsSync(dbPath)) {
    dbPath = path.join(process.cwd(), 'db.json');
  }
  if (!fs.existsSync(dbPath)) {
    dbPath = '/var/task/db.json'; // Vercel's function directory
  }
  return dbPath;
}

function readDb() {
  try {
    const dbPath = getDbPath();
    console.log('Reading db from:', dbPath);
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err.message);
    return { users: [], subjects: [], students: [], instructors: [], departments: [], parents: [], enrollments: [], attendance: [] };
  }
}

function writeDb(db) {
  try {
    const dbPath = getDbPath();
    console.log('Writing db to:', dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Successfully wrote db.json');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err.message);
    return false;
  }
}

function getNextId(collection) {
  if (!collection || collection.length === 0) return 1;
  return Math.max(...collection.map(item => item.id || 0)) + 1;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Request:', req.method, req.url);
    
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    
    // Remove /api prefix and split path
    let path1 = pathname.replace(/^\/api\/?/, '').split('?')[0];
    const segments = path1.split('/').filter(s => s);
    
    console.log('Path segments:', segments);
    
    if (segments.length === 0) {
      const db = readDb();
      return res.status(200).json(db);
    }
    
    const [collection, itemId] = segments;
    console.log('Collection:', collection, 'ID:', itemId);
    
    const db = readDb();
    
    if (!db[collection]) {
      return res.status(404).json({ error: 'Collection not found', collection, available: Object.keys(db) });
    }

    // GET: Fetch items
    if (req.method === 'GET') {
      if (itemId) {
        const item = db[collection].find(i => String(i.id) === String(itemId));
        return res.status(item ? 200 : 404).json(item || { error: 'Item not found' });
      } else {
        return res.status(200).json(db[collection]);
      }
    }

    // POST: Create new item
    if (req.method === 'POST') {
      let body = '';
      
      // Collect request body
      await new Promise((resolve, reject) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
        req.on('error', reject);
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      const newItem = JSON.parse(body || '{}');
      
      // Auto-generate ID if not provided
      if (!newItem.id) {
        newItem.id = getNextId(db[collection]);
      }
      
      db[collection].push(newItem);
      
      if (writeDb(db)) {
        return res.status(201).json(newItem);
      } else {
        return res.status(500).json({ error: 'Failed to save to database' });
      }
    }

    // PUT: Update existing item
    if (req.method === 'PUT') {
      if (!itemId) {
        return res.status(400).json({ error: 'ID required for PUT' });
      }

      let body = '';
      
      await new Promise((resolve, reject) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
        req.on('error', reject);
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });

      const updateData = JSON.parse(body || '{}');
      const index = db[collection].findIndex(i => String(i.id) === String(itemId));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      db[collection][index] = { ...db[collection][index], ...updateData, id: itemId };
      
      if (writeDb(db)) {
        return res.status(200).json(db[collection][index]);
      } else {
        return res.status(500).json({ error: 'Failed to save to database' });
      }
    }

    // DELETE: Remove item
    if (req.method === 'DELETE') {
      if (!itemId) {
        return res.status(400).json({ error: 'ID required for DELETE' });
      }

      const index = db[collection].findIndex(i => String(i.id) === String(itemId));
      
      if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const deletedItem = db[collection][index];
      db[collection].splice(index, 1);
      
      if (writeDb(db)) {
        return res.status(200).json({ message: 'Item deleted', item: deletedItem });
      } else {
        return res.status(500).json({ error: 'Failed to save to database' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
