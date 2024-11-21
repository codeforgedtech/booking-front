import { useRouter } from 'next/router';
import { useState } from 'react';
import { supabase } from './lib/supabase';

const BookingDetails = () => {
  const router = useRouter();
  const { serviceId, selectedDate, selectedTime, slotId } = router.query;  // Hämta query-parametrarna

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Om användaren inte är inloggad, spara deras uppgifter i databasen
    const { data, error } = await supabase.from('customers').upsert([{ name, phone, email }]);
    if (error) {
      alert('Kunde inte spara användardata');
      return;
    }

    // Uppdatera bokningens status till "Bokad" i databasen
    const { error: updateError } = await supabase
      .from('available_slots')
      .update({ is_booked: true })
      .eq('id', slotId);  // Använd slotId för att uppdatera rätt slot

    if (updateError) {
      alert('Bokning misslyckades');
    } else {
      alert('Bokningen är slutförd!');
      router.push('/home'); // Om du vill gå tillbaka till startsidan efter bokningen
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-center mb-4">Fyll i dina uppgifter</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-gray-700">Namn</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-gray-700">Telefonnummer</label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-gray-700">E-post</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            onClick={() => router.push('/home')} // Gå tillbaka om användaren inte vill fylla i
          >
            Avbryt
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Bekräfta
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingDetails;

