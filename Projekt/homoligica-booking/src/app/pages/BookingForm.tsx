// components/BookingForm.tsx

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface BookingFormProps {
  selectedService: any;
  closeModal: () => void;
  bookSlot: () => void;
}

const BookingForm = ({ selectedService, closeModal, bookSlot }: BookingFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Om true är login, false är registrering
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMessage(error.message);
    } else {
      bookSlot(); // Vid lyckad inloggning, boka tid
      closeModal(); // Stäng modalen
    }
  };

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setErrorMessage(error.message);
    } else {
      // Skapa en användare i den egna tabellen för kunder
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ name, email, phone }]);
      if (insertError) {
        setErrorMessage(insertError.message);
      } else {
        bookSlot(); // Vid lyckad registrering, boka tid
        closeModal(); // Stäng modalen
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isLogin ? 'Logga in' : 'Skapa konto'}
      </h2>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-postadress
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-lg mt-1"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Lösenord
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-lg mt-1"
        />
      </div>

      {!isLogin && (
        <>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Namn
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefonnummer
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
        </>
      )}

      {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}

      <div className="flex justify-between">
        <button
          onClick={isLogin ? handleLogin : handleRegister}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {isLogin ? 'Logga in' : 'Skapa konto'}
        </button>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 px-4 py-2"
        >
          {isLogin ? 'Har du inget konto? Skapa här' : 'Redan ett konto? Logga in'}
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
