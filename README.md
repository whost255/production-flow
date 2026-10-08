# Production Flow

Web APP SYSTEM OBJECTIVE

Build a modern, responsive web application for managing projects, sets, panels, production stages, production status, progress, production history, users, roles, analytics, and Excel exports.

The application must work on:

Desktop

Laptop

Tablet

Android

iPhone/mobile browsers

The application must look like a professional production management system, not a spreadsheet or basic form.

The application must use its own backend and database.

Do NOT use:

Google Apps Script

Google Sheets

Google Drive

Google Login

BOM management

BOM upload

BOM mapping

BOM import

BOM database

Google Sheet export

The application must support:

Application login

User management

Admin dashboard

Role-based permissions

Project management

Set management

Panel management

Production stage configuration

Production tracking

Production history

Progress calculation

Analytics

Excel export

Responsive mobile interface

PHASE 1 — APPLICATION FOUNDATION

Create the basic application architecture.

Frontend:

React

TypeScript

Tailwind CSS

Modern component-based UI

Responsive design

Backend:

Supabase or equivalent backend

PostgreSQL database

Authentication

Row-level security

Backend APIs

Create the basic application structure:

Login

Dashboard

Projects

Production

Analytics

Admin

User Profile

Settings

Create a consistent layout with:

Sidebar navigation on desktop

Responsive navigation on mobile

Top navigation bar

User profile menu

Notifications

Page title

Breadcrumbs where useful

PHASE 2 — DATABASE ARCHITECTURE

Create a proper relational database.

Main entities:

Users

Projects

Sets

Panels

Panel Stages

Production Status

Production History

Audit Logs

Database relationship:

PROJECT

↓

SETS

↓

PANELS

↓

APPLICABLE STAGES

↓

PRODUCTION STATUS

↓

PRODUCTION HISTORY

Users should be associated with projects and production updates.

The database must support multiple projects and multiple users simultaneously.

PHASE 3 — LOGIN AND AUTHENTICATION

Create a professional application login page.

Title:

PRODUCTION TRACKER

Login fields:

Email

Password

Functions:

Login

Logout

Forgot Password

Password Reset

Session Persistence

After login, identify:

User

User ID

Role

Permissions

Active/Inactive status

Users who are disabled must not be allowed to access the application.

Do not use Google authentication.

Use the application's own authentication system.

After successful login:

Login

↓

Dashboard

PHASE 4 — USER PROFILE

Create a user profile section.

Display:

Name

Email

Role

Account Status

Created Date

Last Login

Allow users to:

Change Password

Update permitted profile information

Logout

Users should not be able to change their own role or permissions.

PHASE 5 — USER ROLES AND PERMISSIONS

Create role-based access control.

Roles:

Admin

Project Manager

Engineer

Production

QC

Viewer

Admin:

Full system access.

Project Manager:

Create projects

Edit projects

Configure panels

Configure production stages

Update production

View history

View analytics

Export reports

Engineer:

View projects

Configure panels where permitted

Configure stages where permitted

Update production

View history

Export reports where permitted

Production:

View assigned projects

Update production stages

View production status

View applicable history

QC:

View production

Update QC-related stages

View history

Viewer:

Read-only access.

Permissions must be enforced by the backend/database.

Do not rely only on hiding buttons in the frontend.

PHASE 6 — ADMIN DASHBOARD

Create a dedicated Admin Dashboard.

Admin should be able to view:

Total Users

Active Users

Inactive Users

Total Projects

Active Projects

Completed Projects

Projects On Hold

Overall Production Progress

User management:

Add User

Edit User

Disable User

Enable User

Change Role

View User Activity

Project management:

View All Projects

View Project Status

View Project Progress

Archive Project

Admin activity:

User Activity

System Activity

Production Activity

Audit Logs

PHASE 7 — MAIN DASHBOARD

After login, display the main production dashboard.

Dashboard title:

Production Tracker

Display summary cards:

Total Projects

Active Projects

Completed Projects

On Hold Projects

