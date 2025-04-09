# Fortunesly Trade Swap Platform

A futures cryptocurrency trading and swap platform, featuring real-time order books, deposits, and market overview.

## Project Overview

Fortunesly Trade Swap is a featured prelaunched tokens trading platform that enables users to:
- Buy and sell
- deposit
- View real-time market data
- Create and execute limit orders
- Monitor order books

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Build Tool**: Vite
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Real-time Updates**: Supabase Realtime

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   └── ApproveCryptoDeposits.tsx   # Admin interface for deposit approvals
│   ├── dashboard/
│   │   ├── CreateOrderForm.tsx         # Form for creating buy/sell orders
│   │   ├── MarketOverview.tsx          # Market statistics and price overview
│   │   ├── OrderBook.tsx               # Real-time order book display
│   │   └── TradeForm.tsx               # Main trading interface
│   └── ui/                             # Reusable UI components
├── pages/
│   ├── MarketPage.tsx                  # Main market overview page
│   ├── MarketOrdersPage.tsx            # Active orders listing
│   └── TradePage.tsx                   # Trading interface page
├── context/
│   └── AuthContext.tsx                 # Authentication context
├── hooks/
│   └── use-toast.ts                    # Toast notification hook
└── integrations/
    └── supabase/                       # Supabase client configuration
```

## Key Features

### Trading System
- Real-time order book updates
- Market and limit orders
- Order matching engine
- Balance management
- Trade history tracking

### Admin Features
- Crypto deposit approval system
- User management
- Transaction monitoring
- System settings

### Market Data
- Real-time price updates
- Trading pair management
- Market statistics
- Price charts

### User Features
- Secure authentication
- Wallet management
- Order history
- Balance tracking

## Database Structure

### Main Tables
- `users`: User accounts and balances
- `orders`: Trading orders
- `transactions`: Deposit and withdrawal records
- `coins`: Supported cryptocurrencies
- `trading_pairs`: Available trading pairs

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/RoyDz-hue/fortunesly-trade-swap-80.git
```

2. Install dependencies:
```bash
cd fortunesly-trade-swap-80
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Supabase credentials and other required variables.

4. Start the development server:
```bash
npm run dev
```

## Development Guidelines

### Code Style
- Use TypeScript for all new components
- Follow the existing component structure
- Implement proper error handling
- Add appropriate loading states

### State Management
- Use React Context for global state
- Implement proper data fetching patterns
- Handle real-time updates efficiently

### Security Considerations
- Validate all user inputs
- Implement proper authorization checks
- Handle sensitive data appropriately
- Use secure API endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For support, please open an issue in the repository or contact the development team.