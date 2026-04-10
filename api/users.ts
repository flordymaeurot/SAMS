import { readFileSync } from 'fs';
import { join } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Read db.json from the public folder (where it's deployed)
    const dbPath = join(process.cwd(), 'public', 'db.json');
    const dbContent = readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Return users array
    res.status(200).json(db.users || []);
  } catch (error) {
    console.error('Error reading db.json:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
