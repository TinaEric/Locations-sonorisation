const steps = [
  { n: 1, title: 'Choisissez votre date', text: 'Indiquez la période de votre événement.' },
  { n: 2, title: 'Choisissez un pack', text: 'Essentiel, Soirée, Concert… selon votre besoin.' },
  { n: 3, title: 'Personnalisez', text: 'Ajoutez micros, éclairage, effets selon vos envies.' },
  { n: 4, title: 'Réservez', text: 'Payez un acompte et c\'est réservé.' },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2>Comment ça marche ?</h2>
      <div className="steps-grid">
        {steps.map((s) => (
          <div key={s.n} className="step-card">
            <span className="step-number">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}