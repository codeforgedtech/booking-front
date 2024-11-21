'use client';
import bcrypt from 'bcryptjs';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from './lib/supabase';
import 'react-calendar/dist/Calendar.css';

if (typeof window !== 'undefined') {
  Modal.setAppElement(document.body);
}

const HomePage = () => {
  const [categories, setCategories] = useState([]); 
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedService, setSelectedService] = useState<any | null>(null); 
  const [availableSlots, setAvailableSlots] = useState<any[]>([]); 
  const [selectedTime, setSelectedTime] = useState<string | null>(null); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 
  const [user, setUser] = useState<any | null>(null); 

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('id, name, services (id, name, description, price)');
      if (!error) setCategories(data || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const openBookingModal = async (service: any) => {
    if (!user) {
      alert('Logga in för att boka en tid.');
      setIsLoginModalOpen(true);
      return;
    }

    setSelectedService(service);
    const { data, error } = await supabase
      .from('available_slots')
      .select('id, date, start_time, end_time')
      .eq('service_id', service.id)
      .eq('is_booked', false); 
    if (!error) {
      setAvailableSlots(data || []); 
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
    setAvailableSlots([]); 
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(event.target.value);
  };

  const bookSlot = async () => {
    if (!selectedTime || !selectedService) return;
  
    // Hitta den valda tiden i availableSlots
    const selectedSlot = availableSlots.find((slot) => slot.start_time === selectedTime);
  
    if (!selectedSlot) return;
  
    // Hämta den aktuella användaren
    const { data: user, error: userError } = await supabase.auth.getUser();
  
    if (userError || !user) {
      alert('Du måste vara inloggad för att boka en tid.');
      return;
    }
  
    const userId = user.id; // Användarens UUID
  
    const bookingData = {
      customer_id: userId, // Inloggad användare
      service_id: selectedService.id,
      booking_date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      status: 'Confirmed', // Standardvärde
      payment_status: 'Pending', // Standardvärde
      employee_id: null, // Justera detta om en specifik anställd ska kopplas
    };
  
    // Lägg till bokningen i 'bookings'-tabellen
    const { error: bookingError } = await supabase.from('bookings').insert([bookingData]);
  
    if (bookingError) {
      console.error('Kunde inte skapa bokning:', bookingError);
      alert('Det gick inte att boka tiden. Försök igen.');
      return;
    }
  
    // Markera tiden som bokad i 'available_slots'
    const { error: slotError } = await supabase
      .from('available_slots')
      .update({ is_booked: true })
      .eq('id', selectedSlot.id);
  
    if (slotError) {
      console.error('Kunde inte uppdatera slot:', slotError);
      alert('Bokningen registrerades men tiden kunde inte markeras som bokad.');
    } else {
      alert('Bokningen är bekräftad!');
      closeModal(); // Stäng modal efter lyckad bokning
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Fel vid inloggning: ' + error.message);
    } else {
      alert('Inloggad!');
      setIsLoginModalOpen(false);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Boka tjänst</h1>
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          {categories.map((category) => (
            <div key={category.id}>
              <button
                className="w-full flex justify-between items-center p-4 text-left bg-blue-50 hover:bg-blue-100 transition"
                onClick={() => toggleCategory(category.id)}
              >
                <span className="text-lg font-semibold text-gray-800">{category.name}</span>
                <span
                  className={`transition-transform transform ${expandedCategory === category.id ? 'rotate-180' : ''}`}
                >
                  ⬇️
                </span>
              </button>
              {expandedCategory === category.id && (
                <div className="bg-gray-50">
                  {category.services.map((service: any) => (
                    <div key={service.id} className="p-4 border-t border-gray-200 hover:bg-gray-100">
                      <h3 className="text-md font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-blue-600 font-bold mt-2">Pris: {service.price} kr</p>
                      <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        onClick={() => openBookingModal(service)}
                      >
                        Boka
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
  <Modal
    isOpen={isModalOpen}
    onRequestClose={closeModal}
    className="bg-white rounded-lg p-8 shadow-lg max-w-xl mx-auto mt-16"
    overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center"
  >
    <h2 className="text-2xl font-bold text-center mb-4 text-blue-600">{selectedService.name}</h2>
    <div className="text-center mb-4">
      <p className="text-blue-600 font-bold mt-2">Pris: {selectedService.price} kr</p>
    </div>

    {availableSlots.length > 0 ? (
  <div className="mb-4">
    <p className="text-center text-black font-semibold mt-4">Välj tid</p>
    <select
      onChange={handleTimeChange}
      value={selectedTime || ''}
      className="w-full p-2 border rounded-lg mb-4 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400"
    >
      <option value="" className="text-gray-400">
        Välj en tid
      </option>
      {availableSlots.map((slot: any) => {
        const slotDate = new Date(slot.date);
        const formattedDate = slotDate.toLocaleDateString('sv-SE', {
          day: '2-digit',
          month: 'short',
        });
        
        // Format tiden utan sekunder
        const formattedStartTime = new Date(`1970-01-01T${slot.start_time}Z`).toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const formattedEndTime = new Date(`1970-01-01T${slot.end_time}Z`).toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const formattedTime = `${formattedStartTime} till ${formattedEndTime}`;
        return (
          <option key={slot.id} value={slot.start_time} className="text-gray-700 hover:bg-blue-50">
            {`${formattedDate} - ${formattedTime}`}
          </option>
        );
      })}
    </select>
  </div>
) : (
  <p className="text-center text-gray-600">Inga lediga tider för denna tjänst.</p>
)}

    <div className="flex justify-between mt-4">
      <button
        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
        onClick={closeModal}
      >
        Stäng
      </button>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        onClick={bookSlot}
      >
        Boka Tid
      </button>
    </div>
  </Modal>
)}

      {/* Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onRequestClose={() => setIsLoginModalOpen(false)}
        className="bg-white rounded-lg p-8 shadow-lg max-w-xl mx-auto mt-16"
      >
        <h2 className="text-xl font-bold mb-4">Logga in</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as any;
            handleLogin(form.email.value, form.password.value);
          }}
        >
          <input name="email" type="email" placeholder="E-post" required className="mb-4 w-full p-2 border rounded-lg" />
          <input name="password" type="password" placeholder="Lösenord" required className="mb-4 w-full p-2 border rounded-lg" />
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Logga in</button>
        </form>
      </Modal>

      {/* Register Modal */}
      <Modal
  isOpen={isRegisterModalOpen}
  onRequestClose={() => setIsRegisterModalOpen(false)}
  className="bg-white rounded-lg p-8 shadow-lg max-w-xl mx-auto mt-16"
>
  <h2 className="text-xl font-bold mb-4">Registrera</h2>
 
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const form = e.target as any;
      const name = form.name.value;
      const phone = form.phone.value;
      const email = form.email.value;
      const password = form.password.value;

      try {
        // Skapa användaren i Supabase Auth
        const { data: user, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert('Fel vid registrering: ' + error.message);
          return;
        }

        // Hasha lösenordet med bcrypt
        const passwordHash = bcrypt.hashSync(password, 10);

        // Lägg till användaren i users-tabellen
        const { error: userInsertError } = await supabase.from('users').insert([
          {
            id: user?.user?.id, // UUID från Auth
            email: email,
            password_hash: passwordHash, // Sparar hashen
            role: 'user', // Roll som "user"
            created_at: new Date().toISOString(), // Tidsstämpel för skapande
            display_name: name,
            phone_number: phone,
          },
        ]);

        if (userInsertError) {
          alert('Fel vid sparning av användaruppgifter: ' + userInsertError.message);
        } else {
          alert('Registrerad! Logga in för att fortsätta.');
          setIsRegisterModalOpen(false);
        }
      } catch (err) {
        console.error('Ett fel uppstod:', err);
        alert('Ett oväntat fel inträffade, vänligen försök igen.');
      }
    }}
  >
    <input
      name="name"
      type="text"
      placeholder="Namn"
      required
      className="mb-4 w-full p-2 border rounded-lg"
    />
    <input
      name="phone"
      type="text"
      placeholder="Telefonnummer"
      required
      className="mb-4 w-full p-2 border rounded-lg"
    />
    <input
      name="email"
      type="email"
      placeholder="E-post"
      required
      className="mb-4 w-full p-2 border rounded-lg"
    />
    <input
      name="password"
      type="password"
      placeholder="Lösenord"
      required
      className="mb-4 w-full p-2 border rounded-lg"
    />
    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
      Registrera
    </button>
  </form>
</Modal>

      <div className="flex justify-end p-4">
        {user ? (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            onClick={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          >
            Logga ut
          </button>
        ) : (
          <>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-700"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Logga in
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Registrera
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;







