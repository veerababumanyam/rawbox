# Design Document

## Overview

This document outlines the comprehensive architectural design for restructuring the RawBox SaaS photography platform to support 10,000+ concurrent users with enterprise-grade features including multi-tenant RBAC, multi-region deployment, CloudFlare R2 storage, comprehensive i18n support for 13 languages, and production-ready infrastructure with high availability, disaster recovery, and compliance.

The design separates frontend and backend into independent services, implements open-source technology stack, integrates CloudFlare CDN and R2 storage, and provides a scalable foundation for global expansion.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFlare Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   CDN Edge   │  │  R2 Storage  │  │  DDoS/WAF    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer (nginx)                       │
│                    (Round-robin / Least-conn)                    │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐            ┌──────────────────────┐
│  Frontend Container  │            │  Backend API (x3)    │
│   (nginx + React)    │            │  (Node.js/Express)   │
│   - Static Assets    │            │  - REST API          │
│   - PWA Service      │            │  - WebSocket         │
│   Worker             │            │  - Auth/RBAC         │
└──────────────────────┘            └──────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │   PostgreSQL     │    │   Redis Cluster  │    │  Message Queue   │
         │   (Primary +     │    │   (Cache +       │    │   (BullMQ)       │
         │    Replicas)     │    │    Sessions)     │    │                  │
         └──────────────────┘    └──────────────────┘    └──────────────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │  Worker Processes│
                                   │  - Photo Upload  │
                                   │  - AI Analysis   │
                                   │  - Thumbnails    │
                                   └──────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │  Event Streaming │
                                   │  (Kafka/Redis    │
                                   │   Streams)       │
                                   └──────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │  Monitoring      │    │  Logging         │    │  Analytics       │
         │  (Prometheus +   │    │  (ELK/Loki +     │    │  (Custom +       │
         │   Grafana)       │    │   Jaeger)        │    │   CloudFlare)    │
         └──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Directory Structure

```
rawbox/
├── frontend/                          # Frontend application
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── gallery/             # Gallery-specific components
│   │   │   ├── admin/               # Admin panel components
│   │   │   └── auth/                # Authentication components
│   │   ├── services/                # API client services
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── contexts/                # React contexts
│   │   ├── utils/                   # Utility functions
│   │   ├── i18n/                    # Internationalization
│   │   │   ├── locales/            # Translation files
│   │   │   │   ├── en.json
│   │   │   │   ├── hi.json
│   │   │   │   ├── ta.json
│   │   │   │   ├── ar.json
│   │   │   │   └── ...
│   │   │   └── config.ts
│   │   ├── styles/                  # Global styles
│   │   ├── types/                   # TypeScript types
│   │   ├── App.tsx                  # Root component
│   │   └── main.tsx                 # Entry point
│   ├── public/                      # Static assets
│   ├── tests/                       # Frontend tests
│   ├── Dockerfile                   # Frontend container
│   ├── nginx.conf                   # nginx configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── backend/                          # Backend application
│   ├── src/
│   │   ├── routes/                  # API route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── gallery.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── ...
│   │   ├── controllers/             # Request handlers
│   │   ├── services/                # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── rbac.service.ts
│   │   │   ├── storage.service.ts  # CloudFlare R2
│   │   │   ├── payment.service.ts
│   │   │   └── ...
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── ...
│   │   ├── models/                  # Database models
│   │   ├── utils/                   # Utility functions
│   │   ├── config/                  # Configuration
│   │   ├── workers/                 # Background workers
│   │   │   ├── upload.worker.ts
│   │   │   ├── ai.worker.ts
│   │   │   └── thumbnail.worker.ts
│   │   ├── db/                      # Database utilities
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── index.ts                 # Entry point
│   ├── tests/                       # Backend tests
│   ├── Dockerfile                   # Backend container
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── infrastructure/                   # Infrastructure as code
│   ├── docker/
│   │   ├── docker-compose.yml       # Development
│   │   ├── docker-compose.prod.yml  # Production
│   │   └── docker-compose.test.yml  # Testing
│   ├── nginx/
│   │   ├── nginx.conf               # Main config
│   │   ├── ssl/                     # SSL certificates
│   │   └── conf.d/                  # Additional configs
│   ├── monitoring/
│   │   ├── prometheus.yml
│   │   ├── grafana/
│   │   └── alertmanager.yml
│   └── scripts/
│       ├── backup.sh
│       ├── restore.sh
│       └── deploy.sh
│
├── docs/                            # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   └── RBAC.md
│
├── .github/                         # CI/CD
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── test.yml
│
├── package.json                     # Root package.json
├── .gitignore
├── .env.example
└── README.md
```

