# Chat Persistence with React Query - Design Document

**Date:** 2025-02-19  
**Status:** Approved  
**Author:** AI Assistant

## Overview

Implement persistent chat state using React Query (TanStack Query) with 7-day cache, automatic conversation recovery, and real-time message synchronization with Supabase.

## Problem Statement

Currently, when users refresh `/chat`, all conversation state is lost:
- Messages disappear
- Generated itineraries vanish
- User must start over

This creates a poor UX and prevents users from continuing conversations across sessions.

## Goals

1. **Automatic Recovery**: Load last active conversation when user visits `/chat`
2. **Real-time Persistence**: Save each message immediately to Supabase
3. **7-Day Cache**: React Query caches data locally for 1 week
4. **Multiple Itineraries**: One conversation can generate multiple itineraries
5. **Optimistic Updates**: Instant UI feedback with background sync

## Architecture

### Technology Stack

- **React Query v5**: Data fetching, caching, synchronization
- **Zustand**: UI state (loading, animations, temporary state)
- **Supabase**: Persistent storage (source of truth)
- **Optimistic Updates**: Immediate UI updates with rollback on error

### Data Flow

```
User sends message
  ↓
Zustand updates UI immediately (optimistic)
  ↓
React Query mutation saves to Supabase
  ↓
On success: React Query caches for 7 days
On error: Zustand rolls back
```

## Database Schema Changes

### 1. Remove conversations.itinerary_id

```sql
ALTER TABLE public.conversations 
  DROP COLUMN IF EXISTS itinerary_id;
```

**Reason**: One conversation can generate multiple itineraries

### 2. Add itineraries.conversation_id

```sql
ALTER TABLE public.itineraries 
  ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_itineraries_conversation_id 
  ON public.itineraries(conversation_id);
```

**Reason**: Track which conversation generated each itinerary

### 3. Add conversation activity tracking

```sql
ALTER TABLE public.conversations 
  ADD COLUMN is_active BOOLEAN DEFAULT true,
  ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_conversations_active 
  ON public.conversations(user_id, is_active, last_message_at DESC);
```

**Reason**: Quickly find the user's most recent active conversation

### Final Schema

**conversations table:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `messages` (JSONB) - Array of message objects
- `state` (JSONB) - LangGraph state
- `is_active` (BOOLEAN) - Only one active conversation per user
- `last_message_at` (TIMESTAMP) - For sorting
- `created_at`, `updated_at`

**itineraries table:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `conversation_id` (UUID, FK → conversations, nullable)
- `title`, `description`, `destination`, etc.
- `data` (JSONB) - Full itinerary structure
- `created_at`, `updated_at`

## Frontend Implementation

### 1. React Query Setup

**File:** `frontend/src/components/providers/QueryProvider.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 2. React Query Hooks

**File:** `frontend/src/hooks/useConversation.ts`

Key hooks:
- `useActiveConversation()` - Fetches active conversation on mount
- `useSaveMessage()` - Mutation to save message
- `useCreateConversation()` - Creates new conversation
- `useDeactivateConversation()` - Marks conversation as inactive

### 3. Integration with Zustand

**Strategy:**
- **Zustand**: Temporary UI state (messages array, loading, animations)
- **React Query**: Persistent data (source of truth)
- **Hydration**: React Query → Zustand on page load

**Flow:**
```typescript
// On page load
const { data: conversation } = useActiveConversation();

useEffect(() => {
  if (conversation) {
    // Hydrate Zustand from React Query
    setMessages(conversation.messages);
    setConversationId(conversation.id);
  }
}, [conversation]);

// On new message
const { mutate: saveMessage } = useSaveMessage();

