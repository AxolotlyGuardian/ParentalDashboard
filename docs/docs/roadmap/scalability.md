# Scalability Plan

Axolotly is designed to scale from hundreds to millions of users through strategic architecture, infrastructure, and optimization decisions.

## Current Scale

**MVP Capacity:**
- 100-1,000 concurrent parent users
- 1,000-10,000 paired launcher devices
- 100,000+ titles in database
- Single-instance deployment

## Scaling Milestones

### Milestone 1: 10,000 Families (Year 1)

**Infrastructure:**
- Vertical scaling (larger database instance)
- Redis caching layer
- CDN for static assets
- Load balancer for API

**Database:**
- Connection pooling (20-50 connections)
- Read replicas for analytics queries
- Query optimization and indexing

**Expected Load:**
- ~500 API requests/second peak
- ~10 GB database size
- ~100 GB media storage (cached posters)

### Milestone 2: 100,000 Families (Year 2)

**Infrastructure:**
- Horizontal API scaling (5-10 instances)
- Distributed Redis cluster
- S3 or equivalent for media storage
- Global CDN

**Database:**
- Primary + 2 read replicas
- Automated failover
- Point-in-time recovery
- ~100 GB database size

**Optimization:**
- Database query optimization
- API response caching
- Image lazy loading and compression
- Background job queues

**Expected Load:**
- ~5,000 API requests/second peak
- ~100 GB database size
- ~1 TB media storage

### Milestone 3: 1,000,000 Families (Year 3-5)

**Infrastructure:**
- Auto-scaling API cluster (50-100 instances)
- Multi-region deployment
- Kubernetes orchestration
- Microservices architecture (optional)

**Database:**
- Database sharding by family_id
- 10+ read replicas
- Disaster recovery plan
- ~1 TB database size

**Performance:**
- Sub-100ms API response times
- 99.99% uptime SLA
- Global edge caching
- Real-time policy updates

**Expected Load:**
- ~50,000 API requests/second peak
- ~1 TB database size
- ~10 TB media storage

## Scaling Strategies

### Horizontal API Scaling

**Stateless Design:**
- No server-side sessions
- JWT for authentication
- Shared Redis cache
- Load balancer distribution

**Auto-Scaling Rules:**
```
if cpu_usage > 70% for 5 minutes:
    scale_up(1 instance)

if cpu_usage < 30% for 10 minutes:
    scale_down(1 instance)
```

### Database Scaling

**Vertical First:**
- Increase CPU/RAM before sharding
- Optimize queries with EXPLAIN
- Add indexes strategically

**Read Replicas:**
- Analytics queries → replicas
- Content search → replicas
- Policy updates → primary

**Sharding (If Needed):**
- Shard by `family_id`
- Each shard: 100K-1M families
- Application-level routing

### Caching Strategy

**Three-Tier Caching:**

1. **Application Memory** (Seconds)
   - Recent TMDB results
   - Active user sessions

2. **Redis** (Minutes to Hours)
   - TMDB API responses
   - Content metadata
   - User profiles

3. **PostgreSQL** (Permanent)
   - Full content database
   - Episode information
   - Deep links

### Content Delivery

**CDN for Media:**
- Poster images
- Backdrop images
- Static assets
- Regional edge caching

**Image Optimization:**
- WebP format
- Progressive loading
- Responsive sizes
- Lazy loading

## Cost Projections

### Infrastructure Costs

**10K Families:**
- API Servers: $200/month
- Database: $300/month
- CDN: $50/month
- Total: ~$550/month (~$0.055/family)

**100K Families:**
- API Servers: $1,500/month
- Database: $2,000/month
- CDN: $500/month
- Total: ~$4,000/month (~$0.04/family)

**1M Families:**
- API Servers: $10,000/month
- Database: $15,000/month
- CDN: $3,000/month
- Total: ~$28,000/month (~$0.028/family)

**Economies of Scale:** Cost per family decreases with growth

### API Cost Optimization

**TMDB API:**
- Free tier: 40 req/10s
- Caching reduces usage 95%
- Paid tier: $20-100/month

**Movie of the Night:**
- One-time backfill: $100
- Crowdsourced updates: Free
- Minimal ongoing cost

## Performance Monitoring

**Key Metrics:**
- API response time (p50, p95, p99)
- Database query time
- Cache hit rate
- Error rate
- Uptime percentage

**Tools:**
- Application Performance Monitoring (APM)
- Database query analyzer
- Error tracking (Sentry)
- Uptime monitoring

## Disaster Recovery

**Backup Strategy:**
- Automated daily database backups
- 30-day retention
- Cross-region backup storage
- Point-in-time recovery

**Failover Plan:**
- Database automatic failover
- Multi-region API deployment
- CDN redundancy
- 15-minute RTO (Recovery Time Objective)

## Security at Scale

**Rate Limiting:**
- 100 requests/minute per user
- DDoS protection
- API key rotation

**Compliance:**
- GDPR data protection
- COPPA child privacy
- SOC 2 certification (roadmap)

---

Axolotly's scalability plan ensures the platform can grow from hundreds to millions of families while maintaining performance, reliability, and cost efficiency.
