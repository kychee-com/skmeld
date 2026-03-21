# Fork Prompts

Example prompts for customizing SkMeld for different verticals. Use these when forking the app via Run402.

## HOA Fork

> Fork SkMeld into an HOA common-area issue tracker. Set `ui_labels` to rename Resident to Member, Unit to Home. Update `request_categories` to add landscaping, gate access, pool, clubhouse, and parking lot lighting. Set emergency_instructions to "For after-hours HOA emergencies, call the management company at 555-0199." Remove the pets field.

```json
{
  "version_id": "ver_skmeld_v1",
  "name": "oak-valley-hoa",
  "bootstrap": {
    "admin_email": "board@oakvalley.org",
    "app_name": "Oak Valley HOA",
    "seed_demo_data": false
  }
}
```

## Office Manager Fork

> Fork SkMeld into an office facilities tracker. Rename Resident to Employee, Unit to Suite. Hide the pets field and entry preference. Add categories for AV equipment, restroom, janitorial, badge access, and conference rooms. Change the default priority SLA to business hours.

```json
{
  "version_id": "ver_skmeld_v1",
  "name": "acme-facilities",
  "bootstrap": {
    "admin_email": "facilities@acme.com",
    "app_name": "Acme Office Facilities",
    "seed_demo_data": true
  }
}
```

## Church / Nonprofit Fork

> Fork SkMeld into a facilities request app for a church campus. Rename Property to Building, Unit to Room. Add categories for sanctuary AV, kitchen equipment, nursery, grounds maintenance, and HVAC. Set the support phone to the church office number.

```json
{
  "version_id": "ver_skmeld_v1",
  "name": "grace-church",
  "bootstrap": {
    "admin_email": "office@gracechurch.org",
    "app_name": "Grace Church Facilities",
    "seed_demo_data": false
  }
}
```

## Coworking Space Fork

> Fork SkMeld into a coworking space maintenance tracker. Rename Resident to Member, Unit to Desk/Suite. Add categories for wifi/network, printing, kitchen/coffee, meeting rooms, and parking. Enable priority selection for members.

## School District Fork

> Fork SkMeld into a school facilities work order system. Rename Property to School, Unit to Classroom, Resident to Teacher. Add categories for playground, cafeteria, gym, restroom, and classroom furniture. Set the time zone to the district's local time.
