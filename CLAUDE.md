# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Laravel 12 + React support ticket management system with multi-role access control, task management, reporting, and invoice generation capabilities. The system uses XAMPP/LAMPP for local development.

## Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 with TypeScript/JSX
- **UI Framework**: shadcn/ui (built on Tailwind CSS 4 + Radix UI primitives)
- **Build Tool**: Vite 6
- **Database**: MySQL (via XAMPP/LAMPP)
- **Authentication**: Laravel Sanctum
- **Additional**: DomPDF for invoice generation, SimpleSoftware QR code library

## Coding Standards and Best Practices

### Frontend Standards

**IMPORTANT**: This project uses **shadcn/ui** as the default UI component library.

- Use shadcn/ui components for all UI elements (buttons, inputs, dialogs, dropdowns, etc.)
- shadcn/ui components are located in `resources/js/components/ui/`
- Components are built on Radix UI primitives with Tailwind CSS styling
- Common components: `button.tsx`, `dialog.tsx`, `select.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `tabs.tsx`, `tooltip.tsx`, `input.tsx`, `table.tsx`
- Follow the existing component patterns in the codebase for consistency
- Use TypeScript/JSX for all React components

### Backend Standards

**CRITICAL**: Follow these Laravel best practices strictly:

1. **Always use Controller Methods**
   - ALL business logic must be in controller methods
   - NEVER write logic directly in routes (`routes/api.php`)
   - Routes should only define the HTTP method, path, and controller method reference

2. **Use Eloquent Models**
   - Use Eloquent ORM for all database operations
   - Define relationships in models (hasMany, belongsTo, belongsToMany, etc.)
   - Use query builder through models, not raw SQL queries
   - Leverage Eloquent features: scopes, accessors, mutators, soft deletes

**Example of CORRECT implementation:**

```php
// routes/api.php - ONLY route definition
Route::get('/tickets', [TicketController::class, 'index']);
Route::post('/tickets', [TicketController::class, 'store']);

// app/Http/Controllers/TicketController.php - Business logic here
public function index(Request $request)
{
    $user = auth()->user();
    $query = Ticket::with(['agent', 'customer', 'status', 'priority']);

    // Role-based filtering
    if ($user->role_id == 3) {
        $assignedAgentIds = DB::table('assign_agents')
            ->where('user_id', $user->id)
            ->pluck('agent_id')->toArray();
        $query->whereHas('agent', function($q) use ($assignedAgentIds) {
            $q->whereIn('agent_id', $assignedAgentIds);
        });
    }

    return response()->json($query->paginate(10));
}
```

**Example of INCORRECT implementation:**

```php
// routes/api.php - NEVER do this!
Route::get('/tickets', function() {
    $tickets = Ticket::with('agent')->get(); // ❌ Logic in route
    return response()->json($tickets);
});
```

### Code Organization Rules

- **Controllers**: Handle request validation, business logic, and response formatting
- **Models**: Define relationships, scopes, accessors, and mutators
- **Routes**: Only map HTTP verbs to controller methods
- **Middleware**: Handle cross-cutting concerns (auth, CORS, etc.)
- **Services** (`app/Services/`): Complex business logic that spans multiple models

## Development Commands

### Build and Development

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install

# Build frontend assets (production)
npm run build

# Run Vite development server (frontend only)
npm run dev

# Start full development environment (requires Composer dev dependencies)
composer run dev
# This runs: php artisan serve, php artisan queue:listen, php artisan pail, and npm run dev concurrently
```

### Laravel Artisan Commands

```bash
# Start development server
php artisan serve
# Or for LAMPP environment:
/opt/lampp/bin/php artisan serve

# Run queue worker for background jobs
php artisan queue:listen --tries=1

# View application logs in real-time
php artisan pail --timeout=0

# Clear configuration cache after .env changes
php artisan config:clear

# Run migrations
php artisan migrate

# Run tests
composer run test
# Equivalent to: php artisan config:clear && php artisan test
```

### Database Access

The project uses XAMPP/LAMPP's MySQL server:

```bash
# Access MySQL via LAMPP
/opt/lampp/bin/mysql -u root -p

# Check MySQL status
sudo /opt/lampp/lampp status
```

## Environment Configuration

### Important .env Settings

- `APP_URL`: Must match your actual server URL. Update this for different environments:
  - Laravel dev server: `http://127.0.0.1:8000`
  - XAMPP: `http://localhost/AI/support_tickets_new/public`
  - Production: `https://yourdomain.com`
