# Security

Axolotly implements industry-standard security practices to protect user data, authenticate users securely, and prevent unauthorized access.

## Authentication & Authorization

### JWT (JSON Web Tokens)

**Token Generation:**
- HS256 algorithm
- 24-hour expiration for parent tokens
- 90-day expiration for device tokens
- Secret key stored securely in environment variables

**Token Claims:**
```json
{
  "sub": "user@example.com",
  "role": "parent",
  "exp": 1734567890
}
```

### Password Security

**bcrypt Hashing:**
- 10 salt rounds (2^10 iterations)
- Computationally expensive to crack
- Resistant to rainbow table attacks

**Password Requirements:**
- Minimum 8 characters
- No maximum length
- No complexity requirements (user choice)

### PIN Security

**Kid Profile PINs:**
- 4-digit numeric codes
- bcrypt hashed (same as passwords)
- Simple for children, secure storage

## Data Protection

### At Rest

**Database Encryption:**
- PostgreSQL with encrypted storage
- Replit-managed encryption
- No plaintext sensitive data

**Secrets Management:**
- API keys in Replit Secrets
- Environment variables never committed to code
- Rotation supported

### In Transit

**HTTPS Everywhere:**
- All HTTP traffic encrypted with TLS
- Certificate managed by hosting platform
- No unencrypted endpoints

## Access Control

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Parent** | Own family data, policies, devices |
| **Kid** | Own profile content only |
| **Admin** | All system data (read-only for user data) |

### Data Isolation

**Family-Level Isolation:**
- Parents can only access their own data
- Database queries filter by family_id
- No cross-family data leaks

**Profile-Level Isolation:**
- Kids can only access their approved content
- Devices tied to specific profiles
- No sibling data exposure

## Input Validation

### Pydantic Validation

**Type Safety:**
```python
from pydantic import BaseModel, EmailStr, constr

class SignupRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
```

**SQL Injection Prevention:**
- SQLAlchemy ORM parameterized queries
- No raw SQL with user input
- Automatic escaping

### Cross-Site Scripting (XSS)

**React Auto-Escaping:**
- React escapes by default
- No `dangerouslySetInnerHTML` usage
- Sanitized user-generated content

## CORS Protection

**Allowed Origins:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://axolotly.com",
        "https://www.axolotly.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## Security Best Practices

### Password Storage
✅ bcrypt with 10 rounds  
✅ Never log passwords  
✅ Never transmit in URL params  

### API Keys
✅ Environment variables only  
✅ Never commit to repository  
✅ Rotate regularly  

### Session Management
✅ JWT with expiration  
✅ No persistent sessions  
✅ Logout invalidates client token  

### Error Handling
✅ Generic error messages to users  
✅ Detailed errors logged server-side  
✅ No stack traces exposed  

---

Axolotly's security architecture protects user data through encryption, secure authentication, and strict access controls at every level.
