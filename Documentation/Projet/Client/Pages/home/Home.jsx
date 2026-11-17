import Packs from './Packs.jsx';
import Categories from './Categories.jsx';
import Reassurance from './Reassurance.jsx';
import Reviews from './Reviews.jsx';
import FinalCta from './FinalCta.jsx';
import HeroPage from './HeroPage.jsx';

export default function Home() {
  return (
    <>
      <HeroPage />
      <Packs />
      <Categories />
      <Reassurance />
      <Reviews />
      <FinalCta />
    </>
  );
}