function sendMessage(content: string) {
  // 1. Optimistic update in Zustand
  addMessage({ role: 'user', content, timestamp: new Date() });
  
  // 2. Save to Supabase via React Query
  saveMessage({ conversationId, content }, {
    onError: () => {
      // Rollback on error
      removeLastMessage();
    }
  });
}
```

## Backend Implementation

### New Endpoints

**1. GET /api/v1/conversations/active**
- Returns user's active conversation
- Includes messages and latest itinerary
- Returns null if no active conversation

**2. POST /api/v1/conversations**
- Creates new conversation
- Deactivates previous active conversation
- Returns conversation ID

**3. PATCH /api/v1/conversations/{id}/messages**
- Appends message to conversation
- Updates `last_message_at`
- Returns updated conversation

**4. PATCH /api/v1/conversations/{id}/deactivate**
- Sets `is_active = false`
- Used when starting new conversation

### Modified Endpoint

**POST /api/v1/chat**
- Auto-saves messages to `conversations` table
- Creates conversation if doesn't exist
- Updates `last_message_at` on each message
- Returns `conversation_id` in response

## User Flows

### Flow 1: First Visit to /chat

1. User navigates to `/chat`
2. React Query fetches active conversation → returns null
3. Page shows hero/welcome screen
4. User sends first message
5. Backend creates new conversation
6. Message saved to Supabase
7. React Query caches conversation (7 days)

### Flow 2: Returning to /chat

1. User navigates to `/chat`
2. React Query checks cache (< 7 days old)
3. If cached: Instant load from memory
4. If expired: Fetch from Supabase
5. Zustand hydrated with messages
6. UI shows previous conversation state

### Flow 3: Generating Multiple Itineraries

1. User in active conversation
2. Generates itinerary for "Cusco 5 days"
3. Itinerary saved with `conversation_id`
4. User continues chatting: "Actually, make it Arequipa"
5. New itinerary generated, same `conversation_id`
6. Both itineraries linked to same conversation

### Flow 4: Starting New Conversation

1. User clicks "New Conversation" button
2. Current conversation marked `is_active = false`
3. New conversation created with `is_active = true`
4. Zustand cleared
5. UI resets to welcome screen

## Performance Optimizations

Following Vercel React Best Practices:

### 1. Parallel Data Fetching (Section 1.4)
```typescript
// Start both fetches immediately
const conversationPromise = fetchActiveConversation();
const userPromise = fetchUserProfile();

const [conversation, user] = await Promise.all([
  conversationPromise,
  userPromise
]);
```

### 2. Optimistic Updates (Section 5.9)
```typescript
// Functional setState to avoid stale closures
setMessages(curr => [...curr, newMessage]);
```

### 3. Lazy State Initialization (Section 5.10)
```typescript
// Only parse localStorage once
const [cachedConv, setCachedConv] = useState(() => {
  const stored = localStorage.getItem('lastConversation');
  return stored ? JSON.parse(stored) : null;
});
```

### 4. Defer State Reads (Section 5.2)
```typescript
// Don't subscribe to searchParams if only used in callbacks
const handleShare = () => {
  const params = new URLSearchParams(window.location.search);
  shareConversation(conversationId, params.get('ref'));
};
```

## Error Handling

### Network Errors
- Optimistic update shows immediately
- On error: Toast notification + rollback
- Retry logic: 1 automatic retry

### Stale Data
- React Query refetches on window focus (disabled by default)
- Manual refetch button in UI
- 7-day stale time prevents unnecessary refetches

### Concurrent Edits
- Last write wins (simple conflict resolution)
- Future: Operational transforms for real-time collab

## Testing Strategy

### Unit Tests
- React Query hooks (mock API responses)
- Zustand store actions
- Message persistence logic

### Integration Tests
- Full flow: send message → save → reload → verify
- Error scenarios: network failure, rollback
- Cache expiration behavior

### E2E Tests
- User sends message, refreshes, sees message
- Generate itinerary, refresh, itinerary persists
- Multiple itineraries in one conversation

## Migration Plan

### Phase 1: Database (No Downtime)
1. Run schema migrations (additive only)
2. Existing data continues working
3. New conversations use new schema

### Phase 2: Backend
1. Deploy new endpoints
2. Modify `/api/v1/chat` to save conversations
3. Backward compatible (old clients still work)

### Phase 3: Frontend
1. Install React Query
2. Add QueryProvider to app
3. Create hooks
4. Update `/chat` page
5. Test thoroughly

### Phase 4: Cleanup
1. Remove old localStorage-based persistence
2. Monitor error rates
3. Optimize based on metrics

## Success Metrics

- **Recovery Rate**: % of users who successfully resume conversations
- **Cache Hit Rate**: % of page loads served from React Query cache
- **Error Rate**: < 1% of message saves fail
- **Performance**: Page load < 500ms with cached data

## Future Enhancements

1. **Conversation History**: List of past conversations
2. **Search**: Full-text search across messages
3. **Export**: Download conversation as PDF/JSON
4. **Real-time Sync**: WebSocket for multi-device sync
5. **Offline Support**: Service worker + IndexedDB

## References

- [React Query Docs](https://tanstack.com/query/latest)
- [Vercel React Best Practices](.agents/skills/vercel-react-best-practices/AGENTS.md)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
