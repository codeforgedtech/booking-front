import { useRouter } from 'next/router'

const ConfirmationPage = () => {
  const router = useRouter()
  const { selectedService, selectedTime, paymentMethod } = router.query;

  // Omvandla `selectedService` från en sträng till ett objekt
  const service = selectedService ? JSON.parse(selectedService as string) : null;

  const handlePayment = () => {
    if (paymentMethod === 'credit_card') {
      router.push('/payment/card')  // Navigera till kortbetalningssidan
    } else if (paymentMethod === 'swish') {
      router.push('/payment/swish')  // Navigera till Swish-betalningssidan
    }
  };

  return (
    <div className="confirmation-page">
      <h1 className="text-center text-3xl font-bold text-blue-600">Bokning Bekräftad</h1>
      <div className="mt-8">
        <p><strong>Tjänst:</strong> {service?.name}</p>
        <p><strong>Pris:</strong> {service?.price} kr</p>
        <p><strong>Tid:</strong> {selectedTime}</p>
        <p><strong>Betalningsmetod:</strong> {paymentMethod === 'credit_card' ? 'Kortbetalning' : 'Swish'}</p>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handlePayment}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Gå till betalning
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPage;

