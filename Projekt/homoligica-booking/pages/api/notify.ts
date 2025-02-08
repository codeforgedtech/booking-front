import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Skapa Supabase-klient
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, service } = req.body;

  // Kontrollera att e-post och tjänst finns
  if (!email || !service) {
    return res.status(400).json({ message: "E-post och tjänst är obligatoriska." });
  }

  try {
    // Lägg till användarens e-post och tjänst i waiting_list
    const { data, error } = await supabase.from("waiting_list").insert([{ email, service_id: service }]);

    if (error) {
      console.error("Supabase insert error:", error.message, error.details);  // Detaljerad loggning
      return res.status(500).json({ message: "Kunde inte lägga till dig i väntelistan.", error: error.message });
    }

    res.status(200).json({ message: "Du kommer få mejl när en tid blir ledig!" });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ message: "Något gick fel, försök igen senare." });
  }
}


