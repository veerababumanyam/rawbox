# RawBox - Professional Photography Gallery Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)

> Enterprise-grade SaaS platform for professional photographers to manage, share, and deliver photos to clients with AI-powered features, multi-language support, and global CDN delivery.

## 🌟 Features

### Core Features
- **Gallery Management**: Create and organize photo galleries with sub-galleries
- **Client Portal**: Password-protected galleries with customizable branding
- **AI Integration**: Powered by Google Gemini for photo analysis and face detection
- **Print Album Designer**: Visual design tool for creating print-ready albums
- **Multi-Language Support**: 13 languages including English, Hindi, Tamil, Arabic, Urdu, and more
- **Multi-Currency**: Support for 15 Asian currencies with automatic conversion
- **Real-Time Collaboration**: WebSocket-based notifications and updates
- **Advanced Search**: Full-text search with filters and saved queries
- **Bulk Operations**: Efficient management of hundreds of photos at once

### Enterprise Features
- **Multi-Tenant RBAC**: Granular role-based access control with custom roles
- **High Availability**: 99.9% uptime with load balancing and failover
- **CloudFlare Integration**: Global CDN with R2 storage (zero egress fees)
- **Payment Gateways**: Razorpay, Stripe, Alipay, WeChat Pay, PayPal
- **Analytics & BI**: Comprehensive dashboards with export capabilities
- **Compliance**: GDPR, DPDP Act, PIPL compliant with data residency
- **Progressive Web App**: Offline support and mobile-optimized

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CloudFlare Global Network                     │
│         CDN Edge (200+ PoPs) + R2 Storage + DDoS/WAF           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Load Balancer (nginx - Active/Active)              │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐            ┌──────────────────────┐
│  Frontend (React)    │            │  Backend API (x3)    │
│  nginx + Vite        │            │  Node.js/Express     │
└──────────────────────┘            └──────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │   PostgreSQL     │    │   Redis Cluster  │    │  Message Queue   │
         │   Primary +      │    │   Sentinel HA    │    │   (BullMQ)       │
         │   Replicas (x2)  │    │                  │    │                  │
         └──────────────────┘    └──────────────────┘    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **PostgreSQL** >= 16 (or use Docker)
- **Redis** >= 7.0 (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rawbox.git
   cd rawbox
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration

   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   # Start PostgreSQL, Redis, and other services
   docker-compose up -d postgres redis
   ```

5. **Run database migrations**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed  # Optional: seed with sample data
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

## 📁 Project Structure

```
rawbox/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Internationalization
│   │   └── utils/           # Utility functions
│   ├── public/
│   │   └── locales/         # Translation files (13 languages)
│   ├── tests/               # Frontend tests
│   └── package.json
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── workers/         # Background workers
│   │   └── db/              # Database utilities
│   ├── tests/               # Backend tests
│   └── package.json
│
├── infrastructure/           # Infrastructure as code
│   ├── docker/              # Docker configurations
│   ├── nginx/               # nginx configurations
│   ├── monitoring/          # Prometheus & Grafana
│   └── scripts/             # Deployment scripts
│
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── ARCHITECTURE.md      # Architecture overview
│   └── RBAC.md              # RBAC documentation
│
└── .github/                  # CI/CD workflows
    └── workflows/
```

## 🌍 Supported Languages

- 🇬🇧 English
- 🇮🇳 Hindi (हिन्दी)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Bengali (বাংলা)
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Gujarati (ગુજરાતી)
- 🇮🇳 Kannada (ಕನ್ನಡ)
- 🇮🇳 Malayalam (മലയാളം)
- 🇮🇳 Punjabi (ਪੰਜਾਬੀ)
- 🇮🇳 Odia (ଓଡ଼ିଆ)
- 🇵🇰 Urdu (اردو) - RTL
- 🇸🇦 Arabic (العربية) - RTL

## 💰 Supported Currencies

INR (₹), CNY (¥), JPY (¥), KRW (₩), SGD ($), THB (฿), MYR (RM), IDR (Rp), PHP (₱), VND (₫), PKR (₨), BDT (৳), AED (د.إ), SAR (﷼), USD ($)

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Two-Factor Authentication** (2FA)
- **Rate Limiting** (100 req/min per IP)
- **SQL Injection Prevention** (parameterized queries)
- **XSS Protection** (input sanitization)
- **CSRF Protection** (tokens)
- **Data Encryption** (AES-256 at rest, TLS 1.3 in transit)
- **Password Hashing** (bcrypt with 12 rounds)
- **Audit Logging** for all sensitive operations

## 📊 Performance Targets

- **Concurrent Users**: 10,000+
- **Sustained Load**: 1,000 RPS
- **Peak Load**: 5,000 RPS
- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **API Response Time**: < 200ms (p95)
- **Uptime SLA**: 99.9%

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run load tests
npm run test:load
```

## 🚢 Deployment

### Production Deployment

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build

# Deploy with Docker Compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Or use deployment script
./infrastructure/scripts/deploy.sh production
```

### Environment Variables

**Required Environment Variables:**

```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/rawbox
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# Frontend
VITE_API_URL=https://api.rawbox.com
VITE_GEMINI_API_KEY=your-gemini-api-key
```

See `.env.example` files for complete configuration options.

## 📖 Documentation

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [RBAC Documentation](docs/RBAC.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

## 🛠️ Technology Stack

### Frontend
- **React** 19.2 - UI framework
- **Vite** 6.2 - Build tool
- **TypeScript** 5.8 - Type safety
- **TailwindCSS** 4.1 - Styling
- **react-i18next** - Internationalization
- **Vitest** - Testing framework

### Backend
- **Node.js** 18+ - Runtime
- **Express** 5.2 - Web framework
- **TypeScript** 5.9 - Type safety
- **PostgreSQL** 16 - Database
- **Redis** 7.0 - Cache & sessions
- **BullMQ** - Job queue
- **Vitest** - Testing framework

### Infrastructure
- **Docker** - Containerization
- **nginx** - Reverse proxy & load balancer
- **CloudFlare** - CDN & R2 storage
- **Prometheus** - Metrics
- **Grafana** - Dashboards
- **ELK/Loki** - Logging
- **Jaeger** - Distributed tracing

### Payment Gateways
- **Razorpay** - India (UPI, cards, net banking)
- **Stripe** - International
- **Alipay** - China
- **WeChat Pay** - China
- **PayPal** - Universal fallback

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI capabilities
- [CloudFlare](https://www.cloudflare.com/) for CDN and R2 storage
- [PostgreSQL](https://www.postgresql.org/) for database
- [Redis](https://redis.io/) for caching
- All open-source contributors

## 📞 Support

- **Documentation**: https://docs.rawbox.com
- **Email**: support@rawbox.com
- **Discord**: https://discord.gg/rawbox
- **GitHub Issues**: https://github.com/your-org/rawbox/issues

## 🗺️ Roadmap

- [ ] Mobile apps (iOS & Android)
- [ ] Video support
- [ ] Advanced AI features (auto-tagging, smart albums)
- [ ] White-label solution
- [ ] API for third-party integrations
- [ ] Blockchain-based photo verification

---

**Built with ❤️ for photographers worldwide**
