import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Filter,
  Trash2,
  RotateCcw,
  Calendar,
  User,
  Home,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Ticket {
  id: number;
  tracking_number: string;
  issue: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  closed_time?: string | null;
  customer: {
    id: number;
    name: string;
    email?: string;
  };
  user?: {
    id: number;
    name: string;
  };
  ticketStatus?: {
    id: number;
    status: string;
    color_code?: string;
  };
  ticketPriority?: {
    id: number;
    title: string;
    color?: string;
  };
  agent?: Array<{
    id: number;
    name: string;
  }>;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
}

export default function ClosedTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerId: 'all',
    agentId: 'all',
  });

  useEffect(() => {
    fetchClosedTickets();
    fetchCustomers();
    // Only fetch agents if user is admin (role_id = 1)
    if (user?.role_id === 1) {
      fetchAgents();
    }
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await axios.get('/agent-users');
      setAgents(response.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchClosedTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/tickets', {
        params: {
          per_page: 1000,
          status: 3, // Filter for closed status on backend
          customer_id: filters.customerId !== 'all' ? filters.customerId : null,
          agent_id: filters.agentId !== 'all' ? filters.agentId : null,
        },
      });

      // All tickets returned are already closed (filtered by backend)
      let closedTickets = response.data.data || [];
      
      // Apply date filters if provided
      if (filters.startDate) {
        closedTickets = closedTickets.filter((ticket: Ticket) => {
          const ticketDate = new Date(ticket.closed_time || ticket.updated_at);
          const startDate = new Date(filters.startDate);
          return ticketDate >= startDate;
        });
      }
      
      if (filters.endDate) {
        closedTickets = closedTickets.filter((ticket: Ticket) => {
          const ticketDate = new Date(ticket.closed_time || ticket.updated_at);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          return ticketDate <= endDate;
        });
      }
      
      setTickets(closedTickets);
    } catch (error) {
      console.error('Error fetching closed tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchClosedTickets();
  };

  const handleClear = async () => {
    // Reset filters to default values
    const defaultFilters = {
      startDate: '',
      endDate: '',
      customerId: 'all',
      agentId: 'all',
    };
    setFilters(defaultFilters);
    
    // Fetch all closed tickets without filters
    setLoading(true);
    try {
      const response = await axios.get('/tickets', {
        params: {
          per_page: 1000,
        },
      });

      // Filter tickets to show only those with status = 3 (closed)
      const closedTickets = response.data.data?.filter((ticket: Ticket) => 
        ticket.status === 3 || ticket.ticketStatus?.id === 3
      ) || [];
      
      setTickets(closedTickets);
    } catch (error) {
      console.error('Error fetching closed tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReopenTicket = async (ticketId: number) => {
    try {
      // Set status to 1 (Open)
      await axios.put(`/tickets/${ticketId}`, {
        status: 1
      });
      toast.success('Ticket reopened successfully');
      fetchClosedTickets();
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast.error('Failed to reopen ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await axios.delete(`/tickets/${ticketId}`);
      toast.success('Ticket deleted successfully');
      fetchClosedTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout title="Tickets">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 sm:px-6 py-4" style={{ borderBottom: '1px solid #c4c4c4' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Closed Tickets</h1>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/tickets')}
                className="w-full sm:w-auto"
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                Tickets
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white mx-4 sm:mx-6 mt-4 p-4 rounded-lg shadow-sm">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium mb-1">Filter By:</span>
            
            <div className="flex flex-wrap gap-3 items-end">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-[16.66%] min-w-[120px]"
                placeholder="Start Date"
              />
              
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-[16.66%] min-w-[120px]"
                placeholder="End Date"
              />
              
              <Select
                value={filters.customerId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger className="w-[16.66%] min-w-[150px]">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Only show agent filter for admin users (role_id = 1) */}
              {user?.role_id === 1 && (
                <Select
                  value={filters.agentId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, agentId: value }))}
                >
                  <SelectTrigger className="w-[16.66%] min-w-[150px]">
                    <SelectValue placeholder="Select Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleFilter}
                  className="bg-blue-600 hover:bg-blue-700"
                  style={{ width: '140px' }}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={handleClear}
                  style={{ width: '140px' }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="px-4 sm:px-6 mt-4 space-y-3 pb-6">
          {loading ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-500">Loading closed tickets...</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-500">No closed tickets found</div>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="text-sm sm:text-base text-blue-600 font-medium">
                        Ticket ID : #{ticket.id} - {ticket.issue}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600 hidden sm:inline">:</span>
                        <span className="text-red-600 text-xs sm:text-sm">Closed</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Created: {formatDateTime(ticket.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Closed: {formatDateTime(ticket.closed_time || ticket.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="text-sm font-medium text-gray-700">
                      {ticket.customer?.name || 'Unknown'}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50 flex-1 sm:flex-initial text-xs sm:text-sm"
                        onClick={() => handleReopenTicket(ticket.id)}
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Reopen
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[90%] sm:w-full max-w-lg mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the ticket
                              with ID #{ticket.id}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}