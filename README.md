# Pokémon Card Collector

A full-stack React application for tracking your Pokémon card collection. Features multi-user support, cloud sync, card tagging, quantity tracking, and price lookups.

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)

## Features

- 🔍 **Browse & Search** - Search the TCGdex database for Pokémon cards
- ⭐ **Collection Tracking** - Mark cards as collected with quantity support
- ❤️ **Wishlist** - Keep track of cards you want
- 🏷️ **Tagging System** - Organize cards with custom tags
- 👥 **Multi-User Support** - Multiple users with separate collections
- 🔐 **Admin Panel** - Manage users and tags
- ☁️ **Cloud Sync** - Sync collections across devices (Supabase or local MySQL)
- 🛒 **Price Lookup** - Find where to buy cards

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd pokemon-collector
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings (see [Environment Variables](#environment-variables))

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:5173** and log in with `admin` / `admin123`

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend Selection: 'supabase' (default) or 'local'
VITE_DATA_BACKEND=supabase

# Supabase Configuration (if using Supabase backend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-publishable-key

# Local API Configuration (if using local backend)
VITE_LOCAL_API_URL=/api
```

> ⚠️ **Security Note:** Never commit `.env` files with real credentials. Use `.env.example` as a template.

## Backend Options

### Option 1: Local Backend (Recommended for Development)

The local backend uses MySQL/MariaDB with an Express API server and provides **secure bcrypt password hashing**.

**Using Docker (easiest):**
```bash
docker-compose up
```
This starts the web app, API server, and MariaDB database. Access at http://localhost:4173

**Manual setup:**
```bash
# Start MariaDB (or MySQL) and create database
mysql -u root -p -e "CREATE DATABASE pokemon_collector"
mysql -u root -p pokemon_collector < server/schema.sql

# Configure and start the API
cd server
npm install
export DB_HOST=localhost DB_USER=root DB_PASSWORD=yourpassword DB_NAME=pokemon_collector
npm start

# In another terminal, start the frontend
cd ..
VITE_DATA_BACKEND=local npm run dev
```

### Option 2: Supabase (Cloud)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL from `server/schema.sql` in the Supabase SQL editor (adjust syntax as needed for PostgreSQL)
3. Add your Supabase URL and publishable key to `.env`

## Security

### Password Hashing

The application uses different password hashing strategies depending on the backend:

| Backend | Hashing Method | Location | Security Level |
|---------|---------------|----------|----------------|
| Local API | bcrypt (12 rounds) | Server-side | ✅ Recommended |
| Supabase | SHA-256 | Client-side | ⚠️ Legacy |

**Local Backend Security Features:**
- Passwords are hashed server-side with bcrypt and automatic salting
- Password hashes are never sent to the client
- Legacy SHA-256 hashes are automatically migrated to bcrypt on login
- Authentication happens server-side via `/api/auth/login`

**Supabase Security Recommendations:**

The current Supabase implementation uses client-side SHA-256 hashing, which is not ideal. For production, consider:

1. **Migrate to Supabase Auth** - Provides server-side bcrypt hashing, JWT sessions, email verification, and password reset. See [Supabase Auth docs](https://supabase.com/docs/guides/auth).

2. **Use Edge Functions** - Create a server-side authentication endpoint that handles password hashing.

### Default Credentials

The default admin account is:
- Username: `admin`
- Password: `admin123`

> ⚠️ **Change the default password immediately in production!**

For Docker deployments, set custom credentials via environment variables:
```yaml
environment:
  ADMIN_USERNAME: your-admin
  ADMIN_PASSWORD: your-secure-password
```

### Best Practices

- Never commit `.env` files with real credentials
- Use strong, unique passwords for all accounts
- In production, use environment variables or secrets management
- Enable HTTPS for all deployments
- Regularly update dependencies for security patches

## Project Structure

```
pokemon-collector/
├── src/
│   ├── components/       # React components
│   │   ├── cards/        # Card display components
│   │   ├── controls/     # UI controls (pagination, dropdowns)
│   │   └── icons/        # Custom icons
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API clients (Supabase, local, TCGdex)
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
├── server/               # Express API server
│   ├── index.js          # API routes
│   ├── db.js             # Database connection
│   └── schema.sql        # Database schema
├── tests/                # Playwright E2E tests
└── docker-compose.yml    # Docker configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright tests |

## API Endpoints

When using the local backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user (returns user without password) |
| GET | `/api/users` | List all users (no passwords) |
| POST | `/api/users` | Create new user |
| PATCH | `/api/users/:username` | Update user |
| DELETE | `/api/users/:username` | Delete user |
| GET | `/api/collection` | Get user's collection data |
| POST | `/api/collection/save` | Save collection data |
| GET | `/api/health` | Health check |

## Docker Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

> **Note:** Update the image references in `docker-compose.prod.yml` to point to your container registry.

## Testing

Run end-to-end tests with Playwright:

```bash
# Install browsers (first time only)
npx playwright install

# Run tests
npm run test:e2e

# Run tests with UI
npx playwright test --ui
```

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 3.4
- **Icons:** Lucide React
- **Backend Options:** Supabase (PostgreSQL) or Express + MySQL/MariaDB
- **Password Hashing:** bcryptjs (local backend)
- **Testing:** Playwright
- **Containerization:** Docker, Docker Compose

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

This project is private and not licensed for public use.

## Acknowledgments

- Card data provided by [TCGdex API](https://tcgdex.net/)
- Pokémon and Pokémon card images are © Nintendo/Creatures Inc./GAME FREAK Inc.
