# NFL Analytics Pro

## Overview

NFL Analytics Pro is a comprehensive sports analytics platform that combines real-time NFL data with AI-powered predictions and expert analysis to provide insights for game outcomes and betting opportunities. The application aggregates data from multiple sources including official NFL APIs, betting odds providers, and expert analysis websites to deliver comprehensive game analysis with confidence ratings and betting recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, leveraging modern UI patterns and state management. The frontend uses Vite as the build tool for fast development and optimized production builds. The UI is built with shadcn/ui components on top of Radix UI primitives, providing a consistent and accessible design system. TanStack Query handles data fetching, caching, and synchronization with the backend APIs. The application uses Wouter for lightweight client-side routing and implements a responsive design with Tailwind CSS for styling.

### Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design pattern. The backend implements a service-oriented architecture with separate modules for different data sources (NFL API, betting odds, web scraping, AI analysis). Route handlers coordinate between services and the data storage layer. The server includes middleware for request logging, error handling, and development-specific features like Vite integration for hot module replacement.

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations and schema management. The database schema includes tables for teams, games, betting odds, AI predictions, expert advice, and team statistics. The storage layer implements a repository pattern with interfaces defining data access methods, allowing for future database migrations or testing with mock implementations.

### Authentication and Authorization Mechanisms
The current implementation appears to use session-based authentication with PostgreSQL session storage via connect-pg-simple. The application uses database-level constraints and server-side validation to ensure data integrity. API endpoints implement basic error handling and validation middleware.

### AI Integration
The system integrates with OpenAI's GPT model for game analysis and prediction generation. The AI service takes game data, team statistics, and betting odds as input to generate confidence ratings, betting recommendations, and detailed analysis. The AI predictions are stored in the database and can be batch processed for multiple games.

### External Service Integrations
The application integrates with multiple external data sources including NFL APIs for game schedules and team information, betting odds APIs for real-time line movements, and web scraping services for expert analysis from sports betting websites. The system includes error handling and fallback mechanisms for external service failures.

### Real-time Data Management
The application implements scheduled tasks using node-cron for periodic data updates, ensuring fresh information for games, odds, and predictions. The frontend uses React Query's automatic refetching capabilities to keep the UI synchronized with the latest data.

## External Dependencies

- **Database**: PostgreSQL with Neon serverless hosting (@neondatabase/serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **AI Services**: OpenAI API for game analysis and predictions  
- **Sports Data**: NFL APIs for official game and team data
- **Betting Data**: The Odds API for real-time betting lines and movements
- **Web Scraping**: Cheerio for parsing expert analysis from sports websites
- **Frontend Framework**: React 18 with TypeScript support
- **Build Tools**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS for utility-first responsive design
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Scheduling**: node-cron for automated data collection tasks
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions