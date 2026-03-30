## Requirements

### Requirement: Auto-create profile on user signup
The system SHALL deploy a function named `on-signup` that the Run402 gateway invokes automatically after every new user registration. The function SHALL create a `profiles` row with `role_key: 'resident'` using the user's `id` and `email` from the hook payload.

#### Scenario: New user signs up without invite
- **WHEN** a new user signs up via any auth method (password, OAuth)
- **THEN** the `on-signup` function SHALL insert a profile row with `user_id` = the new user's id, `email` = the new user's email, `role_key` = `'resident'`, and `full_name` derived from the email local part

#### Scenario: Profile already exists (invite redeemed before hook fires)
- **WHEN** the `on-signup` function fires but a profile with that `user_id` already exists
- **THEN** the function SHALL skip the insert (ON CONFLICT DO NOTHING) without error

#### Scenario: Hook receives invalid payload
- **WHEN** the `on-signup` function receives a payload without a valid `user.id`
- **THEN** the function SHALL return a 400 response with an error message

### Requirement: Hook is fire-and-forget
The `on-signup` function is invoked by the Run402 gateway as a fire-and-forget hook. Errors in the function SHALL NOT block or fail the user's signup response.

#### Scenario: Hook function throws an error
- **WHEN** the `on-signup` function encounters a database error
- **THEN** the user's signup response SHALL still succeed and the error SHALL be logged server-side
