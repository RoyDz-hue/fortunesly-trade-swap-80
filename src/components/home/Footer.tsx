
const Footer = () => {
  return (
    <footer className="bg-[#221F26] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-2xl font-bold text-fortunesly-secondary">.shop</span>
            </div>
            <p className="text-gray-400 mb-4">
              Your secure P2P marketplace for trading emerging cryptocurrencies with KES and USDT.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">P2P Trading</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">KES Deposits</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Crypto Deposits</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trading API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trading Guide</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Market Information</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Fortunesly.shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