- **Always run** `php artisan config:clear` after changing `.env` values

### API Configuration

- The frontend reads `APP_URL` from a meta tag in `dashboard.blade.php`
- `bootstrap.js` sets this as the axios base URL with `/api` appended
- All API calls use relative paths that automatically prepend the base URL

## Architecture and Code Organization

### Backend Structure (app/)

**Controllers** (`app/Http/Controllers/`):
- `TicketController.php` - Core ticket management with activity logging
- `TaskController.php` - Task management with role-based agent filtering
- `CustomerController.php` - Customer CRUD, import, and ticket relationships
- `InvoiceController.php` - Invoice generation, PDF download, payment tracking
- `ReportController.php` - All reporting endpoints (monthly, customer, inventory, performance)
- `StaffReportController.php` - Staff-specific reports and monthly splitups
- `UserController.php` - User management and agent assignment to managers
- Dashboard controllers: `AgentDashboardController.php`, `BranchDashboardController.php`
- Settings controllers: `MessageSettingController.php`, `ProductController.php`, etc.

**Models** (`app/Models/`):
- Core models: `Ticket`, `Task`, `Customer`, `User`, `Invoice`, `Payment`
- Relationship tables use pivot models: `AgentTicket`, `AgentTask`, `AssignAgent`, `NotifyTicket`
- Configuration models: `TicketStatus`, `TaskStatus`, `Priority`, `Branch`, `TicketLabel`, `Role`
- Supporting models: `Activity`, `Product`, `Brand`, `Category`, `Department`, `Designation`

**Key Model Relationships**:
- `Ticket::agent()` - Many-to-many via `agent_ticket` table
- `Ticket::notifyUsers()` - Many-to-many via `notify_ticket` table
- `Ticket::labels()` - Many-to-many via `label_ticket` table
- `Task::agent()` - Many-to-many via `agent_task` table, **uses `->withTrashed()`** to show soft-deleted agents
- `Task::ticket()` - Belongs to with `->withTrashed()` to display tracking numbers for soft-deleted tickets
- `Task::taskStatus()` - Belongs to TaskStatus (status field maps to task_statuses.id)

### Frontend Structure (resources/js/)

**Pages** (`resources/js/pages/`):
- `tickets.tsx` - Main ticket list with search, pagination, and filters
- `tasks.tsx` - Task management with role-based filtering and mobile responsive design
- `dashboard.tsx` - Admin dashboard with statistics and charts
- `agent-dashboard.tsx` - Agent-specific dashboard
- `branch-admin-dashboard.tsx` - Branch admin dashboard
- `customers.tsx` - Customer management with import functionality
- `invoices.tsx` - Invoice list and management
- `payments.tsx` - Payment tracking
- `reports.tsx` - Report selection page
- `report-preview.tsx` - Report preview with export options
- `settings.tsx` - Comprehensive settings (326KB file with all configuration)
- Specialized views: `deleted-tickets.tsx`, `verify-tickets.tsx`, `closed-tickets.tsx`

**Components** (`resources/js/components/`):
- **Modal Components**: `TicketDetailsModal.tsx` (105KB), `TaskDetailsModal.tsx`, `AddTaskModal.tsx`, `AddTicketModal.tsx`, `AddCustomerModal.tsx`
- **Layout Components**: `sidebar.tsx`, `topbar.tsx`, `dashboard-layout.tsx`
- **Feature Components**: `AssignAgentModal.tsx`, `InvoiceDetailsOffcanvas.tsx`, `PayInvoiceModal.tsx`, `ProductModal.tsx`
- **shadcn/ui Components** (`components/ui/`): Pre-built, customizable components available:
  - Layout: `dialog.tsx`, `sheet.tsx`, `card.tsx`, `separator.tsx`, `scroll-area.tsx`
  - Forms: `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `label.tsx`, `button.tsx`
  - Feedback: `alert.tsx`, `alert-dialog.tsx`, `tooltip.tsx`, `badge.tsx`
  - Navigation: `tabs.tsx`, `dropdown-menu.tsx`, `command.tsx`
  - Data: `table.tsx`, `avatar.tsx`, `popover.tsx`
  - **Always use these components** instead of creating custom UI elements
  - Import path: `@/components/ui/component-name`
  - Built on Radix UI primitives with Tailwind CSS styling

**Important UI Patterns**:
- Modals use fixed positioning with specific coordinates (e.g., `left: 200px; top: 154px`)
- Standard border color: `#e4e4e4` throughout the application
- Custom scrollbar styling with slate colors
- Color-coded status badges (blue=open, yellow=pending, purple=in-progress, green=closed)
- Responsive design with mobile card views and desktop table views

