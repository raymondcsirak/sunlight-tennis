# SunlightTennis.ro: Tennis Club Management Platform

## 📋 Project Overview

### Purpose

A user-friendly web platform designed to transform how tennis enthusiasts connect, improve, and enjoy the sport through technology-driven community engagement.

### Key Objectives

- Create an inviting digital gateway for tennis club members
- Facilitate seamless player matchmaking
- Provide intuitive court rental and booking services
- Implement an engaging gamification system
- Offer comprehensive performance tracking and analytics

## 🏗️ Technical Architecture

### Core Technologies

- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: Shadcn/UI
- **Backend Platform**: Supabase
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Storage for media files
  - Edge Functions for complex operations

### Architectural Principles

- Server Components First
- Minimal Client-Side State
- Type-Safe Interactions
- Performance-Driven Design
- Responsive and Accessible Design
- Real-time First Approach

## 📦 Project Structure

```
tennis-platform/
├── app/               # Next.js app router
│   ├── (auth)/        # Authentication routes
│   ├── (dashboard)/   # User dashboard routes
│   ├── (public)/      # Public-facing routes
│   └── landing/       # Landing page components
├── components/        # Reusable UI components
│   ├── ui/            # Shadcn/UI components
│   ├── dashboard/     # Dashboard-specific components
│   ├── auth/          # Authentication components
│   └── landing/       # Landing page specific components
├── lib/               # Utility functions
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Helper utilities
│   └── validators/    # Input validation schemas
├── server/            # Server-side logic
│   ├── actions/       # Server Actions
│   └── queries/       # Server-side data fetching
├── types/             # TypeScript type definitions
└── public/            # Static assets (images, icons, etc.)
├── tests/                 # Test cases and related utilities
├── scripts/               # Deployment/build scripts
├── .env.local             # Environment variables
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
├── Dockerfile             # Docker container configuration
├── package.json           # Project metadata and dependencies
├── README.md              # Project documentation
└── tsconfig.json          # TypeScript configuration
```

## 🔐 Authentication Strategy

### Requirements

- Secure and frictionless user registration
- Role-based access control (using Supabase RLS)
- Comprehensive profile management
- Social login options (Google, Facebook, Apple)
- Session management

### Implementation Approach

- Supabase Auth for authentication
- Row Level Security (RLS) policies for authorization
- Server-side session verification
- Minimal client-side state management
- Built-in password reset and email verification

## 🏆 Gamification System

### Skill Assessment System

#### Self-Assessment Categories

Each category is rated on a 5-level scale:

1. **Forehand**

   - Level 1: Beginner - Inconsistent contact, learning basic form
   - Level 2: Novice - Can maintain basic rallies, developing consistency
   - Level 3: Intermediate - Consistent form, can direct the ball with some power
   - Level 4: Advanced - Good control, can generate power and spin
   - Level 5: Expert - Excellent placement, variety of shots, consistent weapon

2. **Backhand**

   - Level 1: Beginner - Basic contact, learning proper grip
   - Level 2: Novice - Can return with basic consistency
   - Level 3: Intermediate - Stable form, developing directional control
   - Level 4: Advanced - Good control on both slice and topspin
   - Level 5: Expert - Reliable shot, can attack and defend effectively

3. **Serve**
   - Level 1: Beginner - Learning basic motion and toss
   - Level 2: Novice - Can get serves in, developing consistency
   - Level 3: Intermediate - Consistent first serve, developing second serve
   - Level 4: Advanced - Reliable first and second serves, some power
   - Level 5: Expert - Various serve types, can target spots effectively

### Experience (XP) System

#### XP Earning Activities

1. **Platform Engagement**

   - First Login: 100 XP
   - Daily Login Streak: 20 XP/day
   - Profile Completion: 200 XP
   - Page Visits:
     - Every 10 visits: 50 XP
     - Every 50 visits: 300 XP
     - Every 100 visits: 1000 XP

2. **Match Activity**

   - Match Participation: 100 XP
   - Match Victory: 200 XP
   - Tournament Entry: 300 XP
   - Tournament Victory: 1000 XP
   - Winning Streak Bonuses:
     - 3 matches: 500 XP
     - 5 matches: 1000 XP
     - 10 matches: 2500 XP

3. **Booking Activity**
   - First Court Booking: 100 XP
   - Every 5 Bookings: 250 XP
   - Every 20 Bookings: 1000 XP
   - Training Session Booking: 150 XP
   - Group Training Participation: 200 XP

