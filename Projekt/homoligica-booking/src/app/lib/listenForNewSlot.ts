import { createClient } from '@supabase/supabase-js';
import sendgrid from '@sendgrid/mail';

// Skapa Supabase-klient
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Skicka e-post via SendGrid
sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

const sendEmail = async (email: string, serviceName: string): Promise<void> => {
    const message = {
      to: email,
      from: 'din-epost@domain.com',
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

// Lyssna på händelser från Supabase
export const listenForNewSlot = async () => {
  const channel = supabase
    .channel('new_slot_available')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'available_slots' }, async payload => {
      const { service_id } = payload.new;
      
      // Hämta alla användare som väntar på denna tjänst
      const { data: waitingList, error } = await supabase
        .from('waiting_list')
        .select('email, service_id')
        .eq('service_id', service_id);

      if (error || !waitingList) {
        console.error("Fel vid hämtning av väntelista:", error);
        return;
      }

      // Skicka e-post till alla användare som väntar på denna tjänst
      for (const user of waitingList) {
        await sendEmail(user.email, `Tjänst ${service_id}`);
      }
    })
    .subscribe();
};

// Starta lyssnaren för pg_notify
listenForNewSlot();