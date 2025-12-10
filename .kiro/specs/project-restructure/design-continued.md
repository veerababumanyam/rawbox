# Design Document (Continued)

## Deployment Architecture

### Production Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    CloudFlare Global Network                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   CDN Edge   │  │  R2 Storage  │  │  DDoS/WAF    │         │
│  │  (200+ PoPs) │  │  (Multi-AZ)  │  │  Protection  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Region: Primary (US-East)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Load Balancer (nginx + Keepalived)           │  │
│  │                    (Active-Active HA)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                    │                 │
│           ▼                                    ▼                 │
│  ┌──────────────────┐            ┌──────────────────────┐      │
│  │  Frontend (x2)   │            │  Backend API (x3)    │      │
│  │  nginx + React   │            │  Node.js/Express     │      │
│  │  - Container 1   │            │  - Instance 1        │      │
│  │  - Container 2   │            │  - Instance 2        │      │
│  └──────────────────┘            │  - Instance 3        │      │
│                                   └──────────────────────┘      │
│                                              │                   │
│           ┌──────────────────────────────────┼──────────────┐  │
│           │                                  │              │  │
│           ▼                                  ▼              ▼  │
│  ┌──────────────────┐    ┌──────────────────┐  ┌──────────────┐
│  │   PostgreSQL     │    │   Redis Cluster  │  │  Workers (x5)│
│  │   Primary        │    │   - Master (x3)  │  │  BullMQ      │
│  │   + Replicas (x2)│    │   - Sentinel (x3)│  │              │
│  └──────────────────┘    └──────────────────┘  └──────────────┘
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  WAL Archive     │    │  Kafka Cluster   │                  │
│  │  (CloudFlare R2) │    │  (3 Brokers)     │                  │
│  └──────────────────┘    └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Region: Secondary (EU-West)                    │
│                    (Read Replicas + Failover)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Container Orchestration

**Docker Compose Production Configuration**

```yaml
# infrastructure/docker/docker-compose.prod.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ../../frontend
      dockerfile: Dockerfile
      target: production
    image: rawbox/frontend:${VERSION}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - frontend-network

  # Backend API
  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile
      target: production
    image: rawbox/backend:${VERSION}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      R2_ENDPOINT: ${R2_ENDPOINT}
      R2_ACCESS_KEY: ${R2_ACCESS_KEY}
      R2_SECRET_KEY: ${R2_SECRET_KEY}
      JWT_SECRET: ${JWT_SECRET}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - backend-network
      - database-network
      - cache-network

  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../../infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../../infrastructure/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - frontend-network
      - backend-network

  # PostgreSQL Primary
  postgres-primary:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: rawbox
    volumes:
      - postgres-primary-data:/var/lib/postgresql/data
      - ../../backend/src/db/migrations:/docker-entrypoint-initdb.d
    command: >
      postgres
      -c wal_level=replica
      -c max_wal_senders=10
      -c max_replication_slots=10
      -c hot_standby=on
    networks:
      - database-network

  # PostgreSQL Replica 1
  postgres-replica-1:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGUSER: ${POSTGRES_USER}
      PGPASSWORD: ${POSTGRES_PASSWORD}
    command: >
      bash -c "
      until pg_basebackup --pgdata=/var/lib/postgresql/data -R --slot=replication_slot_1 --host=postgres-primary --port=5432
      do
        echo 'Waiting for primary to connect...'
        sleep 1s
      done
      echo 'Backup done, starting replica...'
      chmod 0700 /var/lib/postgresql/data
      postgres
      "
    depends_on:
      - postgres-primary
    networks:
      - database-network

  # Redis Sentinel Cluster
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-master-data:/data
    networks:
      - cache-network

  redis-sentinel-1:
    image: redis:7-alpine
    command: >
      bash -c "
      echo 'sentinel monitor mymaster redis-master 6379 2' > /tmp/sentinel.conf &&
      echo 'sentinel auth-pass mymaster ${REDIS_PASSWORD}' >> /tmp/sentinel.conf &&
      echo 'sentinel down-after-milliseconds mymaster 5000' >> /tmp/sentinel.conf &&
      echo 'sentinel parallel-syncs mymaster 1' >> /tmp/sentinel.conf &&
      echo 'sentinel failover-timeout mymaster 10000' >> /tmp/sentinel.conf &&
      redis-sentinel /tmp/sentinel.conf
      "
    depends_on:
      - redis-master
    networks:
      - cache-network

  # Kafka Cluster
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - kafka-network

  kafka-1:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-1:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
    networks:
      - kafka-network

  # Worker Processes
  worker:
    build:
      context: ../../backend
      dockerfile: Dockerfile
      target: production
    image: rawbox/backend:${VERSION}
    command: node dist/workers/index.js
    deploy:
      replicas: 5
    environment:
      NODE_ENV: production
      WORKER_TYPE: all
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      R2_ENDPOINT: ${R2_ENDPOINT}
      R2_ACCESS_KEY: ${R2_ACCESS_KEY}
      R2_SECRET_KEY: ${R2_SECRET_KEY}
    networks:
      - backend-network
      - database-network
      - cache-network

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ../../infrastructure/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ../../infrastructure/monitoring/grafana:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    networks:
      - monitoring-network

networks:
  frontend-network:
  backend-network:
  database-network:
  cache-network:
  kafka-network:
  monitoring-network:

volumes:
  postgres-primary-data:
  postgres-replica-1-data:
  redis-master-data:
  prometheus-data:
  grafana-data:
```