### Trophy System

#### Platform Engagement Trophies

1. **Welcome Trophies**

   - 🎾 First Serve (First Login)
   - 📱 Digital Champion (Complete Profile)
   - 🌟 Rising Star (Reach 1000 XP)

2. **Dedication Trophies**
   - 📅 Weekly Warrior (7-day login streak)
   - 🏆 Monthly Master (30-day login streak)
   - 💫 Platform Pioneer (100 page visits)
   - 🎯 Engagement Expert (500 page visits)

#### Match Achievement Trophies

1. **Victory Trophies**

   - 🥉 Bronze Racquet (First Match Win)
   - 🥈 Silver Server (5 Match Wins)
   - 🥇 Golden Games (25 Match Wins)
   - 👑 Court King/Queen (50 Match Wins)

2. **Streak Trophies**

   - 🔥 Hot Streak (3 consecutive wins)
   - ⚡ Lightning Strike (5 consecutive wins)
   - 💫 Unstoppable (10 consecutive wins)

3. **Tournament Trophies**
   - 🏅 Tournament Debut (First Tournament Entry)
   - 🏆 Tournament Triumph (Tournament Victory)
   - 👑 Grand Slam (Win 4 Tournaments)

#### Activity Trophies

1. **Booking Achievements**

   - 📅 First Timer (First Court Booking)
   - 🎾 Regular Player (10 Court Bookings)
   - ⭐ Court Champion (50 Court Bookings)
   - 💫 Booking Master (100 Court Bookings)

2. **Training Achievements**
   - 📚 Learning Lover (First Training Session)
   - 📖 Training Enthusiast (10 Training Sessions)
   - 🎓 Training Master (25 Training Sessions)
   - 🏆 Elite Student (50 Training Sessions)

### Level System

- Players advance through levels based on XP
- Each level unlocks new features or perks
- Level Thresholds:
  - Level 1: 0 XP
  - Level 2: 1,000 XP
  - Level 3: 2,500 XP
  - Level 4: 5,000 XP
  - Level 5: 10,000 XP
  - Additional levels continue with appropriate scaling

### Design Principles

- Transparent and motivational progression system
- Persistent achievement tracking
- Encouraging user growth and community participation

## 🤝 Partner Finder System

### Match Request System

#### Creating Requests

1. **Request Details**

   - Preferred Date and Time
   - Duration (1 hour/1.5 hours/2 hours)
   - Skill Level Preferences
   - Court Preferences (if any)
   - Additional Notes

2. **Request Visibility**
   - Visible to players within ±1 skill level by default
   - Option to make request visible to all players
   - Option to make request private (invite-only)

#### Browsing Requests

1. **Filter Options**

   - Date Range
   - Time of Day
   - Skill Level
   - Court Type
   - Request Status (Open/Pending/Confirmed)

2. **Sorting Options**
   - Date (Newest/Oldest)
   - Skill Level Match (Best Match First)
   - Time of Day

### Match Confirmation Flow

1. **Request Stage**

   - Player A creates match request
   - Request appears in matching system

2. **Acceptance Stage**

   - Player B accepts request
   - Player A receives notification
   - Both players must confirm within 24 hours

3. **Confirmation Stage**
   - System automatically books court if available
   - Both players receive confirmation
   - Calendar invites sent to both players

### Post-Match System

1. **Match Result Recording**

   - Automatic notification 15 minutes after scheduled end time
   - Both players must confirm match result
   - Score entry required for XP calculation
   - Dispute resolution system if players disagree

2. **XP and Trophy Distribution**

   - Winner receives victory XP
   - Both players receive participation XP
   - Relevant trophies awarded automatically
   - Streak calculations updated

3. **Match History**
   - Result recorded in both players' histories
   - Statistics updated (win/loss ratio, total matches, etc.)
   - Achievement progress updated

## 🎾 Core Features

### 1. Comprehensive Landing Page

#### Objectives

- Create an inviting digital entry point
- Clearly communicate platform value
- Encourage user registration
- Showcase club's unique offerings

#### Key Sections

- Compelling Hero Section
  - Engaging headline
  - Platform value proposition
  - Primary call-to-action
- Club Overview
- Member Testimonials
- Feature Highlights
- Contact Information

### 2. Player Profiles

- Holistic skill assessment
- Self-rating mechanism (1-10 scale)
- Dynamic trophy showcase
- Comprehensive performance history

### 3. Partner Finder

#### Matching Algorithm

