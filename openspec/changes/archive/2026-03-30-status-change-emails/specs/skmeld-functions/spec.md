## MODIFIED Requirements

### Requirement: transition_request sends email notifications
`transition-request.ts` SHALL import `email` from `@run402/functions` and send a notification email after logging the status change event.

#### Scenario: Import and send
- **WHEN** a status transition completes successfully
- **THEN** the function SHALL look up the recipient email, build an HTML email body, and call `email.send()` in a try/catch

### Requirement: add_comment sends email notifications
`add-comment.ts` SHALL import `email` from `@run402/functions` and send a notification email after logging the comment event, for public comments only.

#### Scenario: Import and send on public comment
- **WHEN** a public comment is added successfully
- **THEN** the function SHALL look up the recipient email, build an HTML email body, and call `email.send()` in a try/catch