## Internationalization (i18n) Implementation

### i18n Architecture

**Frontend i18n Setup (react-i18next)**

```typescript
// frontend/src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: [
      'en', 'hi', 'ta', 'bn', 'te', 'mr', 
      'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'ar'
    ],
    ns: ['common', 'gallery', 'admin', 'settings', 'errors'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
```

**Translation File Structure**

```json
// frontend/public/locales/en/common.json
{
  "app": {
    "name": "RawBox",
    "tagline": "Professional Photography Gallery Platform"
  },
  "nav": {
    "dashboard": "Dashboard",
    "galleries": "Galleries",
    "clients": "Clients",
    "settings": "Settings",
    "logout": "Logout"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "upload": "Upload",
    "download": "Download",
    "share": "Share"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred",
    "loading": "Loading..."
  }
}
```

```json
// frontend/public/locales/hi/common.json
{
  "app": {
    "name": "रॉबॉक्स",
    "tagline": "पेशेवर फोटोग्राफी गैलरी प्लेटफॉर्म"
  },
  "nav": {
    "dashboard": "डैशबोर्ड",
    "galleries": "गैलरी",
    "clients": "ग्राहक",
    "settings": "सेटिंग्स",
    "logout": "लॉग आउट"
  },
  "actions": {
    "save": "सहेजें",
    "cancel": "रद्द करें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "upload": "अपलोड करें",
    "download": "डाउनलोड करें",
    "share": "साझा करें"
  },
  "messages": {
    "success": "ऑपरेशन सफलतापूर्वक पूर्ण हुआ",
    "error": "एक त्रुटि हुई",
    "loading": "लोड हो रहा है..."
  }
}
```

**RTL Support for Arabic/Urdu**

```typescript
// frontend/src/utils/rtl.ts
export const RTL_LANGUAGES = ['ar', 'ur'];

export const isRTL = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language);
};

export const applyRTL = (language: string) => {
  const isRTLLang = isRTL(language);
  document.documentElement.dir = isRTLLang ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
};
```

```css
/* frontend/src/styles/rtl.css */
[dir="rtl"] {
  /* Flip flex direction */
  .flex-row {
    flex-direction: row-reverse;
  }
  
  /* Flip text alignment */
  .text-left {
    text-align: right;
  }
  
  .text-right {
    text-align: left;
  }
  
  /* Flip margins and padding */
  .ml-4 {
    margin-left: 0;
    margin-right: 1rem;
  }
  
  .mr-4 {
    margin-right: 0;
    margin-left: 1rem;
  }
  
  /* Flip icons */
  .icon-arrow-right {
    transform: scaleX(-1);
  }
}
```

**Language Switcher Component**

```typescript
// frontend/src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { applyRTL } from '@/utils/rtl';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    applyRTL(languageCode);
    
    // Save to user preferences
    await fetch('/api/v1/users/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: languageCode }),
    });
  };
  
  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      className="language-selector"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
};
```