- Skill level compatibility
- Achievement-based alignment
- Flexible time slot matching

### 4. Court Rental System

- Real-time court availability
- Multi-court management
- Weather-integrated booking
- Instant confirmation mechanism

### 5. Training Sessions

- Coach availability tracking
- Skill-focused session booking
- Personalized training recommendations

### 6. Real-time Communication

- WebSocket-powered messaging
- Secure, match-based chat rooms
- Player interaction tools

## 🔄 Real-time Features Specification

### Channel Design

1. **Court Availability Channel**

```typescript
type CourtUpdate = {
  courtId: string;
  status: "available" | "booked" | "maintenance";
  lastUpdated: string;
};

// Subscribe to court updates
const courtChannel = supabase.channel("courts").on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "courts",
    filter: "status=eq.available",
  },
  (payload: CourtUpdate) => {
    // Handle court status changes
  },
);
```

2. **Match Updates Channel**

```typescript
// Subscribe to specific match updates
const matchChannel = supabase.channel(`match_${matchId}`).on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "matches",
    filter: `id=eq.${matchId}`,
  },
  (payload) => {
    // Update match score, status
  },
);
```

3. **Chat System**

```typescript
type ChatMessage = {
  roomId: string;
  userId: string;
  message: string;
  timestamp: string;
};

// Room-specific chat channel
const chatChannel = supabase.channel(`room_${roomId}`).on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "messages",
    filter: `room_id=eq.${roomId}`,
  },
  (payload: ChatMessage) => {
    // Handle new messages
  },
);
```

### Presence Features

1. **Online Players**

```typescript
type PlayerPresence = {
  user_id: string;
  status: "online" | "playing" | "away";
  last_seen: string;
};

const presenceChannel = supabase
  .channel("online_players")
  .on("presence", { event: "sync" }, () => {
    // Handle presence updates
  })
  .on("presence", { event: "join" }, ({ key, newPresences }) => {
    // Handle player joining
  })
  .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
    // Handle player leaving
  });
```

2. **Court Activity**

```typescript
type CourtPresence = {
  court_id: string;
  players: string[];
  status: "warm_up" | "playing" | "finished";
};

const courtActivityChannel = supabase
  .channel("court_activity")
  .on("presence", { event: "sync" }, () => {
    // Update court activity dashboard
  });
```

### Broadcast Channels

1. **System Announcements**

```typescript
const announcementChannel = supabase
  .channel("announcements")
  .on("broadcast", { event: "announcement" }, (payload) => {
    // Handle system-wide announcements
  });
```

2. **Tournament Updates**

```typescript
const tournamentChannel = supabase
  .channel(`tournament_${tournamentId}`)
  .on("broadcast", { event: "match_update" }, (payload) => {
    // Handle tournament match updates
  });
```

### Error Handling and Recovery

```typescript
const channel = supabase
  .channel("my_channel")
  .on("system", { event: "*" }, (status) => {
    // Handle connection status changes
  })
  .subscribe((status) => {
    if (status === "SUBSCRIBED") {
      // Channel is ready
    }
    if (status === "CLOSED") {
      // Implement retry logic
    }
    if (status === "CHANNEL_ERROR") {
      // Handle channel errors
    }
  });
```

### Performance Considerations

1. **Subscription Management**

- Implement auto-unsubscribe on component unmount
- Limit number of concurrent subscriptions
- Use broadcast channels for system-wide updates
- Implement connection pooling for multiple subscriptions

2. **Data Optimization**

- Use filters to minimize unnecessary updates
- Implement debouncing for frequent updates
- Use presence for real-time user status
- Batch updates when possible

3. **Error Recovery**

- Implement exponential backoff for reconnection
- Cache last known state
- Provide offline support
- Implement manual refresh options

## 🚀 Performance Optimization

### Server-Side Strategies

- React Server Components
- Minimal client-side JavaScript
- Efficient, cached data fetching
- Optimized server actions

### Rendering Approach

```typescript
async function LandingPage() {
  const testimonials = await getTestimonials()
  const featureHighlights = await getFeatureHighlights()

  return (
    <LandingPageComponent
      testimonials={testimonials}
      features={featureHighlights}
    />
  )
}
```

## 🛡️ Security Considerations

### Authentication

- Full OAuth2 compliance
- Advanced token management
- Granular role-based access control

### Data Protection

- Comprehensive input validation
- Server-side authorization checks
- Minimal client-side state exposure

## 📊 Performance Metrics

### Target Benchmarks

