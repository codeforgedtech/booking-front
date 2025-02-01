/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from './lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface Category {
  id: number;
  name: string;
  services: { id: number; name: string; description: string; price: number }[];
}
if (typeof window !== 'undefined') {
  Modal.setAppElement(document.body);
}



const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedService, setSelectedService] = useState<any | null>(null); 
  const [availableSlots, setAvailableSlots] = useState<any[]>([]); 
  const [selectedTime, setSelectedTime] = useState<string | null>(null); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 
  const [user, setUser] = useState<any | null>(null); 
  const [openHours, setOpenHours] = useState<any[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, services (id, name, description, price)');
  
      if (!error && Array.isArray(data)) {
        // Format the data into the correct structure
        const formattedData: Category[] = data.map(category => ({
          id: category.id,
          name: category.name,
          services: Array.isArray(category.services) ? category.services : [],
        }));
  
        // Set the state with the formatted data
        setCategories(formattedData);
      }
    };
  
    fetchCategories();
  }, []);

  const fetchOpenHours = async () => {
    const { data, error } = await supabase
      .from('open_hours')
      .select('day, open_time, close_time'); // Vi hämtar öppettider utan att specificera service_id
  
    if (error) {
      console.error("Error fetching open hours:", error);
    } else {
      setOpenHours(data || []); // Uppdatera state med öppettiderna
    }
  };
  useEffect(() => {
    fetchOpenHours(); // Hämta öppettider när komponenten laddas
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
      toast.info(
        <div>
          <span>Du måste vara inloggad för att boka en tid.</span>
          <button 
            onClick={() => {
              setIsLoginModalOpen(true); // Öppnar inloggningsmodalen
              toast.dismiss(); // Stänger toasten när användaren klickar
            }}
            style={{ color: 'blue', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Logga in
          </button>
        </div>, 
        { autoClose: false } // Gör så att toasten inte försvinner automatiskt
      );
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
  
    // Hämta den aktuella användaren från Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser();
  
    if (userError || !userData) {
      toast('Du måste vara inloggad för att boka en tid.');
      return;
    }
  
    const userId = userData.user.id; // Användarens UUID
  
    console.log("User ID:", userId); // Debugging: logga användarens ID för att säkerställa att det hämtas korrekt
  
    // Hämta användardata från 'users' tabellen
    const { data: userInfo, error: userFetchError } = await supabase
  .from('customers')
  .select('id, name, phone, email')  // Specifika fält som ska hämtas
  .eq('id', userId)
  .single();

if (userFetchError || !userInfo) {
  toast.error('Kunde inte hämta användardata. Försök igen.');
  return;
}
  
    console.log("User Info:", userInfo); // Debugging: logga användardata
  
    const bookingData = {
      customer_id: userInfo.id, // Inloggad användare från users-tabellen
      service_id: selectedService.id,
      booking_date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      status: 'Confirmed', // Standardvärde
      payment_status: 'Pending', // Standardvärde
      employee_id: null, // Justera detta om en specifik anställd ska kopplas
    };
  
    console.log("Booking Data:", bookingData); // Debugging: logga bokningsdata för att kontrollera att customer_id är korrekt
  
    // Lägg till bokningen i 'bookings'-tabellen
    const { error: bookingError } = await supabase.from('bookings').insert([bookingData]);
  
    if (bookingError) {
      console.error('Kunde inte skapa bokning:', bookingError);
      toast.warning('Det gick inte att boka tiden. Försök igen.');
      return;
    }
  
    // Markera tiden som bokad i 'available_slots'
    const { error: slotError } = await supabase
      .from('available_slots')
      .update({ is_booked: true })
      .eq('id', selectedSlot.id);
  
    if (slotError) {
      console.error('Kunde inte uppdatera slot:', slotError);
      toast.warning('Bokningen registrerades men tiden kunde inte markeras som bokad.');
    } else {
      toast.success('Bokningen är bekräftad!');
      closeModal(); // Stäng modal efter lyckad bokning
    }
  };
    {/* Veckodagsordning */}
    const daysOfWeek = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

    {/* Sortering av openHours */}
    const sortedOpenHours = openHours.sort((a, b) => {
      const dayA = daysOfWeek.indexOf(a.day);
      const dayB = daysOfWeek.indexOf(b.day);
      return dayA - dayB;
    });
  
  

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('Fel vid inloggning: ' + error.message);
    } else {
      toast.success('Inloggad!');
      setIsLoginModalOpen(false);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }
  };


  return (
    
<div className="min-h-screen bg-gray-100">
<div className="flex justify-end p-4  max-w-7xl mx-auto">
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
  <div className="p-6">
    <div className="mt-2">
      {/* Flex container för att visa logotyp, text och öppettider/kategorier */}
      <div className="flex flex-col md:flex-row gap-8 justify-center max-w-7xl mx-auto">
        {/* Sektion för logotyp och text */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex-1">
          <div className="flex flex-col items-center md:items-start">
            {/* Logotyp */}
            <img
              src="https://www.homologica.se/____impro/1/onewebmedia/logga-NY-homologica.png?etag=%224be7-5f4f8212%22&sourceContentType=image%2Fpng&ignoreAspectRatio&resize=373%2B184" // Byt ut med din logotypens sökväg
              alt="Homologica Logotyp"
              className="w-full mb-4" // Ställ in önskad storlek på logotypen
            />
            {/* Texten */}
            <p className="text-gray-600 text-lg mb-4 text-center md:text-left">
              Välkommen till Homologicas on-line-bokning. Är du tveksam vad du ska boka så kan du få personlig service måndag, tisdag och torsdagar mellan kl 10-18 på telefonnummer 029021020.
            </p>
          </div>
        </div>

        {/* Öppettider */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 flex-1 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Öppettider
          </h2>
          {sortedOpenHours.length > 0 ? (
            sortedOpenHours.map((hour) => (
              <p key={hour.id} className="text-gray-600 hover:text-blue-600 transition duration-300 ease-in-out mb-4">
                <span className="font-semibold text-gray-700">{hour.day}</span>: {hour.open_time} - {hour.close_time}
              </p>
            ))
          ) : (
            <p className="text-gray-500">Inga öppettider tillgängliga</p>
          )}
        </div>
      </div>

      {/* Kategorier */}
      <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200 center max-w-7xl mx-auto">
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
          toast.error('Fel vid registrering: ' + error.message);
          return;
        }

        const { error: userInsertError } = await supabase.from('customers').insert([
          {
            id: user?.user?.id, // UUID från Auth
            email: email,
            
            created_at: new Date().toISOString(), // Tidsstämpel för skapande
            name: name,
            phone: phone,
          },
        ]);

        if (userInsertError) {
          toast.error('Fel vid sparning av användaruppgifter: ' + userInsertError.message);
        } else {
        toast.success('Registrerad! Logga in för att fortsätta.');
          setIsRegisterModalOpen(false);
        }
      } catch (err) {
        console.error('Ett fel uppstod:', err);
        toast.warning('Ett oväntat fel inträffade, vänligen försök igen.');
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
<ToastContainer />
     
    </div>
  );
};

export default HomePage;







