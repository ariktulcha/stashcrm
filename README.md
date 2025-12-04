# Stash CRM

A modern, feature-rich Customer Relationship Management (CRM) system built with React, TypeScript, and Vite.

## Features

- 📊 **Dashboard** - Overview of key metrics and statistics
- 📦 **Orders Management** - Create, view, edit, and track orders
- 👥 **Customers** - Manage customer relationships and details
- 🎯 **Leads** - Track and manage potential customers
- 🏭 **Production** - Local and import production management
- 📦 **Products** - Product catalog management
- 🏢 **Suppliers** - Supplier relationship management
- 📋 **Inventory** - Stock and inventory tracking
- 💰 **Finances** - Financial overview and tracking
- ✅ **Tasks** - Task management and tracking

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (via inline styles)
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **DnD Kit** - Drag and drop functionality

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ariktulcha/stashcrm.git
cd stashcrm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
stash-crm/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Theme, Toast)
├── pages/             # Page components
├── services/          # Data services and utilities
├── types.ts           # TypeScript type definitions
├── constants.ts       # Application constants
└── App.tsx           # Main application component
```

## Features in Detail

### Dashboard
- Real-time statistics and metrics
- Visual charts and graphs
- Quick access to key information

### Orders
- Create new orders
- View order details
- Edit existing orders
- Track order status

### Customers
- Customer database
- Customer detail pages
- Relationship tracking

### Additional Modules
- Leads management
- Product catalog
- Production tracking (local and import)
- Supplier management
- Inventory control
- Financial overview
- Task management

## Development

The project uses:
- **TypeScript** for type safety
- **Vite** for fast development and building
- **React 19** with modern hooks and patterns

## License

Private project - All rights reserved

## Contributing

This is a private project. For questions or suggestions, please contact the repository owner.
