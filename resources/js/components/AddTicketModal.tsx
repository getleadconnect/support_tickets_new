import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { AddCustomerModal } from './AddCustomerModal';

interface Customer {
  id: number;
  name: string;
  email?: string;
}

interface TicketStatus {
  id: number;
  status: string;
  color_code?: string;
}

interface Priority {
  id: number;
  title: string;
  color?: string;
}

interface AdditionalField {
  id: number;
  title: string;
  name: string;
  type: string;
  selection?: string | null;
  mandatory: number;
  show_filter: number;
  show_list: number;
  value: Array<{id: number; value: string}> | null;
}

interface User {
  id: number;
  name: string;
  email?: string;
}

interface AddTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
  customerName?: string;
  onTicketCreated?: () => void;
}

export function AddTicketModal({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName,
  onTicketCreated 
}: AddTicketModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [ticketStatuses, setTicketStatuses] = useState<TicketStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  const [additionalFields, setAdditionalFields] = useState<AdditionalField[]>([]);
  const [additionalFieldValues, setAdditionalFieldValues] = useState<{[key: number]: string}>({});
  const [branches, setBranches] = useState<Array<{id: number; branch_name: string}>>([]);
  const [ticketLabels, setTicketLabels] = useState<Array<{id: number; label_name: string; color?: string}>>([]);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const labelsDropdownRef = useRef<HTMLDivElement>(null);
  const [agentUsers, setAgentUsers] = useState<User[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [selectedNotifyUsers, setSelectedNotifyUsers] = useState<number[]>([]);
  const [showAgentsDropdown, setShowAgentsDropdown] = useState(false);
  const [showNotifyDropdown, setShowNotifyDropdown] = useState(false);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);
  const notifyDropdownRef = useRef<HTMLDivElement>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: customerId || undefined,
    issue: '',
    description: '',
    status: 1, // Default to first status
    priority: 1, // Default to 'Low'
    due_date: '',
    branch_id: '',
    closed_time: '',
  });

  useEffect(() => {
    if (open) {
      if (!customerId) {
        fetchCustomers();
      }
      fetchTicketStatuses();
      fetchPriorities();
      fetchAdditionalFields();
      fetchBranches();
      fetchTicketLabels();
      fetchAgentUsers();
    }
  }, [open, customerId]);

  useEffect(() => {
    if (customerId) {
      setFormData(prev => ({ ...prev, customer_id: customerId }));
    }
  }, [customerId]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labelsDropdownRef.current && !labelsDropdownRef.current.contains(event.target as Node)) {
        setShowLabelsDropdown(false);
      }
      if (agentsDropdownRef.current && !agentsDropdownRef.current.contains(event.target as Node)) {
        setShowAgentsDropdown(false);
      }
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target as Node)) {
        setShowNotifyDropdown(false);
      }
    };

    if (showLabelsDropdown || showAgentsDropdown || showNotifyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLabelsDropdown, showAgentsDropdown, showNotifyDropdown]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchTicketStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const response = await axios.get('/ticket-statuses');
      const statuses = response.data || [];
      setTicketStatuses(statuses);
      // Set default status to first status if available
      if (statuses.length > 0 && !formData.status) {
        setFormData(prev => ({ ...prev, status: statuses[0].id }));
      }
    } catch (error) {
      console.error('Error fetching ticket statuses:', error);
      toast.error('Failed to load ticket statuses');
    } finally {
      setLoadingStatuses(false);
    }
  };

  const fetchPriorities = async () => {
    setLoadingPriorities(true);
    try {
      const response = await axios.get('/priorities');
      const prioritiesData = response.data || [];
      setPriorities(prioritiesData);
      // Set default priority to first priority if available
      if (prioritiesData.length > 0 && !formData.priority) {
        setFormData(prev => ({ ...prev, priority: prioritiesData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
      toast.error('Failed to load priorities');
    } finally {
      setLoadingPriorities(false);
    }
  };

  const fetchAdditionalFields = async () => {
    try {
      const response = await axios.get('/additional-fields');
      console.log('Additional fields fetched:', response.data);
      setAdditionalFields(response.data || []);
    } catch (error) {
      console.error('Error fetching additional fields:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('/branches');
      setBranches(response.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTicketLabels = async () => {
    try {
      const response = await axios.get('/ticket-labels-management');
      setTicketLabels(response.data || []);
    } catch (error) {
      console.error('Error fetching ticket labels:', error);
    }
  };

  const fetchAgentUsers = async () => {
    try {
      const response = await axios.get('/agent-users');
      setAgentUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching agent users:', error);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdditionalFieldChange = (fieldId: number, value: string) => {
    setAdditionalFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleLabelChange = (labelId: number) => {
    setSelectedLabels(prev => {
      if (prev.includes(labelId)) {
        return prev.filter(id => id !== labelId);
      } else {
        return [...prev, labelId];
      }
    });
  };

  const handleAgentChange = (agentId: number) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleNotifyUserChange = (userId: number) => {
    setSelectedNotifyUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    // Add the new customer to the customers list
    setCustomers(prev => [...prev, newCustomer]);
    // Select the new customer
    setFormData(prev => ({ ...prev, customer_id: newCustomer.id }));
    // Close the add customer modal
    setShowAddCustomerModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.issue) {
      toast.error('Please enter an issue title');
      return;
    }

    setLoading(true);
    try {
      // Prepare ticket data with assigned users and notify users
      const ticketData = {
        ...formData,
        assigned_users: selectedAgents,
        notify_users: selectedNotifyUsers
      };
      
      const response = await axios.post('/tickets', ticketData);
      const ticketId = response.data.id;
      
      // Save additional field values if any
      if (Object.keys(additionalFieldValues).length > 0) {
        for (const [fieldId, value] of Object.entries(additionalFieldValues)) {
          if (value) {
            try {
              await axios.post(`/tickets/${ticketId}/additional-fields`, {
                additional_field_id: parseInt(fieldId),
                user_input: value
              });
            } catch (fieldError) {
              console.error(`Error saving additional field ${fieldId}:`, fieldError);
            }
          }
        }
      }
      
      // Save selected labels to label_ticket table
      if (selectedLabels.length > 0) {
        for (const labelId of selectedLabels) {
          try {
            await axios.post(`/tickets/${ticketId}/labels`, {
              label_id: labelId
            });
          } catch (labelError) {
            console.error(`Error saving label ${labelId}:`, labelError);
          }
        }
      }
      
      toast.success('Ticket created successfully');
      
      // Reset form
      setFormData({
        customer_id: customerId || undefined,
        issue: '',
        description: '',
        status: 1,
        priority: 1,
        due_date: '',
        branch_id: '',
        closed_time: '',
      });
      setAdditionalFieldValues({});
      setSelectedLabels([]);
      setSelectedAgents([]);
      setSelectedNotifyUsers([]);
      
      onOpenChange(false);
      if (onTicketCreated) {
        onTicketCreated();
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setFormData({
      customer_id: customerId || undefined,
      issue: '',
      description: '',
      status: 1,
      priority: 1,
      due_date: '',
      branch_id: '',
      closed_time: '',
    });
    setAdditionalFieldValues({});
    setSelectedLabels([]);
    setSelectedAgents([]);
    setSelectedNotifyUsers([]);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Ticket</DialogTitle>
          <DialogDescription>
            Create a new support ticket
          </DialogDescription>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar" 
          style={{ 
            maxHeight: 'calc(85vh - 180px)',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#888 #f1f1f1'
          }}
        >
          <div className="grid gap-4">
          {/* Customer Selection */}
          <div className="grid gap-2">
            <Label htmlFor="customer">Customer</Label>
            <div className="flex gap-2">
              {customerId ? (
                <Input
                  id="customer"
                  value={customerName || 'Selected Customer'}
                  disabled
                  className="bg-gray-50 flex-1"
                />
              ) : (
                <>
                  <Select
                    value={formData.customer_id?.toString() || ''}
                    onValueChange={(value) => handleFormChange('customer_id', parseInt(value))}
                  >
                    <SelectTrigger id="customer" className="flex-1">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCustomers ? (
                        <SelectItem value="loading" disabled>
                          Loading customers...
                        </SelectItem>
                      ) : customers.length === 0 ? (
                        <SelectItem value="no-customers" disabled>
                          No customers found
                        </SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="px-3"
                    title="Add new customer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Issue Title */}
          <div className="grid gap-2">
            <Label htmlFor="issue">Issue</Label>
            <Input
              id="issue"
              value={formData.issue}
              onChange={(e) => handleFormChange('issue', e.target.value)}
              placeholder="Enter issue title"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Describe the issue in detail"
              rows={4}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status?.toString() || ''}
                onValueChange={(value) => handleFormChange('status', parseInt(value))}
                disabled={loadingStatuses}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={loadingStatuses ? "Loading..." : "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingStatuses ? (
                    <SelectItem value="loading" disabled>
                      Loading statuses...
                    </SelectItem>
                  ) : ticketStatuses.length === 0 ? (
                    <SelectItem value="no-statuses" disabled>
                      No statuses available
                    </SelectItem>
                  ) : (
                    ticketStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        <div className="flex items-center gap-2">
                          {status.color_code && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: status.color_code }}
                            />
                          )}
                          {status.status}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority?.toString() || ''}
                onValueChange={(value) => handleFormChange('priority', parseInt(value))}
                disabled={loadingPriorities}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder={loadingPriorities ? "Loading..." : "Select priority"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingPriorities ? (
                    <SelectItem value="loading" disabled>
                      Loading priorities...
                    </SelectItem>
                  ) : priorities.length === 0 ? (
                    <SelectItem value="no-priorities" disabled>
                      No priorities available
                    </SelectItem>
                  ) : (
                    priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id.toString()}>
                        <div className="flex items-center gap-2">
                          {priority.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: priority.color }}
                            />
                          )}
                          {priority.title}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Closed Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleFormChange('due_date', e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="closed_time">Time</Label>
              <Input
                id="closed_time"
                type="time"
                value={formData.closed_time}
                onChange={(e) => handleFormChange('closed_time', e.target.value)}
              />
            </div>
          </div>

          {/* Assigned To and Notify To Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assigned To Multi-select Dropdown */}
            <div className="grid gap-2">
              <Label htmlFor="assigned-to">Assigned To</Label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[38px]"
                  onClick={() => setShowAgentsDropdown(!showAgentsDropdown)}
                >
                  <div className="flex-1 text-left">
                    {selectedAgents.length === 0 ? (
                      <span className="text-gray-500">Select agents...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedAgents.map(agentId => {
                          const agent = agentUsers.find(u => u.id === agentId);
                          return agent ? (
                            <span key={agentId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100">
                              {agent.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <svg className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showAgentsDropdown && (
                  <div ref={agentsDropdownRef} className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                    <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                      {agentUsers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No agents available</div>
                      ) : (
                        <div className="py-1">
                          {agentUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleAgentChange(user.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedAgents.includes(user.id)}
                                onChange={() => {}}
                                className="mr-2 rounded border-gray-300"
                              />
                              <span className="text-sm">{user.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notify To Multi-select Dropdown */}
            <div className="grid gap-2">
              <Label htmlFor="notify-to">Notify To</Label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[38px]"
                  onClick={() => setShowNotifyDropdown(!showNotifyDropdown)}
                >
                  <div className="flex-1 text-left">
                    {selectedNotifyUsers.length === 0 ? (
                      <span className="text-gray-500">Select users...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedNotifyUsers.map(userId => {
                          const user = agentUsers.find(u => u.id === userId);
                          return user ? (
                            <span key={userId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100">
                              {user.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <svg className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showNotifyDropdown && (
                  <div ref={notifyDropdownRef} className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                    <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                      {agentUsers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No users available</div>
                      ) : (
                        <div className="py-1">
                          {agentUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleNotifyUserChange(user.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedNotifyUsers.includes(user.id)}
                                onChange={() => {}}
                                className="mr-2 rounded border-gray-300"
                              />
                              <span className="text-sm">{user.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Branch Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={formData.branch_id?.toString() || ''}
              onValueChange={(value) => handleFormChange('branch_id', value)}
            >
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.length === 0 ? (
                  <SelectItem value="no-branches" disabled>
                    No branches available
                  </SelectItem>
                ) : (
                  branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.branch_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Ticket Labels Multi-select Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="ticket-labels">Ticket Labels</Label>
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[38px]"
                onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
              >
                <div className="flex-1 text-left">
                  {selectedLabels.length === 0 ? (
                    <span className="text-gray-500">Select labels...</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedLabels.map(labelId => {
                        const label = ticketLabels.find(l => l.id === labelId);
                        return label ? (
                          <span key={labelId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100">
                            {label.color && (
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: label.color }}
                              />
                            )}
                            {label.label_name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <svg className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showLabelsDropdown && (
                <div ref={labelsDropdownRef} className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                  <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                    {ticketLabels.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No labels available</div>
                    ) : (
                      <div className="py-1">
                        {ticketLabels.map((label) => (
                          <div
                            key={label.id}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleLabelChange(label.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedLabels.includes(label.id)}
                              onChange={() => {}}
                              className="mr-2 rounded border-gray-300"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              {label.color && (
                                <span 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: label.color }}
                                />
                              )}
                              <span className="text-sm">{label.label_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Additional Fields - Right after Ticket Type */}
          <div className="space-y-3">
            {additionalFields.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Fields</h4>
                {additionalFields.map((field, index) => (
                <div key={field.id} className="grid gap-2" style={{ marginTop: index === 0 ? '0' : '10px' }}>
                  <Label htmlFor={`field-${field.id}`}>
                    {field.title}
                    {field.mandatory === 1 && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'select' ? (
                    <Select
                      value={additionalFieldValues[field.id] || ''}
                      onValueChange={(value) => handleAdditionalFieldChange(field.id, value)}
                    >
                      <SelectTrigger id={`field-${field.id}`}>
                        <SelectValue placeholder={`Select ${field.title}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.value && Array.isArray(field.value) && field.value.map((option) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'text' ? (
                    <Input
                      id={`field-${field.id}`}
                      type="text"
                      value={additionalFieldValues[field.id] || ''}
                      onChange={(e) => handleAdditionalFieldChange(field.id, e.target.value)}
                      placeholder={`Enter ${field.title}...`}
                    />
                  ) : field.type === 'date' ? (
                    <Input
                      id={`field-${field.id}`}
                      type="date"
                      value={additionalFieldValues[field.id] || ''}
                      onChange={(e) => handleAdditionalFieldChange(field.id, e.target.value)}
                    />
                  ) : null}
                </div>
              ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                {console.log('No additional fields configured in the system')}
                {/* No additional fields configured */}
              </div>
            )}
          </div>

          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !formData.issue || !formData.customer_id}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add Customer Modal */}
    <AddCustomerModal
      open={showAddCustomerModal}
      onOpenChange={setShowAddCustomerModal}
      onCustomerAdded={handleCustomerAdded}
    />
    </>
  );
}