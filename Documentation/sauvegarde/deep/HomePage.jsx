import { useNavigate } from 'react-router-dom';
import Header from '../shared/components/layout/Header';
import Footer from '../shared/components/layout/Footer';
import HeroSection from '../features/home/components/HeroSection';
import HowItWorks from '../features/home/components/HowItWorks';
import PacksPreview from '../features/home/components/PacksPreview';
import WhyUs from '../features/home/components/WhyUs';
import FinalCTA from '../features/home/components/FinalCTA';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HowItWorks />
        <PacksPreview />
        <WhyUs />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}