### API Routes (routes/api.php)

All routes are protected with `auth:sanctum` middleware except:
- `POST /api/login`
- `POST /api/register-customer`

**Key API Endpoints**:
- Tickets: `/api/tickets` (CRUD + relationships: agents, labels, notify users)
- Tasks: `/api/tasks` (CRUD + `/api/task-statuses`, `/api/task-agents`, `/api/task-categories`)
- Customers: `/api/customers` (CRUD + import + `/api/customer-details/{id}`)
- Invoices: `/api/invoices` (CRUD + `/api/invoices/{id}/download`)
- Reports: `/api/reports/*` (monthly-revenue, tickets-report, customer-analytics, etc.)
- Dashboard stats: `/api/dashboard-stats`, `/api/agent-dashboard-stats`, `/api/branch-dashboard-stats`

## Role-Based Access Control

The system has 4 user roles (via `role_id` field):

1. **Admin (role_id = 1)**: Full system access
2. **Agent (role_id = 2)**: Limited to assigned tickets and tasks
3. **Manager (role_id = 3)**: Can view tickets/tasks assigned to their managed agents (via `assign_agents` table)
4. **Branch Admin (role_id = 4)**: Can view tickets/tasks for agents in their branch

### Role Filtering Implementation

**TicketController**: Manager users see only tickets assigned to their managed agents:
```php
if ($user->role_id == 3) {
    $assignedAgentIds = DB::table('assign_agents')
        ->where('user_id', $user->id)
        ->pluck('agent_id')->toArray();
    $query->whereHas('agent', function($q) use ($assignedAgentIds) {
        $q->whereIn('agent_id', $assignedAgentIds);
    });
}
```

**TaskController**:
- Branch Admin filtering uses `whereHas('agent', function($q) use ($user) { $q->where('users.branch_id', $user->branch_id); })`
- `getAgents()` method filters available agents based on role (Agents see only themselves, Managers see assigned agents, Branch Admins see same-branch agents)

## Activity Logging System

All ticket/task changes create activity records in the `activities` table with these fields:
- `type`: Activity type (e.g., "Ticket Status Changed", "Priority Changed")
- `note`: Descriptive message (e.g., "Status changed from Open to Closed")
- `ticket_id`, `created_by`, `status_id`, `priority_id`, `branch_id`, `agent_id`

**Logged Activities**: Status changes, priority changes, branch changes, due date changes, agent assignments/removals, notify user changes, label changes.

## Database Key Tables

- **tickets**: Main ticket data with soft deletes
- **tasks**: Task data with soft deletes
- **customers**: Customer information
- **users**: System users (agents, managers, admins)
- **assign_agents**: Manager-to-agent assignments (columns: `user_id` for manager, `agent_id` for agent)
- **ticket_statuses**: Ticket status definitions
- **task_statuses**: Task status definitions (1=open, 2=pending, 3=In Progress, 4=closed)
- **activities**: Audit log for all changes
- **invoices**, **payments**: Financial tracking
- **products**, **brands**, **categories**: Inventory management
- **ticket_images**: File attachments
- **product_tickets**: Spare parts tracking

## Important Implementation Details

### Status Management

**Task Statuses**: Must use `task_statuses` table (not hardcoded):
- Frontend fetches from `/api/task-statuses`
- Status display uses `task.task_status?.status` for label
- Closing status is id=4 (not 3), includes `closing_comment` field

**Ticket Statuses**: Loaded dynamically from `ticket_statuses` table via `/api/ticket-statuses`

### Soft Deletes

- Both `Ticket` and `Task` models use `SoftDeletes` trait
- To show related data for soft-deleted records, use `->withTrashed()` in relationships
- Example: `Task::ticket()` relationship uses `->withTrashed()` to display tracking numbers

### File Uploads

- Ticket attachments: `public/uploads/ticket_image/`
- Handle with `TicketController::uploadAttachment()` and store in `ticket_images` table

### Frontend-Backend Communication

- Axios configured in `bootstrap.js` with base URL from meta tag
- All API calls use relative paths (e.g., `/tickets` becomes `http://APP_URL/api/tickets`)
- Toast notifications (react-hot-toast) for success/error feedback