Overall Progress

Example:

Total Projects: 12

Active Projects: 8

Completed Projects: 3

On Hold: 1

Overall Progress: 68%

Display:

Recent Projects

Recently Updated Projects

Production Activity

Project Progress

Main button:

* Create New Project

PHASE 8 — PROJECT MANAGEMENT

Create a Projects page.

Display projects in a professional table/card layout.

Columns:

Project Name

Project Code

Country

Process

Sets

Panels

Progress

Status

Last Updated

Actions

Actions:

Open

Edit

Export

Archive

Project search:

Project Name

Project Code

Country

Filters:

Status

Country

Process

Sorting:

Project Name

Created Date

Last Updated

Progress

Status

PHASE 9 — PROJECT CREATION

Create a project setup wizard.

Step 1:

Project Details

Fields:

Project Name

Project Code

Country

Process

Number of Sets

Number of Panels

Country options:

India

Europe

UAE

Other

If Other is selected:

Show Country Name field.

Project status should initially be:

Active

Automatically generate:

Project ID

Created Date

Created By

Last Updated

PHASE 10 — SET MANAGEMENT

The user enters the number of sets.

Example:

Number of Sets: 10

Number of Panels: 44

The system automatically creates:

Set 1

Set 2

Set 3

Set 4

Set 5

Set 6

Set 7

Set 8

Set 9

Set 10

Panel definitions should be created once.

The system automatically creates panel instances for every set.

Example:

44 panels × 10 sets = 440 panel instances.

Every set must have independent production status.

Set 1 Main Body can be Completed while Set 2 Main Body is still Pending.

These must remain completely independent.

PHASE 11 — PANEL CONFIGURATION

Create a panel configuration interface.

Fields:

Panel Name

Part Number

Part Area

Part Weight

Sequence

Active/Inactive

Example:

Panel Name: Main Body

Part Number: MB-001

Part Area: 12.50 m²

Part Weight: 85 kg

Sequence: 1

Allow users to:

Add Panel

Edit Panel

Delete Panel where safe

Reorder Panels

Deleting a panel that already has production history must not permanently destroy the historical records.

PHASE 12 — PANEL PROCESS CONFIGURATION

Allow users to define applicable production stages separately for every panel.

Available stages:

Lamination

Demould

Trimming

Detailing

Assembly

Bracket Bonding

Panel-to-Panel Bonding

Gelcoat Sanding

Primer Spray

Primer Sanding

Painting

Clear Coat

Post Operations

Post Operations QC

Packing

Example:

Main Body:

Lamination - Applicable

Demould - Applicable

Trimming - Applicable

Detailing - Applicable

Assembly - Applicable

Bracket Bonding - Not Applicable

Panel-to-Panel Bonding - Applicable

Gelcoat Sanding - Applicable

Primer Spray - Applicable

Primer Sanding - Applicable

Painting - Applicable

Clear Coat - Applicable

Post Operations - Applicable

Post Operations QC - Applicable

Packing - Applicable

Another panel may have completely different stages.

Only applicable stages should appear in that panel's production workflow.

PHASE 13 — STAGE SEQUENCE

Each panel must have its own stage sequence.

Example:

Main Body:

1. Lamination

2. Demould

3. Trimming

4. Detailing

5. Assembly

6. Panel-to-Panel Bonding

7. Gelcoat Sanding

8. Primer Spray

9. Primer Sanding

10. Painting

11. Clear Coat

12. Post Operations

13. Post Operations QC

14. Packing

The system should support different sequences for different panels.

Allow authorized users to reorder stages.

PHASE 14 — AUTOMATIC WORKFLOW GENERATION

After panel and stage configuration is completed:

Project

↓

Panel Definitions

↓

Number of Sets

↓

Applicable Stages

↓

Generate Production Workflows

Example:

44 panels

×

10 sets

×

applicable stages

The system generates all required production records.

Each production record must contain:

Project

Set

Panel

Stage

Status

User

Date

Time

Default status:

Pending

Not Applicable stages should not generate active production requirements.

PHASE 15 — PRODUCTION DASHBOARD

Create the primary production tracking screen.

Example:

RFQ-464 MEDHA

Total Sets: 10

Panels / Set: 44

Overall Progress: 68%

Set selector:

Set 1

Set 2

Set 3

Set 4

Set 5

Set 6

Set 7

Set 8

Set 9

Set 10

Production table:

Panel

Area

Weight

Lamination

Demould

Trimming

Detailing

Assembly

Bonding

Painting

Packing

Example:

Main Body | 12.5 | 85 kg | Completed | Completed | Completed | WIP | Pending | Pending | Pending | Pending

Door LH | 3.2 | 18 kg | Completed | Completed | Completed | Completed | WIP | Pending | Pending | Pending

The table must be professional and easy to read.

PHASE 16 — PRODUCTION STATUS SYSTEM

Available statuses:

Pending

WIP

Completed

Hold

Rework

Not Applicable

Use professional status badges.

Pending:

Neutral status

WIP:

Active production status

Completed:

Completed status

Hold:

Production stopped

Rework:

Requires corrective work

Not Applicable:

Stage does not apply

Status should be clearly visible throughout the application.

PHASE 17 — STAGE STATUS UPDATE

Clicking a production stage should open a status update interface.

Example:

Project: RFQ-464

Set: 5

Panel: Main Body

Stage: Trimming

Current Status:

WIP

Available:

Pending

WIP

Completed

Hold

Rework

Not Applicable

Button:

Save Status

The user should not manually enter:

Date

Time

User

The system must generate these automatically.

PHASE 18 — AUTOMATIC TIMESTAMP

When the user changes:

Main Body

Set 5

Trimming

Completed

The system records automatically:

Project: RFQ-464

Set: 5

Panel: Main Body

Stage: Trimming

Old Status: WIP

New Status: Completed

Updated By: Current User

Date: Current Date

Time: Current Time

Use the server/database timestamp where possible.

PHASE 19 — PRODUCTION HISTORY

Never overwrite production history.

Every status change creates a new history record.

Example:

29-Aug-2026

Lamination

Pending → WIP

29-Aug-2026

Lamination

WIP → Completed

30-Aug-2026

Demould

Pending → WIP

30-Aug-2026

Demould

WIP → Completed

30-Aug-2026

Trimming

Pending → WIP

30-Aug-2026

Trimming

WIP → Completed

History must remain permanent.

PHASE 20 — PANEL DETAIL VIEW

Clicking a panel should open a detailed panel page or modal.

Display:

Panel Name

Part Number

Part Area

Part Weight

Set Number

Progress

Production workflow:

Lamination

Demould

Trimming

Detailing

Assembly

Bracket Bonding

Panel-to-Panel Bonding

Gelcoat Sanding

Primer Spray

Primer Sanding

Painting

Clear Coat

Post Operations

Post Operations QC

Packing

Each stage should show:

Status

Date

Time

Last Updated By

Example:

Lamination

Completed

29-Aug-2026

10:15 AM

Anas

Demould

Completed

30-Aug-2026

09:20 AM

Anas

Trimming

WIP

30-Aug-2026

10:05 AM

Anas

PHASE 21 — PROJECT PROGRESS CALCULATION

Automatically calculate progress.

Project progress:

RFQ-464

Overall Progress: 68%

Set progress:

Set 1: 82%

Set 2: 74%

Set 3: 68%

Set 4: 51%

Set 5: 42%

Panel progress:

Main Body: 90%

Door LH: 72%

Door RH: 45%

Stage progress:

Lamination: 100%

Demould: 92%

Trimming: 84%

Detailing: 72%

Assembly: 60%

Painting: 30%

Packing: 5%

Progress calculation must use only applicable stages.

Not Applicable stages must not reduce the progress percentage.

PHASE 22 — PRODUCTION ANALYTICS

Create an Analytics page.

Display:

Overall Project Progress

Set Progress

Panel Progress

Stage Progress

Status Distribution

Completed Panels

WIP Panels

Hold Panels

Rework Panels

Pending Panels

Charts can include:

Overall Progress

Set Progress Comparison

Stage Progress

Status Distribution

Production Trend

Allow filtering by:

Project

Set

Stage

Date

PHASE 23 — PROJECT OVERVIEW

Every project should have an overview page.

Display:

Project Name

Project Code

Country

Process

Number of Sets

Number of Panels

Overall Progress

Project Status

Created By

Created Date

Last Updated

Summary:

Set Progress

Panel Progress

Stage Progress

Production Status

Quick actions:

Open Production

Edit Project

View History

View Analytics

Export Excel

PHASE 24 — PROJECT EDITING

Authorized users can edit:

Project Name

Project Code

Country

Process

Number of Sets

Panel Details

Panel Area

Panel Weight

Panel Sequence

Applicable Stages

Stage Sequence

Important:

Existing production data must not be accidentally deleted.

If the number of sets increases:

Existing sets remain unchanged.

New sets are added.

If the number of sets decreases:

Do not immediately delete existing production data.

Use archive/deactivation logic where necessary.

Production history must remain available.

PHASE 25 — SEARCH AND FILTER SYSTEM

Project search:

Project Name

Project Code

Country

Panel search:

Panel Name

Part Number

Production filters:

Set

Panel

Stage

Status

User

Date

History filters:

Set

Panel

Stage

Status

User

Date Range

All tables should support:

Search

Filter

Sort

Pagination where required

PHASE 26 — PROJECT STATUS

Project statuses:

Active

On Hold

Completed

Archived

Project status should be clearly displayed.

Only authorized users can change project status.

Archived projects should normally be read-only.

PHASE 27 — EXCEL EXPORT SYSTEM

The application must provide Excel export.

Do not use Google Sheets.

Generate actual .xlsx files.

Export options:

Export Entire Project

Export Current View

Export Selected Set

Export Production Status

Export Production History

Export Project Summary

Excel workbook structure can contain:

Sheet 1:

Project Summary

Sheet 2:

Sets

Sheet 3:

Panels

Sheet 4:

Production Status

Sheet 5:

Production History

The Excel file should have:

Proper column headings

Readable formatting

Correct dates

Correct times

Status values

Project information

Set information

Panel information

Stage information

User information

PHASE 28 — EXCEL EXPORT FILTERS

Allow users to export:

Entire Project

Selected Set

Selected Panels

Selected Stage

Current filtered view

Production history

Example:

User selects:

Project: RFQ-464

Set: Set 5

Status: WIP

Then:

Export Current View

should export only the currently filtered data.

PHASE 29 — LOADING SYSTEM

Every backend operation must show a global loading notification.

Examples:

Signing in...

Loading dashboard...

Opening project...

Saving project...

Saving panel details...

Generating set workflows...

Updating production status...

Loading production data...

Loading history...

Preparing Excel export...

The interface should temporarily prevent duplicate submissions during the operation.

PHASE 30 — SUCCESS NOTIFICATIONS

Show professional success notifications.

Examples:

Project saved successfully.

Project updated successfully.

Panel details saved successfully.

Production workflow generated successfully.

Production status updated successfully.

Project archived successfully.

Excel export completed successfully.

Notifications should disappear automatically after a short period.

PHASE 31 — ERROR HANDLING

Use user-friendly error messages.

Examples:

Unable to save project. Please try again.

Unable to load project. Please try again.

Unable to update production status.

Please enter a project name.

Please enter the number of sets.

Please configure at least one panel.

Unable to generate production workflows.

You do not have permission to perform this action.

Do not expose raw database or backend errors to normal users.

PHASE 32 — CONFIRMATION DIALOGS

Use confirmation dialogs for important actions.

Examples:

Archive Project

"Are you sure you want to archive this project?"

Change Project Status

"Are you sure you want to change the project status?"

Generate Workflows

"Production workflows already exist. Do you want to update the configuration?"

Delete/Deactivate Panel

"This panel has existing production records. It will be deactivated instead of permanently deleted."

Do not allow destructive operations without confirmation.

PHASE 33 — MOBILE RESPONSIVENESS

The application must be designed for mobile from the beginning.

Mobile users must be able to:

Login

View dashboard

Create projects

Edit projects

Configure panels

Configure stages

Select sets

Update production

View panel details

View history

View analytics

Export Excel

For production tracking on mobile, use either:

Responsive horizontal table

or

Panel cards.

Example:

MAIN BODY

Set 5

Progress: 72%

Lamination: Completed

Demould: Completed

Trimming: Completed

Detailing: WIP

Assembly: Pending

Painting: Pending

Update Status

Buttons must be touch-friendly.

PHASE 34 — RESPONSIVE PRODUCTION TABLE

Desktop:

Use a wide Excel-style production table.

Mobile:

Use horizontal scrolling or responsive cards.

Important UI requirements:

Sticky headers

Sticky panel information

Horizontal scrolling

Search

Filters

Sorting

Touch-friendly controls

Readable status badges

Do not allow the table to break the mobile screen.

PHASE 35 — NOTIFICATION SYSTEM

Create a global notification system.

Notification types:

Success

Error

Warning

Information

Examples:

Production status updated.

Project saved.

This project has unsaved changes.

You do not have permission to edit this project.

Notifications should be consistent throughout the application.

PHASE 36 — AUDIT LOG

Create a system-wide audit log.

Track important actions:

Login

Logout

Project Created

Project Updated

Project Archived

Panel Created

Panel Updated

Stage Configuration Changed

Production Status Changed

User Created

User Disabled

Role Changed

Excel Export

Each audit record should contain:

User

Action

Project

Date

Time

Description

PHASE 37 — DATA SECURITY

Implement backend security.

Use:

Authentication

Role-based authorization

Row-level security

Database permissions

Input validation

Secure API operations

Audit logs

Users should only access projects and functions they are authorized to access.

Never rely only on frontend button visibility for security.

PHASE 38 — DATA INTEGRITY

The system must protect existing production information.

Important rules:

Never overwrite production history.

Never delete historical status changes.

Do not accidentally reset completed stages when editing a project.

Do not remove existing sets when adding new sets.

Do not remove existing production records when modifying panel configuration.

Use archive/deactivation where appropriate.

Production history must remain traceable.

PHASE 39 — PERFORMANCE OPTIMIZATION

The system should support large projects.

Example:

100 panels

×

20 sets

×

15 stages

= 30,000 production stage records.

Use:

Database indexes

Efficient queries

Pagination

Lazy loading

Caching where appropriate

Batch operations

Client-side filtering when practical

Do not load unnecessary data.

PHASE 40 — PROJECT ACCESS CONTROL

Projects should support user access control.

Admin can access all projects.

Project Managers can access assigned projects.

Engineers can access assigned projects.

Production users can access assigned projects.

QC users can access assigned projects.

Viewers can access projects assigned to them.

Project assignment should be managed by authorized users.

PHASE 41 — ADMIN USER MANAGEMENT

Admin page should contain:

Users

Columns:

Name

Email

Role

Status

Created Date

Last Login

Actions

Actions:

Edit

Change Role

Enable

Disable

View Activity

Add User:

Name

Email

Role

Active Status

Admin must be able to control user access without modifying the database manually.

PHASE 42 — ADMIN PROJECT MANAGEMENT

Admin should be able to see all projects.

Display:

Project Name

Project Code

Country

Owner

Status

Progress

Sets

Panels

Created Date

Last Updated

Actions:

Open

Edit

Archive

View History

Export

PHASE 43 — ADMIN SYSTEM OVERVIEW

Admin dashboard should provide system-level statistics.

Display:

Total Users

Active Users

Inactive Users

Total Projects

Active Projects

Completed Projects

On Hold Projects

Archived Projects

Total Panels

Total Production Records

Completed Production Records

WIP Records

