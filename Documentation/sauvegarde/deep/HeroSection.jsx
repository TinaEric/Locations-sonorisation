import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../../booking/components/DateRangePicker';
import { useBooking } from '../../booking/context/BookingContext';

export default function HeroSection() {
  const navigate = useNavigate();
  const { setDateRange } = useBooking();

  const handleSearch = (start, end) => {
    setDateRange({ start, end });
    navigate('/packs'); // redirige vers le catalogue filtré
  };

  return (
    <section className="hero">
      <h1>Votre sonorisation, prête pour votre événement</h1>
      <p>Réservez un pack, personnalisez-le, et profitez.</p>

      <DateRangePicker onConfirm={handleSearch} />

      <ul className="hero-reassurance">
        <li>✓ Matériel vérifié et disponible</li>
        <li>✓ Livraison et installation</li>
        <li>✓ Assistance le jour J</li>
      </ul>
    </section>
  );
}