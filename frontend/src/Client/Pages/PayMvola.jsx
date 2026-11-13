import { useState } from "react";

const API = "http://localhost:3000";

export default function PayMvola() {
  const [phone, setPhone] = useState("0343500003"); // numéro de test sandbox
  const [amount, setAmount] = useState(1000);
  const [state, setState] = useState("");

  const pay = async () => {
    setState("Envoi…");
    const res = await fetch(`${API}/mvola/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, phone }),
    });
    const data = await res.json();
    if (!res.ok) return setState("Erreur : " + JSON.stringify(data));

    setState("En attente de confirmation sur le téléphone…");
    poll(data.serverCorrelationId);
  };

  const poll = (id, tries = 0) => {
    if (tries > 20) return setState("Délai dépassé (pending)");
    setTimeout(async () => {
      const r = await fetch(`${API}/mvola/status/${id}`);
      const s = await r.json();
      if (s.status === "completed") return setState("✅ Paiement réussi");
      if (s.status === "failed") return setState("❌ Paiement échoué");
      poll(id, tries + 1);
    }, 3000);
  };

  return (
    <div>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} />
      <button onClick={pay}>Payer avec MVola</button>
      <p>{state}</p>
    </div>
  );
}