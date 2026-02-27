# Property Pulse - Agent Documentation

## Project Overview

**Property Pulse** is a real estate lead discovery app that helps agents find property matches based on custom criteria. Users define search parameters (location, price, property type, keywords) and get notified when matching properties are found.

- **Type:** React Web App + Supabase (Backend-as-a-Service)
- **Target Users:** Real estate agents, specifically niche-focused realtors (assisted living, small biz conversions, etc.)
- **Core Value:** Agent-powered property lead discovery with custom criteria matching and notifications

---

## Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **State:** React Context (UserContext)
- **Deployment:** Vercel (configured)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Edge Functions:** Supabase Edge Functions (Deno)
- **RLS:** Row Level Security (built into Supabase)

### AI Integration
- **Provider:** OpenAI (GPT-4o-mini)
- **Deployment:** Supabase Edge Function
- **Purpose:** Analyze criteria and suggest improvements

---

## Project Structure

```
property-pulse/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Navbar.jsx
│   ├── context/          # React contexts
│   │   └── UserContext.jsx
│   ├── lib/              # Utilities
│   │   ├── supabase.js   # Supabase client
│   │   ├── agent.js      # AI agent client
│   │   └── scanner.js    # Property scanner (mock)
│   ├── pages/            # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── CriteriaPage.jsx
│   │   ├── MatchesPage.jsx
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── config.toml       # Local dev config
│   ├── schema.sql        # Database schema
│   └── functions/
│       └── agent/
│           └── index.ts  # AI Edge Function
├── .env.example          # Environment template
├── package.json
└── vite.config.js
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Edge Functions (set in Supabase dashboard):
```env
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Database Schema

Tables (see `supabase/schema.sql`):

1. **profiles** - Extends auth.users with name, phone
2. **criteria** - User search criteria (property type, location, price, keywords)
3. **matches** - Found properties matching criteria
4. **notifications** - User notifications for new matches

### Key Columns

**profiles:**
- `id` - UUID (FK to auth.users)
- `name` - User's display name
- `email` - User's email
- `phone` - For SMS notifications

**criteria:**
- `id` - UUID (auto-generated)
- `user_id` - UUID (FK to profiles)
- `name` - Display name for criteria
- `property_type` - house, apartment, condo, etc.
- `location` - City/zip/county
- `price_min`, `price_max` - Price range
- `beds_min`, `baths_min` - Min requirements
- `keywords` - Comma-separated signals (e.g., "assisted living, ADA")
- `sources` - Array (zillow, redfin)
- `active` - Boolean (runs in background scan)
- `last_scanned_at` - Last time scan ran
- `created_at` - Creation timestamp

**matches:**
- `id` - UUID
- `criteria_id` - FK to criteria
- `property` - JSONB (address, price, beds, baths, source, etc.)
- `match_reason` - Why it matched
- `confidence` - high, medium, low
- `confidence_reason` - Explanation of confidence score
- `search_strategy` - How it was found
- `sources_searched` - Which sources were checked
- `found_at` - When match was found
- `notified` - Whether user was notified

---

## User Flows

### 1. Authentication
```
Landing → Login/Register → Dashboard
```

- Login via Supabase Auth (email/password)
- Magic link supported

### 2. Create Criteria
```
Dashboard → Criteria → Fill Form → Save → AI Analyzes → Store
```

- User fills in property type, location, price, keywords
- On save, AI Edge Function analyzes and suggests improvements
- Suggestions stored in `ai_suggestions` column

### 3. Run Scan
```
Dashboard → Run Scan → scanner.js → Save Matches
```

- Mock scanner (for demo)
- Matches properties against criteria
- Saves to `matches` table

### 4. View Matches
```
Dashboard → Matches → View Properties
```

- Lists all matches for user's criteria
- Confidence score and match reason shown

---

## AI Agent Integration

### Edge Function: `agent`

**Endpoint:** `/functions/v1/agent`

**Actions:**
- `analyze` - Analyze criteria, suggest improvements
- `insights` - Generate market insights

**Request:**
```json
{
  "action": "analyze",
  "criteria": {
    "name": "Assisted Living - DFW",
    "location": "Arlington, TX",
    "price_min": 300000,
    "price_max": 600000,
    "keywords": "assisted living, care home"
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "keyword_addition",
      "priority": "high",
      "description": "Add 'ADA' to catch more properties",
      "suggested_value": "assisted living, care home, ADA"
    }
  ],
  "estimated_match_rate": "medium",
  "reasoning": "..."
}
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:
- `profiles`: User sees own row
- `criteria`: User sees own rows
- `matches`: User sees matches for their criteria
- `notifications`: User sees own notifications

---

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase local:**
   ```bash
   supabase start
   ```

3. **Run schema:**
   ```bash
   psql -h localhost -p 54322 -U postgres -f supabase/schema.sql
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

---

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

### Edge Function
```bash
supabase functions deploy agent --no-verify-jwt
```

### Set secrets
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## API Reference

### Supabase Client

```javascript
import { supabase } from './lib/supabase';

// Get criteria
const { data } = await supabase
  .from('criteria')
  .select('*')
  .eq('user_id', user.id);

// Get matches
const { data } = await supabase
  .from('matches')
  .select('*')
  .in('criteria_id', criteriaIds);
```

### AI Agent Client

```javascript
import { analyzeCriteria } from './lib/agent';

const result = await analyzeCriteria({
  name: 'My Criteria',
  location: 'Dallas, TX',
  keywords: 'assisted living'
});
```

### Property Scanner

```javascript
import { scanProperties } from './lib/scanner';

const matches = await scanProperties(criteria);
// Returns array of { property, confidence, match_reason }
```

---

## Common Tasks

### Add a new page
1. Create `src/pages/NewPage.jsx`
2. Add route in `App.jsx`
3. Add nav link in `Navbar.jsx`

### Modify database
1. Edit `supabase/schema.sql`
2. Run in Supabase SQL Editor
3. Update this AGENT.md if schema changes

### Add AI analysis to new feature
```javascript
import { analyzeCriteria } from '../lib/agent';

const result = await analyzeCriteria(criteriaObject);
// result has suggestions, estimated_match_rate, reasoning
```

---

## Gotchas

- Edge Function needs `OPENAI_API_KEY` secret set in Supabase
- Scanner is mock data (not real property APIs)
- RLS requires proper policy setup for each table
- Supabase anon key is public-safe; service role key is secret

---

## Questions?

Check the spec at `/home/suruat/clawd/property-pulse-spec.md` or ask Taurus.