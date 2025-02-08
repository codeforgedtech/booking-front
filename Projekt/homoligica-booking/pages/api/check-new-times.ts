import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Anslut till Supabase
const supabase = createClient(
    process.env.EXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hämta lediga tider som EJ är bokade och skapades de senaste 10 minuterna
  const { data: newTimes, error } = await supabase
    .from("available_slots")
    .select("id, service_id, date, start_time, end_time")
    .eq("is_booked", false) // Endast lediga tider
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Tider skapade de senaste 10 minuterna

  if (error) return res.status(500).json({ error: error.message });

  if (newTimes.length > 0) {
    for (const time of newTimes) {
      // Hämta alla som väntar på en tid för denna tjänst
      const { data: waitingUsers } = await supabase
        .from("waiting_list") // Tabell där användare registrerat sig för notiser
        .select("email")
        .eq("service_id", time.service_id);

      if (waitingUsers?.length) {
        for (const user of waitingUsers) {
          await resend.emails.send({
            from: "noreply@codeforged.se",
            to: user.email,
            subject: "Ny ledig tid tillgänglig!",
            html: `<p>Hej! En ny tid finns tillgänglig den ${time.date} mellan ${time.start_time} - ${time.end_time}. <a href="https://dinhemsida.com/boka">Boka nu</a>!</p>`,
          });
        }
      }
    }
  }

  res.status(200).json({ message: "Kollat efter nya tider." });
}