## RBAC Implementation Details

### Permission System

**Permission Registry**

```typescript
// backend/src/rbac/permissions.ts
export enum Permission {
  // User Management
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_INVITE = 'users:invite',
  
  // Role Management
  ROLES_VIEW = 'roles:view',
  ROLES_CREATE = 'roles:create',
  ROLES_UPDATE = 'roles:update',
  ROLES_DELETE = 'roles:delete',
  ROLES_ASSIGN = 'roles:assign',
  
  // Gallery Management
  GALLERIES_VIEW = 'galleries:view',
  GALLERIES_CREATE = 'galleries:create',
  GALLERIES_UPDATE = 'galleries:update',
  GALLERIES_DELETE = 'galleries:delete',
  GALLERIES_SHARE = 'galleries:share',
  
  // Photo Management
  PHOTOS_VIEW = 'photos:view',
  PHOTOS_UPLOAD = 'photos:upload',
  PHOTOS_UPDATE = 'photos:update',
  PHOTOS_DELETE = 'photos:delete',
  PHOTOS_DOWNLOAD = 'photos:download',
  
  // Billing Management
  BILLING_VIEW = 'billing:view',
  BILLING_UPDATE = 'billing:update',
  BILLING_EXPORT = 'billing:export',
  
  // Settings Management
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Platform Admin (Super Admin only)
  PLATFORM_MANAGE_TENANTS = 'platform:manage_tenants',
  PLATFORM_MANAGE_COUNTRIES = 'platform:manage_countries',
  PLATFORM_VIEW_ALL_DATA = 'platform:view_all_data',
}

export const PermissionBundles = {
  USER_MANAGEMENT: [
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.USERS_INVITE,
  ],
  ROLE_MANAGEMENT: [
    Permission.ROLES_VIEW,
    Permission.ROLES_CREATE,
    Permission.ROLES_UPDATE,
    Permission.ROLES_DELETE,
    Permission.ROLES_ASSIGN,
  ],
  GALLERY_MANAGEMENT: [
    Permission.GALLERIES_VIEW,
    Permission.GALLERIES_CREATE,
    Permission.GALLERIES_UPDATE,
    Permission.GALLERIES_DELETE,
    Permission.GALLERIES_SHARE,
    Permission.PHOTOS_VIEW,
    Permission.PHOTOS_UPLOAD,
    Permission.PHOTOS_UPDATE,
    Permission.PHOTOS_DELETE,
  ],
  BILLING_MANAGEMENT: [
    Permission.BILLING_VIEW,
    Permission.BILLING_UPDATE,
    Permission.BILLING_EXPORT,
  ],
  READ_ONLY: [
    Permission.USERS_VIEW,
    Permission.GALLERIES_VIEW,
    Permission.PHOTOS_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_VIEW,
  ],
};
```

**Role Templates**