Hold Records

Rework Records

This gives management a complete overview of system activity.

PHASE 44 — PRODUCTION HISTORY REPORT

Create a dedicated history/report page.

Display:

Date

Time

User

Project

Set

Panel

Stage

Old Status

New Status

Allow:

Search

Filter

Sort

Date range filtering

Project filtering

User filtering

Status filtering

Allow Excel export.

PHASE 45 — PROJECT REPORT

Create a professional project report.

Report should contain:

Project Details

Set Summary

Panel Summary

Production Progress

Stage Progress

Current Status

Production History

User Activity

Provide:

View Report

Export Excel

PHASE 46 — FINAL NAVIGATION

Main application navigation:

Dashboard

Projects

Production

Analytics

History

Exports

Admin

Profile

Logout

Some navigation items should only appear according to user permissions.

PHASE 47 — COMPLETE USER FLOW

The final user workflow should be:

Login

↓

Dashboard

↓

Projects

↓

Create Project

↓

Project Details

↓

Number of Sets

↓

Panel Configuration

↓

Production Stage Configuration

↓

Generate Set Workflows

↓

Production Dashboard

↓

Select Set

↓

Select Panel

↓

Update Production Stage

↓

Automatic User + Date + Time

↓

Production History

↓

Progress Calculation

↓

Analytics

↓

Export Excel

↓

Logout

↓

Login Again

↓

Open Existing Project

↓

Continue From Previously Saved Production Status

PHASE 48 — TESTING

Authentication testing:

Login

Logout

Wrong password

Password reset

Disabled user

Unauthorized access

Project testing:

Create project

Open project

Edit project

Save project

Archive project

Reopen project

Set testing:

1 set

2 sets

3 sets

5 sets

10 sets

20+ sets

Panel testing:

Different panel counts

Different panel areas

Different panel weights

Different stage configurations

Production testing:

Pending

WIP

Completed

Hold

Rework

Not Applicable

History testing:

Status changes

Multiple status changes

Rework

Hold

Completed after rework

Persistence testing:

Update production

Logout

Login

Open project

Verify previous status

Export testing:

Entire project

Current view

Selected set

Production history

Large project

PHASE 49 — MOBILE TESTING

Test on:

Android Chrome

iPhone Safari

Tablet

Desktop

Laptop

Verify:

Login

Dashboard

Project creation

Panel configuration

Production tracking

Status updates

History

Analytics

Excel export

PHASE 50 — UI/UX POLISH

After all functionality works, improve the visual design.

Use:

Professional typography

Consistent spacing

Modern cards

Clean tables

Status badges

Progress bars

Icons

Responsive navigation

Modal dialogs

Toast notifications

Loading animations

Confirmation dialogs

The application should feel like a professional manufacturing/production management platform.

Avoid making it look like:

Google Forms

Google Sheets

Basic CRUD software

Plain HTML tables

PHASE 51 — FINAL SECURITY REVIEW

Before deployment, verify:

Authentication works.

Inactive users cannot login.

Roles are enforced.

Users cannot access unauthorized projects.

Users cannot modify unauthorized data.

Production history cannot be deleted by normal users.

Frontend permissions cannot bypass backend permissions.

Database security policies are enabled.

Input validation is implemented.

Audit logging works.

PHASE 52 — FINAL PERFORMANCE REVIEW

Check:

Dashboard loading speed

Project loading speed

Production table loading

Large project performance

History loading

Analytics loading

Excel export performance

Mobile performance

Optimize database queries and frontend rendering where necessary.

PHASE 53 — FINAL PRODUCTION TEST

Perform the complete real-world workflow:

Create User

↓

Login

↓

Create Project

↓

Enter Project Details

↓

Create 10 Sets

↓

Create 44 Panels

↓

Configure Panel Information

↓

Configure Applicable Stages

↓

Generate Workflows

↓

Open Set 1

↓

Update Production

↓

Complete Lamination

↓

Complete Demould

↓

Set Trimming to WIP

↓

Logout

