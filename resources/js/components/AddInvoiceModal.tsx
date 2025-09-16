import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number;
  customerId: number;
  customerName: string;
}

export function AddInvoiceModal({ 
  isOpen, 
  onClose, 
  ticketId, 
  customerId,
  customerName 
}: AddInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [serviceCharge, setServiceCharge] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [productTotal, setProductTotal] = useState<number>(0);
  const [products, setProducts] = useState<any[]>([]);
  const [checkingInvoice, setCheckingInvoice] = useState(true);
  const [invoiceExists, setInvoiceExists] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState<any>(null);

  const handleClose = () => {
    // Reset states when closing
    setServiceCharge('');
    setPaymentMode('');
    setInvoiceExists(false);
    setExistingInvoice(null);
    setCheckingInvoice(true);
    onClose();
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      checkExistingInvoice();
    }
  }, [isOpen, ticketId]);

  const checkExistingInvoice = async () => {
    setCheckingInvoice(true);
    try {
      const response = await axios.get(`/invoices/check-ticket/${ticketId}`);
      if (response.data.exists) {
        setInvoiceExists(true);
        setExistingInvoice(response.data.invoice);
      } else {
        setInvoiceExists(false);
        fetchTicketProducts();
      }
    } catch (error) {
      console.error('Error checking existing invoice:', error);
      setInvoiceExists(false);
      fetchTicketProducts();
    } finally {
      setCheckingInvoice(false);
    }
  };

  const fetchTicketProducts = async () => {
    try {
      const response = await axios.get(`/tickets/${ticketId}/spare-parts`);
      const productsData = response.data || [];
      setProducts(productsData);
      
      // Calculate total from products using total_price column
      const total = productsData.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.total_price) || 0);
      }, 0);
      setProductTotal(total);
    } catch (error) {
      console.error('Error fetching ticket products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    if (!serviceCharge || parseFloat(serviceCharge) < 0) {
      toast.error('Please enter a valid service charge');
      return;
    }

    setLoading(true);
    
    try {
      const invoiceData = {
        ticket_id: ticketId,
        customer_id: customerId,
        item_cost: productTotal,
        service_charge: parseFloat(serviceCharge) || 0,
        total_amount: productTotal + (parseFloat(serviceCharge) || 0),
        payment_mode: paymentMode,
        payment_status: 'Pending',
        invoice_date: new Date().toISOString().split('T')[0],
        products: products.map(p => ({
          product_id: p.product_id,
          quantity: p.quantity,
          price: p.price,
          total: p.total_price
        }))
      };

      const response = await axios.post('/invoices', invoiceData);
      
      if (response.data) {
        toast.success('Invoice created successfully');
        handleClose();
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = productTotal + (parseFloat(serviceCharge) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Invoice</DialogTitle>
        </DialogHeader>
        
        {checkingInvoice ? (
          <div className="text-center py-8">
            <p>Checking for existing invoice...</p>
          </div>
        ) : invoiceExists ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-semibold">Invoice Already Exists</p>
              <p className="text-yellow-700 text-sm mt-2">
                An invoice has already been created for this ticket.
              </p>
              {existingInvoice && (
                <div className="mt-3 text-sm text-yellow-700">
                  <p><strong>Invoice ID:</strong> {existingInvoice.invoice_id}</p>
                  <p><strong>Date:</strong> {new Date(existingInvoice.invoice_date).toLocaleDateString()}</p>
                  <p><strong>Total:</strong> ₹{existingInvoice.total_amount}</p>
                  <p><strong>Status:</strong> {existingInvoice.status}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {products.length > 0 && (
            <div className="space-y-2">
              <Label>Products Used</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                {products.map((product, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>{product.product?.name || 'Unknown Product'} x {product.quantity}</span>
                    <span>₹{product.total_price}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                  <span>Products Total:</span>
                  <span>₹{productTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="serviceCharge">Service Charge</Label>
            <Input
              id="serviceCharge"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter service charge"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span>Item Cost:</span>
              <span>₹{productTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Service Charge:</span>
              <span>₹{(parseFloat(serviceCharge) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}