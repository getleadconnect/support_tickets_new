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
  Filter,
  CheckCircle,
  Calendar,
  User,
  Home,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import VerifyTicketModal from '@/components/VerifyTicketModal';

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
  verified_at?: string | null;
  remarks?: string | null;
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

export default function VerifyTickets() {
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
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ id: number; issue: string } | null>(null);

  useEffect(() => {
    fetchVerifyTickets();
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

  const fetchVerifyTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/tickets', {
        params: {
          per_page: 1000,
          status: 4, // Filter for verify/resolved status on backend
          customer_id: filters.customerId !== 'all' ? filters.customerId : null,
          agent_id: filters.agentId !== 'all' ? filters.agentId : null,
        },
      });

      // Filter tickets to show only those that are not yet verified (verified_at is null)
      let verifyTickets = response.data.data?.filter((ticket: Ticket) =>
        !ticket.verified_at
      ) || [];
      
      // Apply date filters if provided
      if (filters.startDate) {
        verifyTickets = verifyTickets.filter((ticket: Ticket) => {
          const ticketDate = new Date(ticket.updated_at);
          const startDate = new Date(filters.startDate);
          return ticketDate >= startDate;
        });
      }
      
      if (filters.endDate) {
        verifyTickets = verifyTickets.filter((ticket: Ticket) => {
          const ticketDate = new Date(ticket.updated_at);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          return ticketDate <= endDate;
        });
      }
      
      setTickets(verifyTickets);
    } catch (error) {
      console.error('Error fetching verify tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchVerifyTickets();
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
    
    // Fetch all verify tickets without filters
    setLoading(true);
    try {
      const response = await axios.get('/tickets', {
        params: {
          per_page: 1000,
          status: 4, // Filter for verify/resolved status on backend
        },
      });

      // Filter tickets to show only those that are not yet verified (verified_at is null)
      const verifyTickets = response.data.data?.filter((ticket: Ticket) => 
        !ticket.verified_at
      ) || [];
      
      setTickets(verifyTickets);
    } catch (error) {
      console.error('Error fetching verify tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (ticket: Ticket) => {
    setSelectedTicket({ id: ticket.id, issue: ticket.issue });
    setVerifyModalOpen(true);
  };

  const handleVerificationSuccess = () => {
    fetchVerifyTickets();
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
              <h1 className="text-xl sm:text-2xl font-semibold">Verify Tickets</h1>
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
                  style={{ width: '100px' }}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={handleClear}
                  style={{ width: '100px' }}
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
              <div className="text-gray-500">Loading tickets to verify...</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-500">No tickets pending verification found</div>
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
                        <span className="text-yellow-600 text-xs sm:text-sm">Pending Verification</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Created: {formatDateTime(ticket.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Resolved: {formatDateTime(ticket.updated_at)}</span>
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
                        className="text-green-600 border-green-600 hover:bg-green-50 flex-1 sm:flex-initial text-xs sm:text-sm"
                        onClick={() => handleVerifyClick(ticket)}
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verify Ticket Modal */}
      {selectedTicket && (
        <VerifyTicketModal
          open={verifyModalOpen}
          onOpenChange={setVerifyModalOpen}
          ticketId={selectedTicket.id}
          ticketIssue={selectedTicket.issue}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </DashboardLayout>
  );
}