```typescript
// backend/src/rbac/templates.ts
export const RoleTemplates = {
  PLATFORM_SUPER_ADMIN: {
    name: 'Platform Super Admin',
    description: 'Full platform access for RawBox staff',
    permissions: Object.values(Permission),
    isTemplate: true,
    tenantId: null, // Global role
  },
  
  COUNTRY_ADMIN: {
    name: 'Country Admin',
    description: 'Manage tenants and settings for specific country',
    permissions: [
      Permission.PLATFORM_MANAGE_TENANTS,
      Permission.USERS_VIEW,
      Permission.ANALYTICS_VIEW,
      Permission.SETTINGS_VIEW,
      Permission.SETTINGS_UPDATE,
    ],
    isTemplate: true,
    tenantId: null, // Global role
  },
  
  TENANT_SUPER_ADMIN: {
    name: 'Tenant Super Admin',
    description: 'Full access to tenant account',
    permissions: [
      ...PermissionBundles.USER_MANAGEMENT,
      ...PermissionBundles.ROLE_MANAGEMENT,
      ...PermissionBundles.GALLERY_MANAGEMENT,
      ...PermissionBundles.BILLING_MANAGEMENT,
      Permission.SETTINGS_VIEW,
      Permission.SETTINGS_UPDATE,
      Permission.ANALYTICS_VIEW,
      Permission.ANALYTICS_EXPORT,
    ],
    isTemplate: true,
  },
  
  ACCOUNT_ADMIN: {
    name: 'Account Admin',
    description: 'Manage account settings and branding',
    permissions: [
      Permission.SETTINGS_VIEW,
      Permission.SETTINGS_UPDATE,
      Permission.USERS_VIEW,
      Permission.ANALYTICS_VIEW,
    ],
    isTemplate: true,
  },
  
  USER_MANAGEMENT_ADMIN: {
    name: 'User Management Admin',
    description: 'Manage users and assign roles',
    permissions: PermissionBundles.USER_MANAGEMENT,
    isTemplate: true,
  },
  
  FINANCE_ADMIN: {
    name: 'Finance/Billing Admin',
    description: 'Manage subscriptions and billing',
    permissions: PermissionBundles.BILLING_MANAGEMENT,
    isTemplate: true,
  },
  
  GALLERY_ADMIN: {
    name: 'Gallery/Content Admin',
    description: 'Manage galleries and photos',
    permissions: PermissionBundles.GALLERY_MANAGEMENT,
    isTemplate: true,
  },
  
  SUPPORT_READONLY: {
    name: 'Support/Read-Only Admin',
    description: 'Read-only access for support staff',
    permissions: PermissionBundles.READ_ONLY,
    isTemplate: true,
  },
};
```

**RBAC Middleware**

```typescript
// backend/src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { RBACService } from '@/services/rbac.service';

export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'AUTH_1001',
          message: 'Authentication required',
        },
      });
    }
    
    const hasPermission = await RBACService.checkPermission(
      userId,
      tenantId,
      permission
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'AUTHZ_2001',
          message: 'Insufficient permissions',
        },
      });
    }
    
    next();
  };
};

export const requireAnyPermission = (permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'AUTH_1001',
          message: 'Authentication required',
        },
      });
    }
    
    const hasAnyPermission = await RBACService.checkAnyPermission(
      userId,
      tenantId,
      permissions
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        error: {
          code: 'AUTHZ_2001',
          message: 'Insufficient permissions',
        },
      });
    }
    
    next();
  };
};
```

**RBAC Service**

```typescript
// backend/src/services/rbac.service.ts
export class RBACService {
  static async checkPermission(
    userId: string,
    tenantId: string | null,
    permission: Permission
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = `rbac:${userId}:${tenantId}:${permission}`;
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }
    
    // Get user roles
    const userRoles = await db.query(`
      SELECT r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND (r.tenant_id = $2 OR r.tenant_id IS NULL)
    `, [userId, tenantId]);
    
    // Aggregate permissions
    const allPermissions = new Set<string>();
    for (const role of userRoles.rows) {
      role.permissions.forEach((p: string) => allPermissions.add(p));
    }
    
    const hasPermission = allPermissions.has(permission);
    
    // Cache result for 5 minutes
    await redis.setex(cacheKey, 300, hasPermission ? 'true' : 'false');
    
    return hasPermission;
  }
  
  static async getUserPermissions(
    userId: string,
    tenantId: string | null
  ): Promise<Set<Permission>> {
    const userRoles = await db.query(`
      SELECT r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
        AND (r.tenant_id = $2 OR r.tenant_id IS NULL)
    `, [userId, tenantId]);
    
    const allPermissions = new Set<Permission>();
    for (const role of userRoles.rows) {
      role.permissions.forEach((p: Permission) => allPermissions.add(p));
    }
    
    return allPermissions;
  }
  
  static async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<void> {
    await db.query(`
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [userId, roleId, assignedBy]);
    
    // Invalidate cache
    await redis.del(`rbac:${userId}:*`);
    
    // Log audit
    await AuditService.log({
      userId: assignedBy,
      action: 'ROLE_ASSIGNED',
      resourceType: 'user',
      resourceId: userId,
      details: { roleId },
    });
  }
}
```

This continues the design document with deployment, i18n, and RBAC implementation details. Should I continue with the remaining sections (monitoring, security, payment integration, etc.)?