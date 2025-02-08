import { useRouter } from 'next/router';

const SwishPaymentPage = () => {
  const router = useRouter();
  const { selectedService, selectedTime } = router.query;

  const service = selectedService ? JSON.parse(String(selectedService)) : null;

  return (
    <div className="payment-page">
      <h1 className="text-3xl font-bold text-center text-blue-600">Swish-betalning</h1>
      <p><strong>Tjänst:</strong> {service?.name}</p>
      <p><strong>Pris:</strong> {service?.price} kr</p>
      <p><strong>Tid:</strong> {selectedTime}</p>

      <button className="bg-green-500 text-white p-3 rounded mt-4">Betala med Swish</button>
    </div>
  );
};

export default SwishPaymentPage;