## Components and Interfaces

### Frontend Components

#### 1. Core Application Structure

**App.tsx**
- Root component with routing
- Authentication state management
- Theme provider
- i18n provider
- WebSocket connection manager

**Layout Components**
- `<MainLayout>`: Primary application layout with sidebar
- `<AuthLayout>`: Authentication pages layout
- `<AdminLayout>`: Admin panel layout
- `<PublicLayout>`: Public gallery view layout

#### 2. Authentication Components

**Login/Register**
- Multi-language support
- Country selection
- Email/password authentication
- OAuth integration (Google, Facebook)
- Two-factor authentication

**Password Reset**
- Email-based reset flow
- Secure token validation
- Password strength indicator

#### 3. Gallery Components

**GalleryGrid**
- Virtual scrolling for 1000+ photos
- Lazy loading with intersection observer
- Bulk selection
- Drag-and-drop reordering

**PhotoViewer**
- Full-screen photo viewer
- Swipe gestures for mobile
- Zoom and pan
- Download and share actions

**AlbumDesigner**
- Drag-and-drop layout builder
- Print template selection
- Real-time preview
- Export to PDF

#### 4. Admin Components

**UserManagement**
- User list with filtering
- Role assignment interface
- Bulk operations
- User activity logs

**RoleManagement**
- Role template library
- Custom role builder
- Permission comparison view
- Role assignment history

**Analytics Dashboard**
- Key metrics cards
- Time-series charts
- Geographic distribution map
- Export functionality

#### 5. Settings Components

**UserSettings**
- Language selector (13 languages)
- Currency selector (15 currencies)
- Timezone selector
- Theme toggle (light/dark)
- Notification preferences

**TenantSettings**
- Branding configuration
- Domain management
- Payment gateway setup
- Tax configuration

### Backend API Structure

#### 1. Authentication & Authorization

**POST /api/v1/auth/register**
```typescript
Request: {
  email: string;
  password: string;
  country: string;
  language?: string;
  currency?: string;
}
Response: {
  user: User;
  token: string;
  refreshToken: string;
}
```

**POST /api/v1/auth/login**
```typescript
Request: {
  email: string;
  password: string;
}
Response: {
  user: User;
  token: string;
  refreshToken: string;
  tenant: Tenant;
}
```

**POST /api/v1/auth/refresh**
```typescript
Request: {
  refreshToken: string;
}
Response: {
  token: string;
  refreshToken: string;
}
```

#### 2. Gallery Management

**GET /api/v1/galleries**
```typescript
Query: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'date' | 'name' | 'views';
  order?: 'asc' | 'desc';
}
Response: {
  galleries: Gallery[];
  total: number;
  page: number;
  pages: number;
}
```

**POST /api/v1/galleries**
```typescript
Request: {
  name: string;
  description?: string;
  isPrivate: boolean;
  password?: string;
}
Response: {
  gallery: Gallery;
}
```

**POST /api/v1/galleries/:id/photos**
```typescript
Request: FormData {
  files: File[];
  tags?: string[];
}
Response: {
  uploadId: string;
  status: 'queued';
}
```

#### 3. RBAC Management

**GET /api/v1/admin/roles**
```typescript
Response: {
  roles: Role[];
  templates: RoleTemplate[];
}
```

**POST /api/v1/admin/roles**
```typescript
Request: {
  name: string;
  description: string;
  permissions: string[];
  baseTemplate?: string;
}
Response: {
  role: Role;
}
```

**POST /api/v1/admin/users/:userId/roles**
```typescript
Request: {
  roleIds: string[];
}
Response: {
  user: User;
  roles: Role[];
}
```

#### 4. Payment & Billing

