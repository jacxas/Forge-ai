# Security Specification - Forge AI

## Data Invariants
1. **User Isolation**: Users can only read and write their own data (UserProfile, Bots, Messages).
2. **Identity Integrity**: The `uid` in a User profile and the `ownerId` in a Bot must match the authenticated user's UID.
3. **Immutability**: Fields like `createdAt` and `ownerId` cannot be changed after creation.
4. **Admin Privilege**: Users with their email in the `/admins/` collection have full read/write access to all collections.
5. **Schema Safety**: All writes must conform to the defined types and size limits.

## The Dirty Dozen (Test Matrix)

| ID | Name | Scenario | Expected |
|----|------|----------|----------|
| 1 | SPOOF_PROFILE | User A attempts to overwrite User B's profile | REJECTED |
| 2 | PRIVILEGE_ESCALATION | User A attempts to set `isAdmin: true` on their profile | REJECTED |
| 3 | BOT_HIJACK | User A attempts to update a bot owned by User B | REJECTED |
| 4 | SESSION_SNOOPING | User A attempts to list messages in User B's session | REJECTED |
| 5 | ORPHAN_WRITE | User A attempts to write a message to a user path that isn't their own | REJECTED |
| 6 | ID_POISONING | User A uses a 1KB string as a Document ID | REJECTED |
| 7 | TYPE_MISHAP | User A sends a string for a field that must be a number (e.g. `createdAt`) | REJECTED |
| 8 | IMMUTABLE_VIOLATION | User A attempts to change `ownerId` on an existing Bot | REJECTED |
| 9 | SHADOW_FIELD | User A attempts to inject a hidden field `is_verified: true` | REJECTED |
| 10 | ADMIN_BREACH | Non-admin user attempts to read the `/admins` collection | REJECTED |
| 11 | DENIAL_OF_WALLET | User attempts to send a 1MB string in the `name` field | REJECTED |
| 12 | NO_AUTH_WRITE | Unauthenticated user attempts to create a bot | REJECTED |
