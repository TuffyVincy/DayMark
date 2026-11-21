# Security Specification — Daymark Firestore Rules

## 1. Data Invariants
1. **Default Deny**: Any unmatched path under `/databases/{database}/documents` is strictly denied for all reads and writes.
2. **Owner-Only PII Isolation**: User profiles at `/users/{userId}` contain `email` and `displayName`. Only the verified authenticated owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) may `get`, `create`, or `update` their own profile; `list` and `delete` on `/users` are denied.
3. **Master Gate Parent Existence**: Habits and logs under `/users/{userId}/...` require the parent `/users/{userId}` document to exist on writes, and `HabitLog` creation/updates require the referenced parent `Habit` document to exist.
4. **Immutable Ownership & Creation Timestamps**: `uid`, `userId`, `id`, `habitId`, `dateKey`, and `createdAt` can never be reassigned or forged after creation.
5. **Temporal Integrity**: `createdAt` and `updatedAt` must strictly equal `request.time`.
6. **Strict Schema & Bounds**: Unknown shadow fields are rejected via `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update; all strings, numbers, IDs, and arrays are bounded.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Cross-User Profile Read**: User B attempts `get` on `/users/{userA}`.
2. **User Directory Enumeration**: Authenticated user attempts `list` on `/users`.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts `create` on `/users/{uid}`.
4. **Profile Shadow Role Injection**: User creates `/users/{uid}` with extra field `{ isAdmin: true }`.
5. **Cross-User Habit Creation**: User B attempts `create` at `/users/{userA}/habits/h1` with `userId: userA`.
6. **Oversized Title Resource Exhaustion**: User creates habit with 500-character `title`.
7. **Invalid Schedule Day Array**: User creates habit with `scheduleDays: [0, 99]` or 12 elements.
8. **Boolean Target Tampering**: User creates `trackingType: "boolean"` habit with `targetValue: 50`.
9. **Habit Ownership Hijack on Update**: User updates habit changing `userId` to another UID.
10. **Forged Timestamp**: User creates or updates habit with client-supplied `updatedAt` instead of `request.time`.
11. **Orphaned Log Creation**: User creates `/users/{uid}/logs/ghost_2026-11-16` pointing to nonexistent `habitId: "ghost"`.
12. **Blanket Subcollection List Without Filter**: Client attempts `list` on `/users/{uid}/habits` without enforcing `userId == request.auth.uid` or attempts to list another user's subcollection.
