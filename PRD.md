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

### Trophy Categories

1. **Match Achievements**

   - First Match Played
   - Consecutive Winning Streak
   - Tournament Participation
   - Skill Level Milestones

2. **Platform Engagement**

   - Newcomer Badge
   - Community Leader
   - Long-term Membership Rewards

3. **Activity Trophies**
   - Training Enthusiast
   - Court Booking Champion
   - Skill Progression Tracker

### Design Principles

- Transparent and motivational progression system
- Persistent achievement tracking
- Encouraging user growth and community participation

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
