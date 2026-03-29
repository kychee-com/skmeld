## Requirements

### Requirement: No frontend changes required
The board already displays overdue indicators. The `v_request_board` view computes `is_overdue_response` and `is_overdue_resolution`, and `board-card.tsx` renders a red border and alert triangle icon for overdue cards.

#### Scenario: Existing overdue display
- **WHEN** a request is past its SLA deadline
- **THEN** the board card SHALL display with `border-destructive/50` styling and an `AlertTriangle` icon (already implemented)
