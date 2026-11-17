
export default function WhyUs() {
  const valeur = [
    { icon: '🔊', title: 'Matériel pro', text: 'Marques reconnues, entretenues et testées.' },
    { icon: '🚚', title: 'Livraison incluse', text: 'Nous livrons et installons sur place.' },
    { icon: '🎧', title: 'Assistance', text: 'Un technicien joignable le jour J.' },
  ];
  
  return (
    <section className="why-us">
      <h2>Pourquoi nous choisir ?</h2>
      <div className="why-grid">
        {valeur.map((a) => (
          <div key={a.title} className="why-card">
            <span className="why-icon">{a.icon}</span>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}