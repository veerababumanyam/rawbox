# RawBox Documentation

Welcome to the RawBox documentation. This SaaS photography platform provides comprehensive multi-tenant gallery management with complete data isolation.

## 📚 Documentation Index

### Getting Started

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Get started in 3 steps |
| [SETUP.md](SETUP.md) | Detailed setup and installation guide |
| [SEED_DATA.md](SEED_DATA.md) | Test accounts and seed data documentation |

### Architecture & Design

| Document | Description |
|----------|-------------|
| [MULTI_TENANT_ARCHITECTURE.md](MULTI_TENANT_ARCHITECTURE.md) | SaaS multi-tenant design and implementation |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | UI components, styling, and design tokens |
| [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) | Database schema and migrations |

### Security & Compliance

| Document | Description |
|----------|-------------|
| [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md) | GDPR compliance and data protection |
| [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) | Security best practices and verification |
| [ENV_SETUP.md](ENV_SETUP.md) | Environment variables and configuration |

### Reference Guides

| Document | Description |
|----------|-------------|
| [GDPR_MULTI_TENANT_GUIDE.md](GDPR_MULTI_TENANT_GUIDE.md) | Complete multi-tenant GDPR guide |
| [SEED_DATA_GUIDE.md](SEED_DATA_GUIDE.md) | Comprehensive seed data guide |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick command reference |

### Implementation Status

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Current implementation status |
| [FIXES_APPLIED.md](FIXES_APPLIED.md) | Recent fixes and updates |
| [ROUTING_FIXES.md](ROUTING_FIXES.md) | Routing implementation details |

## 🏢 Multi-Tenant SaaS

RawBox is a **multi-tenant SaaS application** with complete data isolation:

- **3 Subscription Tiers:** User, ProUser, PowerUser
- **Complete Data Segregation:** Each company's data is 100% isolated
- **GDPR Compliant:** Full compliance with data protection regulations
- **Scalable Architecture:** Designed for thousands of tenants

## 🔐 Test Accounts

### Company 1: Luxe Photography Studios (User Tier)
```
Email: user@luxestudios.com
Password: User@123
Tier: Basic (10 albums, 25GB storage)
```

### Company 2: Creative Lens Photography (ProUser Tier)
```
Email: pro@creativelens.com
Password: ProUser@123
Tier: Professional (50 albums, 100GB storage)
```

### Company 3: Moments Capture Studio (PowerUser Tier)
```
Email: power@momentscapture.com
Password: PowerUser@123
Tier: Advanced (Unlimited albums, 500GB storage)
```

⚠️ **Development Only:** These credentials are for testing only. Never use in production!

## 📊 Quick Stats

- **Companies:** 3 test companies
- **Albums:** 12 total (4 per company)
- **Photos:** 470 total (segregated by company)
- **Clients:** 6 total (2 per company)
- **Data Isolation:** 100% GDPR compliant

## 🚀 Quick Commands

```bash
# Start development
npm run dev

# Seed database
cd server && npm run db:seed

# Build for production
npm run build

# Run tests
npm test
```

## 📖 Key Concepts

### Multi-Tenancy
Each photography company (tenant) has completely isolated data. No company can access another company's albums, photos, or clients.

### Subscription Tiers
- **User (Basic):** 10 albums, 25GB, email support
- **ProUser (Professional):** 50 albums, 100GB, priority support, custom branding
- **PowerUser (Advanced):** Unlimited albums, 500GB, 24/7 support, white-label, full API

### GDPR Compliance
- Right to access (data export)
- Right to rectification (data updates)
- Right to erasure (account deletion)
- Right to data portability (JSON/CSV export)
- Complete audit logging

## 🔍 Finding Information

### I want to...

**Get started quickly**
→ [QUICK_START.md](QUICK_START.md)

**Set up the development environment**
→ [SETUP.md](SETUP.md)

**Understand the multi-tenant architecture**
→ [MULTI_TENANT_ARCHITECTURE.md](MULTI_TENANT_ARCHITECTURE.md)

**Learn about GDPR compliance**
→ [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md)

**Use test accounts**
→ [SEED_DATA.md](SEED_DATA.md)

**Check security best practices**
→ [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

**Understand the database schema**
→ [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md)

**Learn about the design system**
→ [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

## 🆘 Support

For issues or questions:

1. Check the relevant documentation above
2. Review [QUICK_START.md](QUICK_START.md) for common issues
3. Check [FIXES_APPLIED.md](FIXES_APPLIED.md) for recent updates
4. Contact the development team

## 📝 Contributing

When adding new documentation:

1. Follow the existing naming convention (UPPERCASE_WITH_UNDERSCORES.md)
2. Add entry to this README.md index
3. Include "Last Updated" date at bottom
4. Use clear headings and code examples
5. Link to related documentation

## 🔄 Recent Updates

- **December 10, 2024:** Multi-tenant architecture implemented
- **December 10, 2024:** GDPR compliance documentation added
- **December 10, 2024:** Seed data with 3 test companies created
- **December 10, 2024:** Subscription tiers (User, ProUser, PowerUser) implemented

---

**Last Updated:** December 10, 2024
**Version:** 2.1.0
**Documentation Status:** ✅ Complete
