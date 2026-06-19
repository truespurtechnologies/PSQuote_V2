# PSQuote V2 - Popular Steels Quotation Generator

A modern Next.js application for generating and managing steel quotations with Supabase backend.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.18.0
- npm or yarn
- Supabase project (for production)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment Setup:**
```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. **Run the application:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── quotations/        # Quotation management
│   └── settings/          # Application settings
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── ui/                # UI components (shadcn/ui)
│   └── settings/          # Settings components
├── lib/                   # Utility libraries
│   ├── auth-utils.ts      # Authentication utilities
│   ├── supabase-client.ts # Supabase client configuration
│   └── quotation-db.ts    # Database operations
├── supabase/              # Supabase configuration
│   └── migrations/        # Database migrations
├── types/                 # TypeScript type definitions
└── __tests__/             # Test files
```

## 🗄️ Database Setup

The application uses Supabase as the backend. The database schema includes:

- **Profiles**: User profile information
- **Quotations**: Main quotation records
- **Quotation Items**: Individual line items in quotations

### Running Migrations

If you have the Supabase CLI installed:

```bash
supabase db push
```

## 🧪 Testing

The project includes a comprehensive test setup with Jest and React Testing Library.

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Tests are located in `__tests__/` directory
- Mocks are in `__mocks__/` directory
- Configuration in `jest.config.mjs`

## 🔧 Configuration

### Environment Variables

Key environment variables (see `env.example` for complete list):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Session Management
NEXT_PUBLIC_SESSION_REFRESH_INTERVAL=300000

# Feature Flags
NEXT_PUBLIC_FEATURE_AUTH=true
```

### Next.js Configuration

The Next.js configuration (`next.config.js`) includes:
- React strict mode enabled
- TypeScript build errors ignored (for development)
- Image optimization disabled (for static hosting)
- Server actions configured with 2MB body limit

## 🎨 UI Components

The application uses:
- **TailwindCSS** for styling
- **shadcn/ui** for component library
- **Radix UI** for accessible components
- **Lucide React** for icons

## 🔐 Authentication

Authentication is handled through Supabase Auth:
- Email/password authentication
- Session management with automatic refresh
- Protected routes via middleware
- Row Level Security (RLS) policies

## 📚 Documentation

Additional documentation is available in the `/docs` directory:
- `AUTHENTICATION.md` - Authentication flow details
- `SESSION_TIMEOUT_CONFIG.md` - Session management
- `POS_AND_QUOTATION_CHANGES_SUMMARY.md` - Feature changes

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup for Production
1. Set production environment variables
2. Configure Supabase project
3. Run database migrations
4. Deploy to your preferred platform

## 🐛 Troubleshooting

### Common Issues

1. **Build fails with dependency errors**
   ```bash
   npm install  # Re-sync dependencies
   ```

2. **Tests fail with missing setup files**
   - Ensure `__tests__/setupTests.ts` exists
   - Ensure `__mocks__/supabase/` directory exists

3. **Supabase connection issues**
   - Verify `.env.local` has correct credentials
   - Check Supabase project is active

4. **TypeScript errors**
   - Run `npm run typecheck` to identify issues
   - Build ignores TypeScript errors by default

## 📄 License

This project is proprietary to Popular Steels.

## 🤝 Support

For support and questions, please refer to the project documentation or contact the development team.
