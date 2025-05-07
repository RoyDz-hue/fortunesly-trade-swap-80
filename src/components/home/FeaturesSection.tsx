
import { Wallet, ArrowLeftRight, PiggyBank } from "lucide-react";

const features = [
  {
    title: "Deposit",
    description: "Instantly deposit KES or cryptocurrencies with easy verification.",
    icon: <PiggyBank className="w-10 h-10 text-fortunesly-primary" />,
  },
  {
    title: "Trade",
    description: "Place orders or match existing ones with our efficient P2P marketplace.",
    icon: <ArrowLeftRight className="w-10 h-10 text-fortunesly-primary" />,
  },
  {
    title: "Withdraw",
    description: "Fast KES withdrawals and secure crypto transfers to your wallet.",
    icon: <Wallet className="w-10 h-10 text-fortunesly-primary" />,
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-[#221F26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our platform makes cryptocurrency trading with Kenyan Shillings simple, secure, and efficient.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-[#403E43]/20 p-8 rounded-lg shadow-md border border-gray-800 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="mb-4 bg-fortunesly-primary/10 inline-flex p-3 rounded-full">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