- Landing Page Load: < 1.5 seconds
- Time to Interactive: < 2 seconds
- Mobile Responsiveness: 100% compatibility
- Concurrent Users: 750+

## 🗄️ Database Schema

### Core Entities

1. **Users (Built-in Supabase Auth Users table)**

   ```sql
   -- Extended profile information
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id),
     full_name TEXT,
     skill_level INTEGER,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     PRIMARY KEY (id)
   );

   -- Enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Public profiles are viewable by everyone"
     ON profiles FOR SELECT
     USING (true);

   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = id);
   ```

2. **Courts**

   ```sql
   CREATE TABLE courts (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     name TEXT,
     surface_type TEXT,
     is_indoor BOOLEAN,
     hourly_rate DECIMAL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

3. **Bookings**

   ```sql
   CREATE TABLE bookings (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     court_id UUID REFERENCES courts(id),
     user_id UUID REFERENCES auth.users(id),
     start_time TIMESTAMP WITH TIME ZONE,
     end_time TIMESTAMP WITH TIME ZONE,
     status TEXT,
     payment_status TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

     CONSTRAINT no_overlapping_bookings
       EXCLUDE USING gist (
         court_id WITH =,
         tstzrange(start_time, end_time) WITH &&
       )
   );
   ```

4. **Matches**

   ```sql
   CREATE TABLE matches (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     booking_id UUID REFERENCES bookings(id),
     player1_id UUID REFERENCES auth.users(id),
     player2_id UUID REFERENCES auth.users(id),
     score TEXT,
     status TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

5. **Achievements**

   ```sql
   CREATE TABLE achievements (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     type TEXT,
     earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     metadata JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

### Gamification and Matchmaking Entities

6. **Match Requests**

   ```sql
   CREATE TABLE match_requests (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     creator_id UUID REFERENCES auth.users(id),
     preferred_date DATE,
     preferred_time TIME,
     duration INTERVAL,
     skill_level_min INTEGER,
     skill_level_max INTEGER,
     court_preference UUID REFERENCES courts(id),
     status TEXT DEFAULT 'open',
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

7. **Match Request Responses**

   ```sql
   CREATE TABLE match_request_responses (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     request_id UUID REFERENCES match_requests(id),
     responder_id UUID REFERENCES auth.users(id),
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

8. **Player Experience**

   ```sql
   CREATE TABLE player_experience (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     total_xp INTEGER DEFAULT 0,
     current_level INTEGER DEFAULT 1,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

9. **Player Skills**

   ```sql
   CREATE TABLE player_skills (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     forehand_level INTEGER DEFAULT 1,
     backhand_level INTEGER DEFAULT 1,
     serve_level INTEGER DEFAULT 1,
     last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

## 🔄 API Implementation

### Data Access Layer

```typescript
// Example of type-safe database queries using Supabase
type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          skill_level: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          skill_level?: number;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string;
          skill_level?: number;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      // ... other tables
    };
  };
};

// Server-side data fetching
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
```

### Real-time Subscriptions

```typescript
// Example of real-time court availability updates
supabase
  .channel("court-updates")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "bookings",
    },
    (payload) => {
      // Handle real-time updates
    },
  )
  .subscribe();
```

### Rate Limiting

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- Specific endpoints may have custom limits

## 🎯 Accessibility Requirements

### WCAG 2.1 Compliance

- Level AA compliance required
- Focus on:
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast ratios
  - Text resizing support
  - Motion/animation control

### Implementation Requirements

- Semantic HTML structure
- ARIA labels where necessary
- Skip navigation links
- Focus management
- Error announcements

## 📊 Analytics & Monitoring

### Error Tracking

- Sentry integration for error monitoring
- Custom error boundary implementation
- Structured error logging

### Performance Monitoring

- Core Web Vitals tracking
- Custom performance metrics
- Real-time monitoring dashboard

### Business Analytics

- User engagement metrics
- Court utilization rates
- Revenue tracking
- Feature usage analytics

## 💰 Payment Integration

### Stripe Implementation

- Subscription management
- One-time payments
- Automatic invoicing
- Refund processing

### Payment Policies

- 24-hour cancellation policy
- Partial refund structure
- Dispute resolution process
- Payment retry strategy

## 📱 Content Management

### Content Types

- Club news and updates
- Court maintenance schedules
- Tournament announcements
- Training program details

### Access Control

- Admin dashboard for content management
- Role-based editing permissions
- Content approval workflow
- Version history tracking
