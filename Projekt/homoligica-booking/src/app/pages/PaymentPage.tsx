import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentPage = () => {
  const router = useRouter();
  const { bookingId } = router.query; // Hämta bookingId från URL
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_id, start_time, booking_date, payment_status, service (name, price)')
        .eq('id', bookingId)
        .single();

      if (error) {
        toast.error('Kunde inte hämta bokningsdetaljer.');
      } else {
        setBookingDetails(data);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!bookingDetails) return;

    // Mock för betalning - här kan du integrera en riktig betalningstjänst
    setPaymentStatus('completed');

    // Uppdatera betalningsstatus i databasen
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: 'Completed' })
      .eq('id', bookingId);

    if (error) {
      toast.error('Fel vid betalning.');
    } else {
      toast.success('Betalningen slutförd!');
      router.push('/confirmation'); // Navigera till bekräftelsesidan
    }
  };

  const handleCancel = () => {
    router.push('/'); // Navigera tillbaka till startsidan om användaren avbryter
  };

  if (!bookingDetails) return <p>Laddar bokningsdetaljer...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Betalning</h2>
        <div className="mb-4">
          <p><strong>Tjänst:</strong> {bookingDetails.service.name}</p>
          <p><strong>Datum:</strong> {new Date(bookingDetails.booking_date).toLocaleDateString('sv-SE')}</p>
          <p><strong>Tid:</strong> {bookingDetails.start_time}</p>
          <p><strong>Pris:</strong> {bookingDetails.service.price} kr</p>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handlePayment}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Betala nu
          </button>
          <button
            onClick={handleCancel}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Avbryt
          </button>
        </div>

        {paymentStatus === 'completed' && (
          <div className="mt-4 text-center text-green-600">
            <p>Betalningen har slutförts!</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mt-4 text-center text-red-600">
            <p>Betalningen misslyckades, försök igen.</p>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PaymentPage;