import { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

// Sätt upp SendGrid med din API-nyckel
sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

// Skapa en instans av Supabase-klienten
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const sendEmail = async (email: string, serviceName: string) => {
  const message = {
    to: email,
    from: 'din-epost@domain.com', // Ersätt med din egen e-postadress
    subject: `Din tid för ${serviceName} är tillgänglig!`,
    text: `Hej!\n\nDin bokning för ${serviceName} har blivit tillgänglig. Vänligen boka din tid via vår webbplats.\n\nVänliga hälsningar,\nDitt Företag`,
    html: `<p>Hej!</p><p>Din bokning för <strong>${serviceName}</strong> har blivit tillgänglig. Vänligen boka din tid via vår webbplats.</p><p>Vänliga hälsningar,<br/>Ditt Företag</p>`,
  };

  try {
    await sendgrid.send(message);
    console.log('E-post skickat!');
  } catch (error) {
    console.error('Fel vid e-postsändning:', error);
    throw new Error('Fel vid sändning av e-post.');
  }
};

// Funktion som kollar efter nya tider och skickar e-post
const sendNotificationsForAvailableTime = async (serviceId: string, serviceName: string) => {
  // Hämta alla användare som väntar på denna tjänst
  const { data: waitingList, error } = await supabase
    .from('waiting_list')
    .select('email')
    .eq('service_id', serviceId);

  if (error || !waitingList) {
    console.error("Fel vid hämtning av väntelista:", error);
    return;
  }

  // Skicka e-post till alla användare i väntelistan
  for (const user of waitingList) {
    await sendEmail(user.email, serviceName);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metod ej tillåten' });
  }

  const { serviceId, serviceName } = req.body;

  try {
    // Kalla funktionen för att skicka e-post till användare på väntelistan
    await sendNotificationsForAvailableTime(serviceId, serviceName);
    res.status(200).json({ message: 'E-post skickade till väntande användare!' });
  } catch (error) {
    console.error('Fel vid att skicka e-post:', error);
    res.status(500).json({ message: 'Fel vid sändning av e-post.' });
  }
}
