
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TradingPairsSection from "@/components/home/TradingPairsSection";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/home/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <HeroSection />
        <FeaturesSection />
        <TradingPairsSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
