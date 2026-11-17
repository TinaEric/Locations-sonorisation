import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../../booking/components/DateRangePicker';
import { useBooking } from '../../booking/context/BookingContext';

export default function FinalCTA() {
  const navigate = useNavigate();
  const { setDateRange } = useBooking();

  return (
    <section className="final-cta">
      <h2>Prêt à réserver votre sonorisation ?</h2>
      <DateRangePicker
        onConfirm={(start, end) => {
          setDateRange({ start, end });
          navigate('/packs');
        }}
      />
    </section>
  );
}