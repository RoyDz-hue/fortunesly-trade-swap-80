
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <section className="py-20 bg-[#2D2A31] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Join thousands of traders on Fortunesly.shop. Create an account now and start trading emerging cryptocurrencies with KES and USDT.
            </p>
            <Button asChild size="lg" className="bg-fortunesly-primary hover:bg-fortunesly-accent text-white border border-transparent group">
              <Link to="/register" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="bg-[#221F26]/70 backdrop-blur-sm p-6 rounded-lg border border-gray-800 shadow-xl max-w-sm w-full">
            <div className="text-xl font-semibold mb-4">Why Choose Fortunesly.shop?</div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-fortunesly-primary text-white p-1 rounded-full mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Secure P2P trading with escrow protection</span>
              </li>
              <li className="flex items-start">
                <div className="bg-fortunesly-primary text-white p-1 rounded-full mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Instant KES deposits and withdrawals</span>
              </li>
              <li className="flex items-start">
                <div className="bg-fortunesly-primary text-white p-1 rounded-full mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Access to emerging cryptocurrencies</span>
              </li>
              <li className="flex items-start">
                <div className="bg-fortunesly-primary text-white p-1 rounded-full mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Partial order fulfillment for flexibility</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