### Modal Positioning

Many modals use fixed positioning for consistency:
- Add/Edit forms typically: `position: fixed; left: 200px; top: 154px; width: 400px`
- Two-column detail modals: 30% left (info), 70% right (tabs)
- Sub-modals (like Add Note): `position: absolute; right: 20px; top: 170px; width: 400px; z-index: 9999999`

## Common Development Patterns

### Adding a New Feature with Role-Based Filtering

**Backend (Laravel):**

1. Create/update controller method in `app/Http/Controllers/`
   - Use Eloquent models for all database operations
   - Implement role-based filtering logic
   - Add request validation
   - Return JSON responses

2. Define route in `routes/api.php`
   - Map HTTP verb to controller method ONLY
   - Add `auth:sanctum` middleware
   - Example: `Route::get('/feature', [FeatureController::class, 'index']);`
   - **Never** write business logic in the route file

3. Update/create Eloquent model in `app/Models/`
   - Define relationships (use `->withTrashed()` if needed for soft deletes)
   - Add fillable/guarded properties
   - Define accessors/mutators if needed

**Frontend (React + shadcn/ui):**

4. Create React component in `resources/js/pages/` or `resources/js/components/`
   - Use shadcn/ui components from `resources/js/components/ui/`
   - Import needed components: `Button`, `Dialog`, `Select`, `Input`, `Table`, etc.
   - Follow TypeScript/JSX patterns from existing components
   - Use axios for API calls with relative paths

5. Add route to React Router in `app.jsx`

6. Add menu item in `sidebar.tsx` (implement role-based visibility if needed)

7. Build assets: `npm run build`

**Example Implementation:**

```php
// ❌ WRONG - Logic in route
Route::get('/reports', function() {
    return Report::all();
});

// ✅ CORRECT - Route only references controller
Route::get('/reports', [ReportController::class, 'index']);

// app/Http/Controllers/ReportController.php
public function index(Request $request)
{
    $user = auth()->user();
    $query = Report::with('user', 'category');

    if ($user->role_id == 2) {
        $query->where('user_id', $user->id);
    }

    return response()->json($query->paginate(15));
}
```

```tsx
// React component using shadcn/ui
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";

export default function MyFeature() {
    return (
        <Dialog>
            <DialogContent>
                <DialogHeader>Feature Title</DialogHeader>
                <Select>
                    <SelectContent>
                        <SelectItem value="1">Option 1</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleSubmit}>Submit</Button>
            </DialogContent>
        </Dialog>
    );
}
```

### Updating Task/Ticket Status

1. Ensure status tables (`task_statuses`, `ticket_statuses`) are up to date
2. Frontend fetches statuses dynamically from API
3. Update uses relationship: `$task->taskStatus()` or `$ticket->status()`
4. Log activity in `activities` table with old/new values

### Testing API Changes

Use the built-in test suite:
```bash
composer run test
```

Or test specific endpoints with tools like Postman/Insomnia using Sanctum token authentication.

## Build and Deployment

### Production Build

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Build optimized assets
npm run build

# Optimize Laravel
php artisan optimize
```

### Vite Build Configuration

The project uses code splitting for optimal performance:
- `react-vendor`: React core libraries
- `ui-vendor`: Radix UI components
- `charts`: Recharts library
- `utils`: Axios, date-fns, class utilities

## Troubleshooting

### Build Issues

- If build fails, check that all dependencies are installed: `composer install && npm install`
- For type errors, check TypeScript interfaces match backend response structure
- Large files like `settings.tsx` (326KB) and `TicketDetailsModal.tsx` (105KB) may cause slow builds

### Database Issues

- After `.env` changes, always run: `php artisan config:clear`
- For migration issues, check database connection in `.env` (LAMPP uses different socket)
- If tracking numbers don't show, ensure relationships use `->withTrashed()`

### Role Filtering Issues

- Check `assign_agents` table has correct `user_id` (manager) and `agent_id` entries
- Verify `role_id` values: 1=Admin, 2=Agent, 3=Manager, 4=Branch Admin
- Manager filtering requires non-empty `assign_agents` records

### Missing PHP Extensions

XAMPP PHP may lack required extensions. Use system PHP (8.2+) with:
```bash
sudo apt-get install php8.2-xml php8.2-mysql php8.2-mbstring php8.2-curl
```
