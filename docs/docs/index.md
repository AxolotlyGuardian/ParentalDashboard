# Axolotly Platform Documentation

**Tagline:** *Axolotly doesn't dictate what's right or wrong — it gives parents the tools to decide.*

Welcome to the complete documentation for Axolotly, a comprehensive parental control platform that empowers parents to create safe, controlled digital environments for their children.

## What is Axolotly?

Axolotly is a full-stack parental control application that combines:

- **Parent Dashboard** - Web-based control center for managing content and policies
- **Kids Launcher** - Android app that enforces parental controls on children's devices
- **Content Intelligence** - Real-time streaming service integration with TMDB
- **Episode-Level Control** - Granular content management down to individual TV episodes
- **Smart Deep Linking** - Direct streaming links for seamless content playback

## Quick Links

| Section | Description |
|---------|-------------|
| [Executive Summary](overview/executive-summary.md) | High-level platform overview for stakeholders |
| [Features](features/overview.md) | Complete feature breakdown and capabilities |
| [User Workflows](workflows/parent-workflow.md) | Step-by-step usage guides |
| [Technical Architecture](technical/architecture.md) | System design and implementation details |

## Key Differentiators

✅ **Episode-Level Granularity** - Block specific episodes, not entire shows  
✅ **Multi-Service Integration** - Works with Netflix, Disney+, Hulu, Prime Video, Max, Peacock, YouTube  
✅ **Automated Content Tagging** - 72+ content tags automatically applied based on metadata  
✅ **Crowdsourced Deep Links** - Community-powered episode streaming URLs  
✅ **Service-Filtered Discovery** - See only content from your subscribed services  
✅ **Zero-Configuration Setup** - 6-digit pairing code for instant device connection

## Platform Stack

- **Backend:** FastAPI (Python) with PostgreSQL database
- **Frontend:** Next.js 15 (React, TypeScript, Tailwind CSS)
- **Mobile:** Android Launcher (Kotlin/Java)
- **APIs:** TMDB, Movie of the Night (Streaming Availability)
- **Security:** JWT authentication, bcrypt password hashing, role-based access control

## Getting Started

For investors and stakeholders, we recommend reading the documentation in this order:

1. **[Executive Summary](overview/executive-summary.md)** - Platform overview
2. **[Problem & Solution](overview/problem-solution.md)** - Market fit and value proposition
3. **[Feature Overview](features/overview.md)** - Complete capabilities
4. **[Technical Architecture](technical/architecture.md)** - Implementation details
5. **[Roadmap](roadmap/features.md)** - Future development plans

---

*Last Updated: November 2025*
