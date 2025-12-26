# SkillSwap - React + Supabase

A React application built with Vite and Supabase.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account ([sign up here](https://supabase.com))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your Supabase credentials:
   - Copy `.env.example` to `.env`
   - Get your Supabase URL and anon key from your [Supabase project settings](https://app.supabase.com/project/_/settings/api)
   - Update `.env` with your credentials:
     ```
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
  lib/
    supabase.js    # Supabase client configuration
  App.jsx          # Main app component
  main.jsx         # App entry point
```

## Using Supabase

Import the Supabase client in your components:

```javascript
import { supabase } from './lib/supabase'

// Example: Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Example: Insert data
const { data, error } = await supabase
  .from('your_table')
  .insert([{ column: 'value' }])

// Example: Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'password'
})
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Supabase Documentation](https://supabase.com/docs)
