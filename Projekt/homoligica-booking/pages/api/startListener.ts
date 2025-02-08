import { NextApiRequest, NextApiResponse } from 'next';
import { listenForNewSlot } from '../../src/app/lib/listenForNewSlot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Starta bakgrundsprocessen för att lyssna på händelser
      listenForNewSlot();
      res.status(200).json({ message: 'Listener started' });
    } catch (error) {
      console.error("Error starting listener:", error);
      res.status(500).json({ message: 'Failed to start listener' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}