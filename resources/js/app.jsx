import './bootstrap';
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Eager load only critical components
import { Login } from './pages/login';
import { Register } from './pages/register';

// Lazy load all other pages
const DashboardRouter = lazy(() => import('./components/DashboardRouter'));
const Tickets = lazy(() => import('./pages/tickets'));
const VerifyTickets = lazy(() => import('./pages/verify-tickets'));
const ClosedTickets = lazy(() => import('./pages/closed-tickets'));
const DeletedTickets = lazy(() => import('./pages/deleted-tickets'));
const Customers = lazy(() => import('./pages/customers'));
const CustomerDetails = lazy(() => import('./pages/customer-details'));
const Settings = lazy(() => import('./pages/settings'));
const Products = lazy(() => import('./pages/products'));
const Invoices = lazy(() => import('./pages/invoices'));
const Payments = lazy(() => import('./pages/payments'));
const Reports = lazy(() => import('./pages/reports'));
const ReportPreview = lazy(() => import('./pages/report-preview'));

// Loading component
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-lg text-slate-600">Loading...</p>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    return isAuthenticated ? (
        <Suspense fallback={<PageLoader />}>
            {children}
        </Suspense>
    ) : (
        <Navigate to="/login" replace />
    );
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            style: {
                                background: '#10b981',
                            },
                        },
                        error: {
                            duration: 4000,
                            style: {
                                background: '#ef4444',
                            },
                        },
                    }}
                />
                <Routes>
                    <Route path="/login" element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    } />
                    <Route path="/register" element={
                        <Register />
                    } />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardRouter />
                        </ProtectedRoute>
                    } />
                    <Route path="/tickets" element={
                        <ProtectedRoute>
                            <Tickets />
                        </ProtectedRoute>
                    } />
                    <Route path="/verify-tickets" element={
                        <ProtectedRoute>
                            <VerifyTickets />
                        </ProtectedRoute>
                    } />
                    <Route path="/closed-tickets" element={
                        <ProtectedRoute>
                            <ClosedTickets />
                        </ProtectedRoute>
                    } />
                    <Route path="/deleted-tickets" element={
                        <ProtectedRoute>
                            <DeletedTickets />
                        </ProtectedRoute>
                    } />
                    <Route path="/customers" element={
                        <ProtectedRoute>
                            <Customers />
                        </ProtectedRoute>
                    } />
                    <Route path="/customers/:id" element={
                        <ProtectedRoute>
                            <CustomerDetails />
                        </ProtectedRoute>
                    } />
                    <Route path="/products" element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    } />
                    <Route path="/product-list" element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                        <ProtectedRoute>
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-lg">Orders Page (Coming Soon)</div>
                            </div>
                        </ProtectedRoute>
                    } />
                    <Route path="/invoices" element={
                        <ProtectedRoute>
                            <Invoices />
                        </ProtectedRoute>
                    } />
                    <Route path="/payments" element={
                        <ProtectedRoute>
                            <Payments />
                        </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    } />
                    <Route path="/report-preview" element={
                        <ProtectedRoute>
                            <ReportPreview />
                        </ProtectedRoute>
                    } />
                    <Route path="/departments" element={
                        <ProtectedRoute>
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-lg">Departments Page (Coming Soon)</div>
                            </div>
                        </ProtectedRoute>
                    } />
                    <Route path="/users" element={
                        <ProtectedRoute>
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="text-lg">Users Page (Coming Soon)</div>
                            </div>
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}