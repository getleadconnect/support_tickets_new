<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchDashboardController;
use App\Http\Controllers\AgentDashboardController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\TicketLabelController;
use App\Http\Controllers\AdditionalFieldController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StaffReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MessageSettingController;
use App\Http\Controllers\QRCodeController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CompanyController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register-customer', [CustomerController::class, 'registerCustomer']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Company routes
    Route::get('/company', [CompanyController::class, 'getCompanyInfo']);
    
    // Branch Dashboard route
    Route::get('/branch-dashboard-stats', [BranchDashboardController::class, 'getStats']);
    
    // Agent Dashboard route
    Route::get('/agent-dashboard-stats', [AgentDashboardController::class, 'getStats']);
    
    // Ticket routes
    Route::get('/tickets/closed', [TicketController::class, 'closedTickets']);
    Route::get('/tickets/trashed', [TicketController::class, 'trashed']);
    Route::put('/tickets/{ticket}/restore', [TicketController::class, 'restore']);
    Route::put('/tickets/{ticket}/verify', [TicketController::class, 'verifyTicket']);
    Route::put('/tickets/{ticket}/update-issue', [TicketController::class, 'updateIssueDescription']);
    Route::apiResource('tickets', TicketController::class);
    Route::post('/tickets/{ticket}/agents', [TicketController::class, 'addAgent']);
    Route::delete('/tickets/{ticket}/agents/{agent}', [TicketController::class, 'removeAgent']);
    Route::delete('/tickets/{ticket}/notify/{user}', [TicketController::class, 'removeNotifyUser']);
    Route::post('/tickets/{ticket}/labels', [TicketController::class, 'addLabel']);
    Route::delete('/tickets/{ticket}/labels/{label}', [TicketController::class, 'removeLabel']);

    Route::get('/dashboard-stats', [TicketController::class, 'getDashboardStats']); //for app only
    
    // Ticket Log Note routes
    Route::get('/tickets/{ticket}/log-notes', [TicketController::class, 'getLogNotes']);
    Route::post('/tickets/{ticket}/log-notes', [TicketController::class, 'addLogNote']);
    
    // Ticket Task routes
    Route::get('/tickets/{ticket}/tasks', [TicketController::class, 'getTasks']);
    Route::post('/tickets/{ticket}/tasks', [TicketController::class, 'addTask']);
    
    // Ticket Attachment routes
    Route::get('/tickets/{ticket}/attachments', [TicketController::class, 'getAttachments']);
    Route::post('/tickets/{ticket}/attachments', [TicketController::class, 'uploadAttachment']);
    Route::delete('/tickets/{ticket}/attachments/{attachment}', [TicketController::class, 'deleteAttachment']);
    
    // Ticket Spare Parts routes
    Route::get('/tickets/{ticket}/spare-parts', [TicketController::class, 'getSpareParts']);
    Route::post('/tickets/{ticket}/spare-parts', [TicketController::class, 'addSparePart']);
    Route::delete('/tickets/{ticket}/spare-parts/{sparePart}', [TicketController::class, 'deleteSparePart']);
    
    // Ticket Additional Fields routes
    Route::get('/tickets/{ticket}/additional-fields', [TicketController::class, 'getAdditionalFields']);
    Route::post('/tickets/{ticket}/additional-fields', [TicketController::class, 'storeAdditionalField']);

    // Task Management routes
    Route::apiResource('tasks', TaskController::class);
    Route::get('/task-types', [TaskController::class, 'getTaskTypes']);
    Route::get('/task-categories', [TaskController::class, 'getTaskCategories']);
    Route::get('/task-statuses', [TaskController::class, 'getTaskStatuses']);
    Route::get('/task-agents', [TaskController::class, 'getAgents']);
    Route::get('/task-ticket/{trackingNumber}', [TaskController::class, 'getTicketByTrackingNumber']);
    Route::get('/tasks/{id}/activities', [TaskController::class, 'getTaskActivities']);
    Route::get('/tasks/{id}/notes', [TaskController::class, 'getTaskNotes']);
    Route::post('/tasks/{id}/notes', [TaskController::class, 'addTaskNote']);

       
    
    // Customer routes
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::get('/customer-details/{customer}', [CustomerController::class, 'customerDetails']);
    Route::get('/customers-with-tickets', [CustomerController::class, 'customersWithTickets']);
    Route::post('/customers/import', [CustomerController::class, 'importCustomers']);
    Route::get('/customers/download-template', [CustomerController::class, 'downloadTemplate']);
        // Ticket Status routes
    Route::get('/ticket-statuses', [TicketController::class, 'getTicketStatus']);
       // Priorities routes
    Route::get('/priorities', [TicketController::class, 'getPriorities']);
    
    // Branches routes (old endpoint for compatibility)
    Route::get('/branches', [TicketController::class, 'getBranches']);
    
    // Branch Management CRUD routes
    Route::apiResource('branches-management', BranchController::class)->parameters([
        'branches-management' => 'branch'
    ]);
        
    // Ticket Labels routes (old endpoint for compatibility)
    Route::get('/ticket-labels',[TicketController::class, 'getTicketLabels']);
    
    // Ticket Labels CRUD routes
    Route::apiResource('ticket-labels-management', TicketLabelController::class)->parameters([
        'ticket-labels-management' => 'ticketLabel'
    ]);
    
    // Products routes
    Route::get('/products', [ProductController::class, 'getProducts']);
    Route::get('/product-list', [ProductController::class, 'index']);
    Route::post('/add-product', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/brands', [ProductController::class, 'getBrands']);
    
    // Brand routes
    Route::apiResource('brands', BrandController::class);
    
    // Category routes
    Route::apiResource('categories', CategoryController::class);
    
    // Department routes
    Route::apiResource('departments', DepartmentController::class);
    
    // Designation routes
    Route::apiResource('designations', DesignationController::class);
    
    // Additional Fields routes
    Route::apiResource('additional-fields', AdditionalFieldController::class);
    
    // Invoice routes
    Route::get('/invoices/check-ticket/{ticketId}', [InvoiceController::class, 'checkInvoiceExists']);
    Route::get('/invoices/{invoice}/download', [InvoiceController::class, 'downloadPDF']);
    Route::get('/invoices/{invoice}/details', [InvoiceController::class, 'getInvoiceDetails']);
    Route::apiResource('invoices', InvoiceController::class);
    
    // Payment routes
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/invoices/{invoice}/payment', [PaymentController::class, 'recordPayment']);
    
    // User routes
    Route::apiResource('users', UserController::class);

    // Agent users route (role_id = 2)
    Route::get('/agent-users', [UserController::class, 'getAgentUsers']);

    // Assign agents to manager routes
    Route::post('/users/assign-agents', [UserController::class, 'assignAgentsToManager']);
    Route::get('/users/{user}/assigned-agents', [UserController::class, 'getAssignedAgents']);
    Route::delete('/users/{user}/remove-agent/{agent}', [UserController::class, 'removeAgentAssignment']);
    
    // Role routes
    Route::apiResource('roles', RoleController::class);
    
    // Activity routes
    Route::get('/activities/latest', [ActivityController::class, 'getLatestActivities']);

    // Staff Reports routes
    Route::get('/reports/staff-tickets', [StaffReportController::class, 'getStaffTicketsReport']);
    Route::get('/reports/staff-monthly-splitups', [StaffReportController::class, 'getStaffMonthlySplitups']);
    Route::get('/reports/staff-tickets-excel', [StaffReportController::class, 'generateStaffTicketsExcel']);
    Route::get('/reports/staff-monthly-splitups-excel', [StaffReportController::class, 'exportMonthlySplitupsExcel']);
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    
    // Report routes
    Route::prefix('reports')->group(function () {
        Route::get('/monthly-revenue', [ReportController::class, 'getMonthlyRevenue']);
        Route::get('/daily-revenue', [ReportController::class, 'getDailyRevenue']);
        Route::get('/tickets-report', [ReportController::class, 'getTicketsReport']);
        Route::get('/ticket-statistics', [ReportController::class, 'getTicketStatistics']);
        Route::get('/customer-analytics', [ReportController::class, 'getCustomerAnalytics']);
        Route::get('/customer-report', [ReportController::class, 'getCustomerReport']);
        Route::get('/agent-performance', [ReportController::class, 'getAgentPerformance']);
        Route::get('/product-usage', [ReportController::class, 'getProductUsageReport']);
        Route::get('/inventory-report', [ReportController::class, 'getInventoryReport']);
        Route::get('/invoice-report', [ReportController::class, 'getInvoiceReport']);
        Route::get('/dashboard-summary', [ReportController::class, 'getDashboardSummary']);
        Route::get('/quick-stats', [ReportController::class, 'getQuickStats']);
        Route::get('/monthly-summary', [ReportController::class, 'getMonthlySummary']);
    });
    
    // Message Settings routes
    Route::apiResource('message-settings', MessageSettingController::class);
    Route::put('/message-settings/{id}/toggle-status', [MessageSettingController::class, 'toggleStatus']);
    Route::get('/message-types', [MessageSettingController::class, 'getMessageTypes']);
    
    // QR Code routes
    Route::get('/qrcodes', [QRCodeController::class, 'index']);
    Route::post('/qrcodes/generate', [QRCodeController::class, 'generate']);
    Route::delete('/qrcodes/{id}', [QRCodeController::class, 'destroy']);
});
