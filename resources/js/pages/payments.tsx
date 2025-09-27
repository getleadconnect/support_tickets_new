import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  invoice_id: number;
  ticket_id: number;
  customer_id: number;
  service_charge: number;
  item_amount: number;
  total_amount: number;
  discount: number;
  net_amount: number;
  payment_mode: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  invoice?: {
    id: number;
    invoice_id: string;
    status: string;
  };
  ticket?: {
    id: number;
    issue: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  createdBy?: {
    id: number;
    name: string;
  };
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalNetAmount, setTotalNetAmount] = useState(0);
  
  // Filter states - Initialize with last 3 months
  const getInitialDates = () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];

    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startDate = threeMonthsAgo.toISOString().split('T')[0];

    return { startDate, endDate };
  };

  const { startDate: initialStartDate, endDate: initialEndDate } = getInitialDates();

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, [currentPage, entriesPerPage]);

  const fetchPayments = async (clearFilters = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: entriesPerPage.toString(),
        search: clearFilters ? '' : searchTerm,
        start_date: clearFilters ? '' : startDate,
        end_date: clearFilters ? '' : endDate,
        customer_id: clearFilters ? '' : (selectedCustomer === 'all' ? '' : selectedCustomer),
        payment_mode: clearFilters ? '' : (selectedPaymentMode === 'all' ? '' : selectedPaymentMode)
      });

      const response = await axios.get(`/payments?${params}`);
      
      if (response.data) {
        const paymentsData = response.data.data || [];
        setPayments(paymentsData);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.current_page || 1);
        
        // Use total net amount from API (includes all filtered records, not just current page)
        setTotalNetAmount(response.data.total_net_amount || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
    fetchPayments();
  };

  const handleClearFilter = () => {
    // Reset to last 3 months instead of clearing completely
    const { startDate: defaultStart, endDate: defaultEnd } = getInitialDates();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setSelectedCustomer('all');
    setSelectedPaymentMode('all');
    setSearchTerm('');
    setCurrentPage(1);
    // Fetch with default date range
    setTimeout(() => fetchPayments(false), 100);
  };

  const getPaymentModeBadge = (mode: string) => {
    const modeLower = mode.toLowerCase();
    if (modeLower === 'cash') {
      return <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">Cash</span>;
    } else if (modeLower === 'card' || modeLower === 'credit card' || modeLower === 'debit card') {
      return <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">Card</span>;
    } else if (modeLower === 'upi') {
      return <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-medium">UPI</span>;
    } else if (modeLower === 'bank transfer' || modeLower === 'neft' || modeLower === 'rtgs') {
      return <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">Bank Transfer</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-medium">{mode}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(startIndex + payments.length - 1, totalItems);

  // Check if filters are at default (showing last 3 months only)
  const { startDate: defaultStart, endDate: defaultEnd } = getInitialDates();
  const isDefaultFilter = startDate === defaultStart &&
                          endDate === defaultEnd &&
                          (!selectedCustomer || selectedCustomer === '' || selectedCustomer === 'all') &&
                          (!selectedPaymentMode || selectedPaymentMode === '' || selectedPaymentMode === 'all') &&
                          searchTerm === '';

  return (
    <DashboardLayout>
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Payments</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-800">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800">Payments</span>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-3">
            {/* Total Amount Display - Mobile at top */}
            <div className="flex sm:hidden justify-between items-center mb-2">
              <span className="text-sm font-medium">Filter By:</span>
              <div className="text-right">
                <span className="text-xs text-gray-500">Total Amount</span>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(totalNetAmount)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex-1">
                <span className="hidden sm:inline text-sm font-medium mb-2">Filter By:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-2 sm:mt-0">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                  
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                  
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedPaymentMode} onValueChange={setSelectedPaymentMode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Modes</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFilter}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      style={{ width: '100px' }}
                    >
                      Filter
                    </Button>

                    {(startDate || endDate || (selectedCustomer && selectedCustomer !== 'all') || (selectedPaymentMode && selectedPaymentMode !== 'all')) && (
                      <Button 
                        onClick={handleClearFilter}
                        variant="outline"
                        style={{ width: '100px' }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Total Amount Display - Desktop */}
              <div className="hidden sm:flex flex-col items-end ml-4">
                <span className="text-xs text-gray-500">Total Amount</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(totalNetAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Default Filter Message */}
        {isDefaultFilter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700 flex items-center">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Showing last 3 months data only. Use filters above to view different date ranges.
            </p>
          </div>
        )}

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm">Show</span>
              <Select value={entriesPerPage.toString()} onValueChange={(value) => setEntriesPerPage(parseInt(value))}>
                <SelectTrigger className="w-16 sm:w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs sm:text-sm">entries</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm">Search:</span>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                className="flex-1 sm:w-48"
                placeholder="Search payments..."
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border" style={{ borderColor: '#e4e4e4' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: '#e4e4e4' }}>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>#</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Payment ID</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Invoice ID</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Ticket ID</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Customer</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Service Charge</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Item Amount</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Total Amount</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Discount</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Net Amount</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Payment Mode</th>
                  <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Payment Date</th>
                  <th className="text-left p-2 text-sm font-medium">Created By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#e4e4e4' }}>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{startIndex + index}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>PAY-{payment.id.toString().padStart(6, '0')}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{payment.invoice?.invoice_id || payment.invoice_id}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{payment.ticket_id}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{payment.customer?.name || 'N/A'}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{formatCurrency(payment.service_charge)}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{formatCurrency(payment.item_amount)}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{formatCurrency(payment.total_amount)}</td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{formatCurrency(payment.discount)}</td>
                      <td className="p-2 text-sm border-r font-semibold" style={{ borderColor: '#e4e4e4' }}>{formatCurrency(payment.net_amount)}</td>
                      <td className="p-2 border-r" style={{ borderColor: '#e4e4e4' }}>
                        {getPaymentModeBadge(payment.payment_mode)}
                      </td>
                      <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>
                        {new Date(payment.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, '-')}
                      </td>
                      <td className="p-2 text-sm">{payment.createdBy?.name || 'Super Admin'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading payments...
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payments found
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={payment.id} className="border rounded-lg p-4" style={{ borderColor: '#e4e4e4' }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">#{startIndex + index}</span>
                          <span className="font-medium text-sm">PAY-{payment.id.toString().padStart(6, '0')}</span>
                        </div>
                        <p className="text-xs text-gray-600">Invoice: {payment.invoice?.invoice_id || payment.invoice_id}</p>
                        <p className="text-xs text-gray-600">Ticket: #{payment.ticket_id}</p>
                      </div>
                      {getPaymentModeBadge(payment.payment_mode)}
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Customer:</span>
                        <span className="font-medium">{payment.customer?.name || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Service:</span>
                          <p className="font-medium">{formatCurrency(payment.service_charge)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Items:</span>
                          <p className="font-medium">{formatCurrency(payment.item_amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <p className="font-medium">{formatCurrency(payment.total_amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Discount:</span>
                          <p className="font-medium">{formatCurrency(payment.discount)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: '#e4e4e4' }}>
                        <span>Net Amount:</span>
                        <span className="text-green-600">{formatCurrency(payment.net_amount)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-between text-xs text-gray-500" style={{ borderColor: '#e4e4e4' }}>
                      <span>{new Date(payment.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '-')}</span>
                      <span>By: {payment.createdBy?.name || 'Super Admin'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {startIndex} to {endIndex} of {totalItems} entries
            </div>
            
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-xs sm:text-sm"
              >
                Previous
              </Button>
              
              {/* Desktop Page numbers */}
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage - 2 + i;
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={pageNum === currentPage ? "bg-blue-600 text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
              
              {/* Mobile page indicator */}
              <div className="flex sm:hidden items-center px-3 text-xs">
                Page {currentPage} of {totalPages}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-xs sm:text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}