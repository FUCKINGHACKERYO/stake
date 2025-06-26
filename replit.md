# Stake Casino Clone - 100% Functional Replica

## Overview

This is a comprehensive 100% functional replica of Stake.com featuring all casino games, sports betting, and original games with authentic mechanics and real-time features. Built with React/TypeScript for the frontend and Node.js/Express for the backend, it includes PostgreSQL database integration, enhanced game graphics, live WebSocket features, authentic game mathematics, comprehensive sports betting system, user balance management, transaction tracking, and a complete casino ecosystem matching the original Stake.com experience.

## System Architecture

### Full-Stack Structure
- **Frontend**: React 18 with TypeScript, using Vite as the build tool
- **Backend**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management

### Monorepo Organization
The application uses a structured monorepo approach:
- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared TypeScript schemas and types
- Root level configuration files for build tools and dependencies

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components with Radix UI primitives
- **Routing**: Wouter for client-side routing
- **UI Framework**: Tailwind CSS with custom Stake-themed color palette
- **Icons**: Lucide React icons with React Icons for social media
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **API Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL dialect
- **Storage Pattern**: Interface-based storage with in-memory implementation (MemStorage)
- **Development**: Hot-reload with tsx for TypeScript execution

### Database Schema
Three main entities managed through Drizzle ORM:
- **Users**: User accounts with balance tracking
- **Games**: Casino games with metadata (category, provider, betting limits)
- **Game Sessions**: Betting history and session tracking

### Authentication & State
- Session-based authentication preparation (connect-pg-simple)
- User balance management
- Real-time game state tracking

## Data Flow

1. **Client Requests**: React components use TanStack Query hooks
2. **API Layer**: Express routes handle HTTP requests
3. **Business Logic**: Storage interface abstracts data operations
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON data flows back through the API to React components

### Key Data Patterns
- Games are categorized (slots, live, table, originals)
- User balances are tracked with decimal precision
- Game sessions record betting activity and outcomes

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (serverless PostgreSQL)
- **UI Components**: Radix UI primitives via shadcn/ui
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date utilities

### Development Tools
- **Runtime**: Node.js 20 with ESM modules
- **TypeScript**: Full type safety across frontend and backend
- **Build Tools**: Vite for frontend, esbuild for backend production builds

## Deployment Strategy

### Development Environment
- Replit-optimized with specific module requirements
- Hot-reload development server on port 5000
- PostgreSQL 16 database integration

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild creates single bundled server file
- Deployment target: Autoscale with external port 80

### Build Commands
- `npm run dev` - Development with hot-reload
- `npm run build` - Production build for both frontend and backend
- `npm run start` - Production server execution

## Recent Changes

### June 26, 2025 - Major Architecture Update
- **PostgreSQL Database Integration**: Replaced in-memory storage with full PostgreSQL database using Neon
- **Enhanced Casino Games**: Created authentic Plinko and Crash games with real-time graphics, animations, and physics
- **Comprehensive Sports Betting**: Added full sports betting system with live odds, bet slip, and real-time events
- **Enhanced Slot Games**: Built authentic slot machine games (Gates of Olympus, Sweet Bonanza) with cascading reels and win animations  
- **Live Features**: Implemented WebSocket connections for real-time updates across all games
- **Navigation System**: Added seamless routing between casino games and sports betting sections
- **Database Schema**: Created comprehensive tables for users, games, sessions, transactions, promotions, and live bets
- **Authentic Game Mathematics**: Implemented real RTP calculations, house edge, and payout systems matching Stake.com

### Key Features Added
- Enhanced Plinko with authentic risk multipliers and ball physics simulation
- Enhanced Crash with real-time multiplier curves and auto-cashout functionality
- Comprehensive slot games with authentic symbol mechanics and win line calculations
- Sports betting with dynamic odds, live events, and bet slip management
- Real-time live betting feed and chat systems
- User balance management with persistent transaction history
- Auto-betting modes for all casino games

## User Preferences

Preferred communication style: Simple, everyday language.
Requirements: 100% functional replica matching original Stake.com, no demo functionality.