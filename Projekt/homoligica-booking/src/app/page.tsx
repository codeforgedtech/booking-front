'use client';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

const HomePage = () => {
  const [view, setView] = useState<'services' | 'register' | 'login'>('services');
  const [services, setServices] = useState([]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (!error) setServices(data || []);
    };
    fetchServices();
  }, []);

  // Register user
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert('Check your email for confirmation!');
  };

  // Login user
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else alert('Logged in successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Buttons */}
      <div className="bg-white shadow p-6 flex justify-center space-x-6">
        <button
          className={`px-6 py-2 font-semibold rounded-md transition ${
            view === 'services'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setView('services')}
        >
          Services
        </button>
        <button
          className={`px-6 py-2 font-semibold rounded-md transition ${
            view === 'register'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setView('register')}
        >
          Register
        </button>
        <button
          className={`px-6 py-2 font-semibold rounded-md transition ${
            view === 'login'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setView('login')}
        >
          Login
        </button>
      </div>

      {/* Content */}
      <div className="p-8">
        {view === 'services' && (
          <div>
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Our Services</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service: any) => (
                <div
                  key={service.id}
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-200"
                >
                  <h2 className="text-xl font-semibold text-gray-800">{service.name}</h2>
                  <p className="text-gray-600 mt-2">{service.description}</p>
                  <p className="mt-4 text-lg font-bold text-blue-600">Price: ${service.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'register' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Register</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleRegister} className="space-y-6">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </button>
            </form>
          </div>
        )}

        {view === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition"
              >
                Login
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;


