## 1. On-Signup Function

- [x] 1.1 Create `functions/on-signup.ts` — parse `{ user: { id, email, created_at } }` from request body, insert profile with `role_key: 'resident'` using `db.sql()` with `ON CONFLICT (user_id) DO NOTHING`
- [x] 1.2 Derive `full_name` from email local part (e.g., `jane.doe@example.com` → `Jane Doe`)

## 2. Deploy

- [x] 2.1 Add `on-signup.ts` to the `functionFiles` array in `deploy.ts`

## 3. Documentation

- [x] 3.1 Update CLAUDE.md functions list to include `on-signup.ts` as a lifecycle hook
