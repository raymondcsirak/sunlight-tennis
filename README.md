# Sunlight Tennis Club Platform

A modern, full-stack tennis club management platform built with Next.js, Supabase, and TypeScript.

## 🎾 Features

### Court Management
- Real-time court availability tracking
- Easy booking system with calendar integration
- Indoor and outdoor court distinction
- Court maintenance schedule tracking

### Player Experience
- **Match Finding System**
  - Create and respond to match requests
  - Skill-based matchmaking
  - Flexible scheduling options
  - Real-time match status updates

- **Experience Points (XP) System**
  - Progressive level system (Level 1-10)
  - Multiple XP earning activities
  - Activity streaks and multipliers
  - Special event bonuses

- **Achievement System**
  - Tiered achievements (Bronze to Platinum)
  - Match-based accomplishments
  - Training milestones
  - Special event achievements

### Social Features
- Player profiles with stats and history
- Real-time messaging system
- Match history tracking
- Achievement showcase
- Community engagement features

## 🛠 Technology Stack

- **Frontend**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - React Query (TanStack)

- **Backend**
  - Supabase (Database & Authentication)
  - PostgreSQL with RLS policies
  - Real-time subscriptions
  - Edge Functions

- **State Management**
  - Zustand
  - React Query
  - Server Components

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sunlight-tennis.git
cd sunlight-tennis
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update the following variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_site_url
```

5. Run the development server:
```bash
npm run dev
```

## 🚀 Deployment

The application can be deployed using Vercel:

```bash
npm run build
```

For production deployment, make sure to:
1. Set up all environment variables in your hosting platform
2. Configure the Supabase project for production
3. Set up proper security rules and RLS policies

## 🔒 Security

- Row Level Security (RLS) policies for data protection
- Secure authentication flow
- Protected API routes
- Environment variable management
- Data validation with Zod

## 🌍 Internationalization

- Multi-language support using i18next
- Romanian and English languages supported
- Easy addition of new languages
- Locale-based formatting

## 📱 Mobile Support

- Responsive design
- Progressive Web App (PWA) capabilities
- Mobile-optimized interfaces
- Touch-friendly interactions

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📖 Documentation

Additional documentation can be found in the `docs` directory:
- [General Documentation](docs/general.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- All contributors and community members

## 📞 Contact

For any queries or support open a pull request or an issue.