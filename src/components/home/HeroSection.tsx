
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <div className="hero-gradient text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Trade Crypto <span className="text-fortunesly-primary">Peer-to-Peer</span> with Kenyan Shillings
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-lg">
              Fortunesly.shop is your secure marketplace for trading emerging cryptocurrencies with KES and USDT.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-fortunesly-primary hover:bg-fortunesly-primary/90 text-white">
                <Link to="/register">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-[#403E43]/10 hover:bg-[#403E43]/20 border-gray-700">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -right-8 -top-8 w-64 h-64 bg-fortunesly-primary/20 rounded-full blur-3xl"></div>
            <div className="relative z-10 bg-[#221F26]/70 backdrop-blur-sm p-6 rounded-lg border border-gray-800 shadow-xl animate-float">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Trade HRC/KES</span>
                  <span className="text-fortunesly-primary">+5.2%</span>
                </div>
                <div className="h-32 bg-gradient-to-r from-fortunesly-primary/20 to-fortunesly-primary/5 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#403E43]/25 p-3 rounded">
                    <div className="text-sm opacity-70">Price</div>
                    <div className="font-semibold">3.25 KES</div>
                  </div>
                  <div className="bg-[#403E43]/25 p-3 rounded">
                    <div className="text-sm opacity-70">24h Volume</div>
                    <div className="font-semibold">320,450 KES</div>
                  </div>
                </div>
                <Button className="w-full bg-fortunesly-primary hover:bg-fortunesly-primary/90 text-white">Trade Now</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
