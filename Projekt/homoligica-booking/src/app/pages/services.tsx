import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Services = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (!error) setServices(data || []);
    };
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service: any) => (
          <div
            key={service.id}
            className="p-4 bg-white rounded shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{service.name}</h2>
            <p className="text-gray-500">{service.description}</p>
            <p className="text-gray-800 font-bold">Price: ${service.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
