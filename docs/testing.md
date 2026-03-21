# Testing Plan

SkMeld tests require a running Run402 instance. Tests deploy a fresh project, run the full lifecycle, and clean up.

## SQL/RLS Tests

Validate role-based data isolation:

1. Resident cannot read another resident's requests
2. Resident cannot read internal comments on their own requests
3. Staff can read all requests regardless of requester
4. Owner_admin can update app_settings; staff and resident cannot
5. Resident can only see spaces they occupy via space_occupancies
6. Archived (is_active=false) properties still queryable by staff

## Function Tests

Validate domain logic in serverless functions:

1. **submit-request**: creates request in 'submitted' status, snapshots SLA dates from priority, logs event
2. **submit-request**: resident cannot submit for unoccupied space (403)
3. **transition-request**: valid transition changes status + sets timestamps
4. **transition-request**: invalid transition returns 400
5. **transition-request**: resolved→triaged (reopen) clears resolved_at
6. **transition-request**: requires resolution_summary for resolved, cancellation_reason for canceled
7. **add-comment**: resident cannot add internal comments (403)
8. **create-invites**: only owner_admin can create invites
9. **redeem-invite**: creates profile with correct role + occupancies
10. **redeem-invite**: expired/used tokens return 400

## E2E Lifecycle Test

Full happy path:

1. Bootstrap with admin email + demo data
2. Admin logs in
3. Admin adds a property + spaces
4. Admin invites a resident
5. Resident claims invite + signs up
6. Resident submits request with photos
7. Staff sees request on board
8. Staff triages: sets priority, assigns, moves to "Under review"
9. Staff adds internal note (resident can't see it)
10. Staff resolves with resolution summary
11. Resident reopens ("Still not fixed")
12. Staff resolves again
13. Resident confirms fixed (closes)
14. Admin exports CSV
15. Cleanup: delete project

## Running Tests

```bash
# Against production
BASE_URL=https://api.run402.com npx tsx test/skmeld-e2e.ts

# Against local
npx tsx test/skmeld-e2e.ts
```