↓

Login Again

↓

Open Project

↓

Verify Saved Status

↓

Update Trimming to Completed

↓

Set Detailing to WIP

↓

View Production History

↓

View Analytics

↓

Export Excel

↓

Verify Excel Data

↓

Admin Login

↓

View User Activity

↓

View Project Activity

↓

Review Audit Log

FINAL SYSTEM ARCHITECTURE

Frontend:

React

TypeScript

Tailwind CSS

Responsive UI

↓

Backend:

Supabase / PostgreSQL

Authentication

Database

Row-Level Security

Backend APIs

↓

Application Modules:

Authentication

Dashboard

Projects

Sets

Panels

Production Stages

Production Tracking

History

Analytics

Reports

Excel Export

User Management

Admin Dashboard

FINAL DATA STRUCTURE

USERS

↓

PROJECTS

↓

SETS

↓

PANELS

↓

PANEL STAGES

↓

PRODUCTION STATUS

↓

PRODUCTION HISTORY

↓

AUDIT LOGS

FINAL CORE FUNCTIONALITY

The application must allow a user to:

1. Login securely.

2. Create a project.

3. Enter project details.

4. Define the required number of sets.

5. Define panels once.

6. Automatically replicate panels across sets.

7. Configure applicable production stages for every panel.

8. Automatically generate production workflows.

9. Track production independently for every set and panel.

10. Update production status.

11. Automatically record user, date and time.

12. Maintain permanent production history.

13. Calculate panel progress.

14. Calculate set progress.

15. Calculate stage progress.

16. Calculate overall project progress.

17. View production analytics.

18. Search and filter production data.

19. Export project data to Excel.

20. Logout and login again later.

21. Resume production from exactly where it was previously saved.

22. Allow Admin to manage users and roles.

23. Allow Admin to view all projects and activities.

24. Maintain secure backend permissions.

25. Maintain a complete audit trail.

RECOMMENDED LOVABLE BUILD ORDER

Do not ask Lovable to build all 53 phases simultaneously.

Build in this order:

1. Application Foundation

2. Database Architecture

3. Login and Authentication

4. User Profile

5. User Roles and Permissions

6. Admin Dashboard

7. Main Dashboard

8. Project Management

9. Project Creation

10. Set Management

11. Panel Configuration

12. Panel Process Configuration

13. Stage Sequence

14. Automatic Workflow Generation

15. Production Dashboard

16. Production Status System

17. Stage Status Update

18. Automatic Timestamp

19. Production History

20. Panel Detail View

21. Project Progress Calculation

22. Production Analytics

23. Project Overview

24. Project Editing

25. Search and Filters

26. Project Status

27. Excel Export

28. Excel Export Filters

29. Loading System

30. Success Notifications

31. Error Handling

32. Confirmation Dialogs

33. Mobile Responsiveness

34. Responsive Production Table

35. Notification System

36. Audit Log

37. Data Security

38. Data Integrity

39. Performance Optimization

40. Project Access Control

41. Admin User Management

42. Admin Project Management

43. Admin System Overview

44. Production History Report

45. Project Report

46. Final Navigation

47. Complete User Flow

48. Testing

49. Mobile Testing

50. UI/UX Polish

51. Final Security Review

52. Final Performance Review

53. Final Production Test

IMPORTANT FINAL REQUIREMENT

The application is a standalone Project and Production Tracking System.

It must NOT contain:

Google Apps Script

Google Sheets

Google Drive

Google Login

BOM

BOM Upload

BOM Mapping

BOM Import

BOM Database

Google Sheet Export

The only file export required is direct Excel (.xlsx) export from the web application.

The core system is:

PROJECT → SET → PANEL → PRODUCTION STAGE → STATUS → HISTORY → PROGRESS → ANALYTICS → EXCEL EXPORT

And the administrative system is:

ADMIN → USERS → ROLES → PROJECT ACCESS → ACTIVITY → AUDIT LOG

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c924cf9-9dab-417d-aece-a439464fb172).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
