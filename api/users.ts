import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // User data (embedded)
    const users = [
      {
        "id": 1,
        "user_id": "1",
        "email": "admin@school.com",
        "password": "admin123",
        "role": "admin",
        "first_name": "System",
        "middle_name": "",
        "last_name": "Administrator",
        "full_name": "System Administrator",
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "user_id": "U17757500619505577",
        "email": "jhyletagapulot@edu.com",
        "password": "instructor123",
        "role": "instructor",
        "first_name": "Jhyle",
        "last_name": "Tagapulot",
        "full_name": "Jhyle Tagapulot",
        "created_at": "2026-04-09T15:54:21.950Z",
        "id": 2
      },
      {
        "user_id": "U17758225504255477",
        "email": "sparyani@edu.com",
        "password": "gwapoko123",
        "role": "student",
        "first_name": "Sandeep",
        "last_name": "Paryani",
        "full_name": "Sandeep Paryani",
        "created_at": "2026-04-10T12:02:30.425Z",
        "id": 3
      },
      {
        "user_id": "U17758225506595633",
        "email": "cherryrosed@email.com",
        "password": "parent123",
        "role": "parent",
        "first_name": "Cherry Rose",
        "last_name": "Dalapag",
        "full_name": "Cherry Rose Dalapag",
        "created_at": "2026-04-10T12:02:30.659Z",
        "id": 4
      }
    ];
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
