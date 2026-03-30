## 1. Status Change Notifications

- [x] 1.1 Add `email` import to `transition-request.ts`
- [x] 1.2 After the event insert, look up requester email from `profiles` (or assigned staff if actor is the requester)
- [x] 1.3 Build HTML email body with request number, title, new status label, and public note/resolution summary if present
- [x] 1.4 Call `email.send()` in a try/catch with subject `[<app_name>] Request #<number> — <status_label>` and `from_name` set to app name

## 2. Comment Notifications

- [x] 2.1 Add `email` import to `add-comment.ts`
- [x] 2.2 After the event insert (for public comments only), determine the recipient: if staff commented → requester email; if resident commented → assigned staff email (or all admins if unassigned)
- [x] 2.3 Build HTML email body with request number, title, comment author name, and comment text preview (first 200 chars)
- [x] 2.4 Call `email.send()` in a try/catch with subject `[<app_name>] Request #<number> — New comment` and `from_name` set to app name
