# NFL Analytics Dashboard

A modern NFL analytics dashboard built with TypeScript, React, and Express.js that provides real-time game data, AI-powered predictions, betting odds, and expert analysis.

## Features

- **Real-time NFL Data**: Live game scores, team statistics, and schedules from ESPN API
- **AI-Powered Predictions**: GPT-4 powered game analysis and outcome predictions
- **Betting Odds Integration**: Real-time odds from The Odds API with fallback mock data
- **Expert Analysis**: Comprehensive tips from 6 professional sports analysis sources
- **Interactive Dashboard**: Modern React UI with advanced filtering and search
- **Responsive Design**: Optimized for desktop and mobile devices
- **Robust Fallback Systems**: Mock data generation when external APIs are unavailable

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI, Vite
- **Backend**: Express.js, TypeScript
- **Database**: SQLite with Drizzle ORM
- **AI Integration**: OpenAI GPT-4 API
- **External APIs**: ESPN API, The Odds API
- **Build Tools**: Vite, PostCSS, ESLint

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kristianyonuel/NFLPicks.git
cd NFLPicks
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your API keys:
- `OPENAI_API_KEY`: Your OpenAI API key for game analysis
- `ODDS_API_KEY`: Your The Odds API key (optional - has fallback)

4. Start the development server:
```bash
# Windows
$env:Path = "C:\Program Files\nodejs;" + $env:Path; $env:NODE_ENV = "development"; npx tsx server/index.ts

# macOS/Linux  
npm run dev
```

5. Open your browser to `http://localhost:5000`

### Initial Data Setup

1. Navigate to the dashboard
2. Click "Refresh Data" to fetch current NFL week data
3. The system will automatically fetch games, team stats, odds, and generate AI analysis

## API Endpoints

- `GET /api/games/:week/:season` - Get games for a specific week
- `POST /api/refresh/:week/:season` - Refresh all data for a week
- `GET /api/teams` - Get all NFL teams
- `GET /api/summary/:week/:season` - Get week summary statistics

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components  
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── server/                # Express.js backend
│   ├── services/          # External API integrations
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                # Shared TypeScript schemas
└── package.json           # Dependencies and scripts
```

## Configuration

The application supports several environment variables in `.env`:

- `NODE_ENV`: Development environment (development/production)
- `PORT`: Server port (default: 5000)  
- `OPENAI_API_KEY`: Required for AI game analysis
- `ODDS_API_KEY`: Optional for betting odds (has mock fallback)

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

### Key Features for Development

- **Hot Module Replacement**: Instant updates during development
- **TypeScript**: Full type safety across frontend and backend
- **Mock Data Systems**: Reliable fallbacks when external APIs fail
- **Error Handling**: Comprehensive error handling and logging
- **SSL Certificate Handling**: Configured for external API SSL issues

## Deployment

The application can be deployed to any Node.js hosting platform:

1. Build the application: `npm run build`
2. Set environment variables on your hosting platform
3. Start the server: `node dist/server/index.js`

Popular deployment options:
- Vercel
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## API Keys Setup

### OpenAI API Key
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account and generate an API key
3. Add to `.env` as `OPENAI_API_KEY`

### The Odds API Key (Optional)
1. Visit [The Odds API](https://the-odds-api.com/)
2. Sign up for a free account
3. Add to `.env` as `ODDS_API_KEY`

Note: The application includes mock data systems, so external API keys are optional for testing.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on the GitHub repository.