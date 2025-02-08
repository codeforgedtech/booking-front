import { useRouter } from 'next/router';

const CardPaymentPage = () => {
  const router = useRouter();
  const { selectedService, selectedTime } = router.query;

  const service = selectedService ? JSON.parse(String(selectedService)) : null;

  return (
    <div className="payment-page">
      <h1 className="text-3xl font-bold text-center text-blue-600">Kortbetalning</h1>
      <p><strong>Tjänst:</strong> {service?.name}</p>
      <p><strong>Pris:</strong> {service?.price} kr</p>
      <p><strong>Tid:</strong> {selectedTime}</p>

      <button className="bg-green-500 text-white p-3 rounded mt-4">Betala nu</button>
    </div>
  );
};
export default CardPaymentPage;