import { usePacks } from '../../packs/hooks/usePacks';
import PackCard from '../../packs/components/PackCard';

export default function PacksPreview() {
  const { packs, loading } = usePacks();

  if (loading) return <p>Chargement des packs…</p>;

  return (
    <section className="packs-preview">
      <h2>Nos packs de sonorisation</h2>
      <p>Un point de départ, personnalisable à volonté.</p>
      <div className="packs-grid">
        {packs.slice(0, 4).map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </section>
  );
}