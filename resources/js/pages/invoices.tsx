import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Download, Printer, DollarSign, Eye, Trash2 } from 'lucide-react';
import { PayInvoiceModal } from '@/components/PayInvoiceModal';
import { InvoiceDetailsOffcanvas } from '@/components/InvoiceDetailsOffcanvas';
import toast from 'react-hot-toast';

interface Invoice {
  id: number;
  invoice_id: string;
  ticket_id: number;
  customer_id: number;
  invoice_date: string;
  service_type?: string;
  service_charge: number;
  item_cost: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_by: number;
  customer?: {
    id: number;
    name: string;
  };
  ticket?: {
    id: number;
  };
  createdBy?: {
    id: number;
    name: string;
  };
}

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Invoice details offcanvas states
  const [showDetailsOffcanvas, setShowDetailsOffcanvas] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteInvoice, setPendingDeleteInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [currentPage, entriesPerPage]);

  const fetchInvoices = async (clearFilters = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: entriesPerPage.toString(),
        search: clearFilters ? '' : searchTerm,
        start_date: clearFilters ? '' : startDate,
        end_date: clearFilters ? '' : endDate,
        customer_id: clearFilters ? '' : (selectedCustomer === 'all' ? '' : selectedCustomer),
        status: clearFilters ? '' : (selectedStatus === 'all' ? '' : selectedStatus)
      });

      const response = await axios.get(`/invoices?${params}`);
      
      if (response.data) {
        setInvoices(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.current_page || 1);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
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
    fetchInvoices();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCustomer('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
    fetchInvoices(true); // Pass true to clear filters
  };

  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    fetchInvoices();
  };

  const handleViewDetails = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setShowDetailsOffcanvas(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setPendingDeleteInvoice(invoice);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteInvoice) return;

    try {
      await axios.delete(`/invoices/${pendingDeleteInvoice.id}`);
      toast.success('Invoice deleted successfully');
      setDeleteConfirmOpen(false);
      setPendingDeleteInvoice(null);
      fetchInvoices();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete invoice';
      toast.error(message);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      // Create a hidden anchor element to trigger download
      const response = await axios.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        }
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePrintInvoice = async (invoiceId: number) => {
    try {
      const response = await axios.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        }
      });
      
      // Create blob URL and open in new tab
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      
      // Clean up the URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast.success('Invoice opened in new tab');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to open invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') {
      return <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">Paid</span>;
    } else if (statusLower === 'pending') {
      return <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">Pending</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage + 1;
  const endIndex = Math.min(startIndex + invoices.length - 1, totalItems);

  return (
    <DashboardLayout>
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Invoices</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-800">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800">Invoices</span>
          </div>
        </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Filter By:</span>
          
          <div className="flex flex-wrap gap-3 items-end">
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[16.66%] min-w-[120px]"
            />
            
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[16.66%] min-w-[120px]"
            />
            
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-[16.66%] min-w-[150px]">
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[16.66%] min-w-[130px]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
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

              {(startDate || endDate || (selectedCustomer && selectedCustomer !== 'all') || (selectedStatus && selectedStatus !== 'all')) && (
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
      </div>

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
              placeholder="Search invoices..."
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border" style={{ borderColor: '#e4e4e4' }}>
            <thead>
              <tr className="border-b" style={{ borderColor: '#e4e4e4' }}>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>#</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Invoice_id</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Ticket Id</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Customer</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Inv.Date</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Service Type</th>
                <th className="text-right p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Service Charge</th>
                <th className="text-right p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Item Cost</th>
                <th className="text-right p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Total Amount</th>
                <th className="text-right p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Discount</th>
                <th className="text-right p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Net Amount</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Created By</th>
                <th className="text-left p-2 text-sm font-medium border-r" style={{ borderColor: '#e4e4e4' }}>Pay.Status</th>
                <th className="text-left p-2 text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, index) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#e4e4e4' }}>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{startIndex + index}</td>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>
                      <button
                        onClick={() => handleViewDetails(invoice.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {invoice.invoice_id}
                      </button>
                    </td>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{invoice.ticket_id}</td>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{invoice.customer?.name || 'N/A'}</td>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>
                      {new Date(invoice.invoice_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '-')}
                    </td>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>
                      {invoice.service_type ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          invoice.service_type === 'Shop'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {invoice.service_type}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 text-sm text-right border-r" style={{ borderColor: '#e4e4e4' }}>₹{invoice.service_charge}</td>
                    <td className="p-2 text-sm text-right border-r" style={{ borderColor: '#e4e4e4' }}>₹{invoice.item_cost}</td>
                    <td className="p-2 text-sm text-right border-r" style={{ borderColor: '#e4e4e4' }}>₹{invoice.total_amount}</td>
                    <td className="p-2 text-sm text-right border-r" style={{ borderColor: '#e4e4e4' }}>₹{invoice.discount || 0}</td>
                    <td className="p-2 text-sm text-right border-r font-semibold" style={{ borderColor: '#e4e4e4' }}>₹{invoice.net_amount || invoice.total_amount}</td>
                    <td className="p-2 text-sm border-r" style={{ borderColor: '#e4e4e4' }}>{invoice.createdBy?.name || 'Super Admin'}</td>
                    <td className="p-2 border-r" style={{ borderColor: '#e4e4e4' }}>
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="p-2">
                      {invoice.status?.toLowerCase() === 'paid' ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="h-8 w-8 p-0 rounded-full border-blue-500 hover:bg-blue-50"
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintInvoice(invoice.id)}
                            className="h-8 w-8 p-0 rounded-full border-red-500 hover:bg-red-50"
                            title="Print Invoice"
                          >
                            <Printer className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={() => handlePayClick(invoice)}
                            className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-3 py-1 text-xs font-medium rounded"
                          >
                            Pay →
                          </Button>
                          {user?.role_id === 1 && (
                            <Trash2
                              className="h-4 w-4 text-red-500 cursor-pointer hover:text-red-700"
                              onClick={() => handleDeleteClick(invoice)}
                            />
                          )}
                        </div>
                      )}
                    </td>
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
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoices found
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice, index) => (
                <div key={invoice.id} className="border rounded-lg p-4" style={{ borderColor: '#e4e4e4' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">#{startIndex + index}</span>
                        <button
                          onClick={() => handleViewDetails(invoice.id)}
                          className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {invoice.invoice_id}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">Ticket: #{invoice.ticket_id}</p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer:</span>
                      <span className="font-medium">{invoice.customer?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>{new Date(invoice.invoice_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '-')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service Type:</span>
                      <span>
                        {invoice.service_type ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            invoice.service_type === 'Shop'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {invoice.service_type}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service:</span>
                      <span>₹{invoice.service_charge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items:</span>
                      <span>₹{invoice.item_cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total:</span>
                      <span>₹{invoice.total_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount:</span>
                      <span>₹{invoice.discount || 0}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t" style={{ borderColor: '#e4e4e4' }}>
                      <span>Net Amount:</span>
                      <span>₹{invoice.net_amount || invoice.total_amount}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: '#e4e4e4' }}>
                    <span className="text-xs text-gray-500">By: {invoice.createdBy?.name || 'Super Admin'}</span>
                    {invoice.status?.toLowerCase() === 'paid' ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="h-8 w-8 p-0 rounded-full border-blue-500 hover:bg-blue-50"
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintInvoice(invoice.id)}
                          className="h-8 w-8 p-0 rounded-full border-red-500 hover:bg-red-50"
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => handlePayClick(invoice)}
                          className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-3 py-1 text-xs font-medium rounded"
                        >
                          Pay →
                        </Button>
                        {user?.role_id === 1 && (
                          <Trash2
                            className="h-4 w-4 text-red-500 cursor-pointer hover:text-red-700"
                            onClick={() => handleDeleteClick(invoice)}
                          />
                        )}
                      </div>
                    )}
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
          
          <div className="flex items-center justify-center sm:justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm"
            >
              Prev
            </Button>
            
            {/* Desktop page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-blue-600 text-white" : ""}
                  >
                    {pageNum}
                  </Button>
                );
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
    
    {/* Payment Modal */}
    {selectedInvoice && (
      <PayInvoiceModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />
    )}

    {/* Invoice Details Offcanvas */}
    <InvoiceDetailsOffcanvas
      isOpen={showDetailsOffcanvas}
      onClose={() => {
        setShowDetailsOffcanvas(false);
        setSelectedInvoiceId(null);
      }}
      invoiceId={selectedInvoiceId}
    />

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete invoice <strong>{pendingDeleteInvoice?.invoice_id}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setDeleteConfirmOpen(false);
            setPendingDeleteInvoice(null);
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </DashboardLayout>
  );
}