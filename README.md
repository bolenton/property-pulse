# Property Pulse - Real Estate Lead Scanner

This is a React application for scanning real estate leads with the following features:

## Features
- User authentication with Supabase
- Property search criteria management
- Property matching dashboard
- Responsive UI with Tailwind CSS

## Structure
- `src/components/` - Reusable UI components
- `src/pages/` - Application pages (Login, Dashboard, Criteria, Matches, Settings)
- `src/context/` - React context providers (UserContext)
- `src/lib/` - Utility libraries (Supabase client)

## Setup
1. Create a Supabase project and add the credentials to .env file:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start development server

## Components
- Navbar with navigation and logout
- Login page with form validation
- Dashboard with overview and quick actions
- Criteria page for setting search parameters
- Matches page for displaying property results
- Settings page for account management