**POST /api/v1/billing/subscribe**
```typescript
Request: {
  planId: string;
  paymentMethodId: string;
  billingCycle: 'monthly' | 'annual';
}
Response: {
  subscription: Subscription;
  invoice: Invoice;
}
```

**GET /api/v1/billing/invoices**
```typescript
Response: {
  invoices: Invoice[];
}
```

#### 5. Analytics

**GET /api/v1/analytics/dashboard**
```typescript
Query: {
  startDate: string;
  endDate: string;
  metrics: string[];
}
Response: {
  metrics: {
    totalViews: number;
    totalDownloads: number;
    activeUsers: number;
    storageUsed: number;
  };
  timeSeries: TimeSeriesData[];
  geographic: GeographicData[];
}
```

### Database Models

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  country: string;
  language: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark';
  tenantId: string;
  roles: string[];  // Role IDs
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Tenant Model
```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: string;
  ownerId: string;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'suspended' | 'cancelled';
  storageUsed: number;
  storageLimit: number;
  customDomain?: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  settings: {
    allowClientDownload: boolean;
    requireClientEmail: boolean;
    watermarkEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Role Model
```typescript
interface Role {
  id: string;
  tenantId: string;  // null for platform roles
  name: string;
  description: string;
  permissions: string[];
  isTemplate: boolean;
  baseTemplate?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Gallery Model
```typescript
interface Gallery {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  slug: string;
  isPrivate: boolean;
  passwordHash?: string;
  coverPhotoId?: string;
  photoCount: number;
  viewCount: number;
  downloadCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Photo Model
```typescript
interface Photo {
  id: string;
  galleryId: string;
  tenantId: string;
  filename: string;
  originalUrl: string;  // CloudFlare R2 URL
  thumbnailUrl: string;  // CloudFlare R2 URL
  optimizedUrl: string;  // CloudFlare R2 URL
  fileSize: number;
  width: number;
  height: number;
  mimeType: string;
  exifData?: object;
  tags: string[];
  faces: FaceDetection[];
  aiAnalysis?: object;
  viewCount: number;
  downloadCount: number;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
}
```

## Data Models

### CloudFlare R2 Storage Structure

```
Bucket: rawbox-production
├── tenants/
│   ├── {tenantId}/
│   │   ├── galleries/
│   │   │   ├── {galleryId}/
│   │   │   │   ├── originals/
│   │   │   │   │   └── {photoId}.jpg
│   │   │   │   ├── thumbnails/
│   │   │   │   │   └── {photoId}_thumb.jpg
│   │   │   │   └── optimized/
│   │   │   │       └── {photoId}_opt.webp
│   │   ├── avatars/
│   │   │   └── {userId}.jpg
│   │   └── branding/
│   │       └── logo.png
│   └── backups/
│       ├── database/
│       │   ├── full/
│       │   │   └── backup_2024-01-01.sql.gz
│       │   └── incremental/
│       │       └── wal_2024-01-01_12-00.tar.gz
│       └── media/
│           └── tenant_{tenantId}_2024-01-01.tar.gz
```

### Redis Cache Structure

```
Keys:
- session:{sessionId} → Session data (TTL: 24h)
- user:{userId}:preferences → User settings (TTL: 1h)
- gallery:{galleryId}:metadata → Gallery info (TTL: 1h)
- photo:{photoId}:metadata → Photo info (TTL: 6h)
- tenant:{tenantId}:config → Tenant settings (TTL: 1h)
- analytics:{tenantId}:{date} → Daily analytics (TTL: 7d)
- ratelimit:{ip}:{endpoint} → Rate limit counter (TTL: 1m)
```

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  country VARCHAR(2) NOT NULL,
  language VARCHAR(5) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(10) DEFAULT 'light',
  tenant_id UUID REFERENCES tenants(id),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_country ON users(country);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(2) NOT NULL,
  owner_id UUID REFERENCES users(id),
  subscription_plan VARCHAR(50) NOT NULL,
  subscription_status VARCHAR(20) DEFAULT 'active',
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT NOT NULL,
  custom_domain VARCHAR(255),
  branding JSONB,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX idx_tenants_country ON tenants(country);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL,
  is_template BOOLEAN DEFAULT false,
  base_template VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_is_template ON roles(is_template);

-- User Roles junction table
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Galleries table
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  password_hash VARCHAR(255),
  cover_photo_id UUID,
  photo_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_galleries_tenant_id ON galleries(tenant_id);
CREATE INDEX idx_galleries_created_by ON galleries(created_by);
CREATE INDEX idx_galleries_slug ON galleries(slug);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  optimized_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  exif_data JSONB,
  tags TEXT[],
  faces JSONB,
  ai_analysis JSONB,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_photos_gallery_id ON photos(gallery_id);
CREATE INDEX idx_photos_tenant_id ON photos(tenant_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_photos_tags ON photos USING GIN(tags);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_gateway VARCHAR(50) NOT NULL,
  payment_method_id VARCHAR(255),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
    timestamp: string;
  };
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Authentication (1xxx)
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  TOKEN_INVALID = 'AUTH_1003',
  EMAIL_NOT_VERIFIED = 'AUTH_1004',
  TWO_FACTOR_REQUIRED = 'AUTH_1005',
  
  // Authorization (2xxx)
  INSUFFICIENT_PERMISSIONS = 'AUTHZ_2001',
  RESOURCE_NOT_FOUND = 'AUTHZ_2002',
  TENANT_MISMATCH = 'AUTHZ_2003',
  
  // Validation (3xxx)
  INVALID_INPUT = 'VAL_3001',
  MISSING_REQUIRED_FIELD = 'VAL_3002',
  INVALID_FORMAT = 'VAL_3003',
  
  // Rate Limiting (4xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_4001',
  
  // Storage (5xxx)
  STORAGE_LIMIT_EXCEEDED = 'STORAGE_5001',
  FILE_TOO_LARGE = 'STORAGE_5002',
  INVALID_FILE_TYPE = 'STORAGE_5003',
  
  // Payment (6xxx)
  PAYMENT_FAILED = 'PAYMENT_6001',
  SUBSCRIPTION_EXPIRED = 'PAYMENT_6002',
  INVALID_PAYMENT_METHOD = 'PAYMENT_6003',
  
  // Server (9xxx)
  INTERNAL_ERROR = 'SERVER_9001',
  SERVICE_UNAVAILABLE = 'SERVER_9002',
  DATABASE_ERROR = 'SERVER_9003',
}
```

### Error Handling Middleware

```typescript
// backend/src/middleware/errorHandler.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.id;
  const timestamp = new Date().toISOString();
  
  // Log error
  logger.error({
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Determine status code and error code
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorCode = ErrorCode.INVALID_INPUT;
    message = err.message;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorCode = ErrorCode.INVALID_CREDENTIALS;
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorCode = ErrorCode.RESOURCE_NOT_FOUND;
    message = err.message;
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
    message = err.message;
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      requestId,
      timestamp,
    },
  });
};
```

## Testing Strategy

### Unit Testing

**Frontend Unit Tests (Vitest + React Testing Library)**
- Component rendering tests
- Hook behavior tests
- Utility function tests
- Service layer tests
- Minimum 80% code coverage

**Backend Unit Tests (Vitest)**
- Controller logic tests
- Service layer tests
- Middleware tests
- Utility function tests
- Minimum 90% code coverage

### Integration Testing

**API Integration Tests**
- End-to-end API flow tests
- Database integration tests
- Redis integration tests
- CloudFlare R2 integration tests
- Payment gateway integration tests

**Frontend Integration Tests**
- Multi-component interaction tests
- API client integration tests
- State management tests
- Routing tests

### End-to-End Testing

**User Workflows (Playwright/Cypress)**
- User registration and login
- Gallery creation and photo upload
- Photo viewing and downloading
- Admin panel operations
- Payment and subscription flows
- Multi-language switching
- Mobile responsive tests

### Performance Testing

**Load Testing (k6)**
- 10,000 concurrent users
- 1,000 RPS sustained load
- 5,000 RPS peak load
- Photo upload performance
- API response time benchmarks

### Security Testing

**Automated Security Scans**
- OWASP dependency check
- SQL injection testing
- XSS vulnerability testing
- CSRF protection testing
- Authentication bypass testing
- Authorization bypass testing

This design document will continue in the next message due to length constraints...