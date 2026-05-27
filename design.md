# Unified Citizen Services Portal — Design & Build Spec

## Purpose

Build a public-facing, touch-friendly government portal for citizen interaction with civic utility offices.

The system should unify common citizen services for:

* Electricity utility offices
* Water supply department
* Gas distribution department
* Municipal corporation services
* Waste management complaints

The portal must support:

* Secure citizen authentication
* Role-based access for Citizen / Officer / Admin
* Service request and complaint submission
* Document upload
* Real-time application status tracking
* SLA/status timeline tracking
* Receipt / acknowledgement generation
* Analytics and admin monitoring
* Responsive layouts for desktop, tablet, and kiosk-style touch screens

---

## Reference Material

Use the Figma-exported folder in the same directory as the visual reference.

Reference characteristics to preserve:

* Clean government dashboard layout
* Left sidebar navigation
* Top header / utility bar
* Hero/welcome area
* Summary statistics cards
* Service cards
* Recent requests / tickets table
* Notifications / announcements panel
* Status badges
* Timeline / status tracking section
* Charts in admin dashboard
* Navy blue + teal civic-tech color language

Do not copy the reference literally. Rebuild it as a civic portal with the same overall design logic and quality.

---

## Visual Style

Design language:

* Trustworthy
* Professional
* Minimal but polished
* Modern SaaS/dashboard feel
* Government-portal appropriate
* Touch-friendly
* Accessible for citizens of all ages

Style rules:

* Light background with white cards
* Navy blue as primary color
* Teal as secondary color
* Subtle blue accent usage
* Rounded corners
* Soft shadows
* Large readable typography
* Clear spacing
* Minimal motion / subtle transitions only
* No flashy, futuristic, or cyberpunk styling

### Core palette

* Background: light neutral
* Primary: navy blue
* Secondary: teal
* Accent: sky blue
* Success: green
* Warning: amber
* Error: red
* Border: soft gray

### Typography

* Use clean sans-serif typography
* Strong heading hierarchy
* Large tap targets and readable labels
* Avoid dense text blocks

### Accessibility

* High contrast
* Keyboard-friendly components
* Touch-friendly buttons
* Clear focus states
* Responsive forms
* Simple language labels
* Multilingual-ready layout

---

## Information Architecture

Create these major user areas:

### Citizen side

* Dashboard
* Complaint / request submission
* Application tracking
* Receipt / acknowledgement view
* Notifications
* Profile / account page

### Officer side

* Assigned requests dashboard
* Complaint review and verification
* Status update workflow
* Notes / resolution submission
* Document review

### Admin side

* System overview dashboard
* Department analytics
* SLA monitoring
* Complaint trends
* Officer performance
* User / role management

---

## Required Pages

Build these pages in the app:

### 1. Citizen Dashboard

Purpose: give citizens a quick overview of their services.

Include:

* Welcome banner
* Active request count
* Pending approvals count
* Resolved issues count
* Urgent alerts count
* Quick access service cards
* Recent requests table
* Notifications panel

### 2. Complaint Submission

Purpose: guide a citizen through filing a request or complaint.

Include:

* Multi-step form
* Department selection
* Category selection
* Title and description fields
* Location input
* Priority selection
* Contact details
* Document upload section
* Step progress indicator
* Submit / next / back actions

### 3. Application Tracking

Purpose: let users search and monitor a ticket/application.

Include:

* Ticket ID search box
* Application summary panel
* Status badge
* SLA deadline / days remaining
* Timeline or milestone tracker
* Officer update panel
* Citizen details panel
* Download receipt button

### 4. Officer Dashboard

Purpose: allow officers to manage assigned complaints.

Include:

* Overview stats
* Filters for ticket states
* Data table of complaints
* Complaint detail viewer
* Status update form
* Notes / remarks input
* Document review area
* Submit update action

### 5. Admin Dashboard

Purpose: monitor the system at department and city level.

Include:

* Overview stats
* Department-wise chart
* Monthly trend chart
* Status distribution chart
* SLA performance section
* Top officers table
* Pending / resolved / overdue insights
* System-level analytics cards

---

## Reusable Components to Build

Create reusable components for consistency:

* Sidebar
* Top navbar
* Hero banner
* Stats card
* Service card
* Status badge
* Notification card
* Timeline component
* Data table
* Form fields
* Upload zone
* Chart containers
* Empty state cards
* Modal / dialog if needed

Keep these components modular and reusable across pages.

---

## Layout Rules

Use a dashboard layout system:

* Fixed left sidebar on desktop
* Mobile sidebar / drawer on small screens
* Main content area with spacing
* Top utility bar with search / profile / notifications where needed
* Grid-based layouts for dashboard sections
* Cards aligned in clean rows
* Tables with horizontal overflow handling

Spacing rules:

* Use generous padding
* Avoid clutter
* Separate sections clearly
* Keep forms compact but readable

---

## Functional Requirements

The final web app should support:

### Authentication

* Citizen login
* Officer login
* Admin login
* Session-aware navigation

### Requests / complaints

* Create new request
* Select department and category
* Add description and location
* Set priority
* Attach files
* Submit complaint
* Generate ticket ID

### Tracking

* Search by ticket ID
* Show current status
* Show full timeline
* Show SLA/deadline
* Show officer notes and updates

### Notifications

* New application acknowledgement
* Status change updates
* Document required alerts
* Resolution notifications

### Admin controls

* View analytics
* Filter by department/status
* Monitor SLA violations
* Review workload
* View officer performance

---

## Data Entities

Use these core entities in the app design and implementation:

* User
* Role
* Department
* Complaint / Request
* Document
* StatusHistory
* Notification
* Receipt
* SLARecord
* OfficerAssignment

---

## Suggested Demo Data

Use realistic sample data for the UI:

* Request IDs like `REQ-2024-001`
* Department names: Electricity, Water Supply, Gas Services, Waste Management
* Statuses: Submitted, Under Review, In Progress, Resolved, Rejected
* Priority levels: Low, Medium, High
* Ticket dates, officer names, and SLA deadlines

---

## UI Behavior Expectations

* Forms should validate required fields
* Buttons should have clear labels
* Status badges must be consistent across the app
* Tables must support readable row spacing
* Charts should be clean and not overloaded
* Upload controls should be obvious and easy to use
* Use subtle hover states and transitions only
* Do not use unnecessary animation effects

---

## Deliverables Claude Code Should Build First

Build in this order:

1. App shell and routing
2. Sidebar + header
3. Reusable cards and badges
4. Citizen Dashboard
5. Complaint Submission page
6. Application Tracking page
7. Officer Dashboard
8. Admin Dashboard
9. Final visual polish

Do not start backend implementation until the frontend structure is stable.

---

## Important Constraints

* Keep the design accessible and realistic
* Keep it suitable for government / civic use
* Keep it simple enough for kiosk usage
* Do not over-animate the interface
* Do not replace the civic color language
* Do not redesign the structure unless needed for usability
* Preserve a clean and consistent dashboard experience

---

## Success Criteria

This design is successful if it feels like:

* a real civic portal
* a usable public-service system
* a modern government dashboard
* a polished SaaS-style admin interface
* a touch-friendly kiosk-ready application

