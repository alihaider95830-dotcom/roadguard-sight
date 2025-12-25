# RoadGuard Sight

> Automated Tire Inspection System - Real-time vehicle safety monitoring

RoadGuard Sight is an intelligent tire inspection platform that provides real-time monitoring and analysis of vehicle tire conditions using automated camera systems. The platform detects unsafe tire conditions, tracks inspection history, and generates comprehensive safety reports.

## Features

### Real-time Monitoring
- Live dashboard with inspection statistics
- Real-time event subscriptions for instant updates
- Automated camera-based tire inspections
- License plate recognition and tracking

### Safety Detection
- Automated safe/unsafe tire classification
- Confidence scoring for inspection accuracy
- Alert system for unsafe tire conditions
- Pending alerts management

### Data Management
- Complete inspection history
- Advanced search and filtering capabilities
- License plate-based vehicle tracking
- Detailed inspection records with timestamps

### Reporting & Analytics
- Dashboard statistics and trends
- Performance metrics tracking
- Inspection reports generation
- Camera location monitoring

### Administration
- User management system
- System settings configuration
- Audit trail logging
- Role-based access control

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management

### UI Components
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Additional Libraries
- **date-fns** - Date manipulation
- **Sonner** - Toast notifications
- **next-themes** - Theme management

## Getting Started

### Prerequisites
- Node.js 18+ (recommended via [nvm](https://github.com/nvm-sh/nvm))
- npm or bun package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd roadguard-sight
```

2. Install dependencies
```bash
npm install
# or
bun install
```

3. Start the development server
```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview
```

## Project Structure

```
roadguard-sight/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components
│   │   └── ui/              # shadcn/ui components
│   ├── pages/
│   │   ├── admin/           # Admin pages
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Alerts.tsx       # Alerts management
│   │   ├── History.tsx      # Inspection history
│   │   ├── Reports.tsx      # Report generation
│   │   └── Login.tsx        # Authentication
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Utility functions
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Root component
│   └── main.tsx             # Application entry
├── public/                  # Static assets
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Key Pages

- **Dashboard** (`/dashboard`) - Real-time inspection monitoring with statistics
- **Alerts** (`/alerts`) - Manage and review unsafe tire alerts
- **History** (`/history`) - Browse complete inspection history
- **Inspection Detail** (`/inspections/:id`) - Detailed inspection view
- **Reports** (`/reports`) - Generate and export reports
- **Admin** (`/admin/*`) - User management, settings, and audit logs

## Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent code formatting
- Component-based architecture

### Styling
- Tailwind CSS utility classes
- Custom CSS variables for theming
- Responsive design patterns
- Dark mode support (via next-themes)

## License

Copyright © 2024. All rights reserved.
