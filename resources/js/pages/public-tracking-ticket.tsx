import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface History {
  id: number;
  comment: string;
  created_at: string;
  created_by: number;
}

interface Status {
  id: number;
  name: string;
  color: string;
}

interface TrackingData {
  tracking_number: string;
  issue: string;
  description: string;
  status: Status | null;
  histories: History[];
  spare_parts: string[];
}

export default function PublicTrackingTicket() {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('GL Tickets');

  // Check for tracking_id parameter in URL
  useEffect(() => {
    const trackingId = searchParams.get('tracking_id');
    if (trackingId) {
      setTrackingNumber(trackingId.toUpperCase());
      // Automatically search
      handleAutoSearch(trackingId);
    }
  }, [searchParams]);

  // Fetch company info on component mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        // Get APP_URL from meta tag (reads from .env)
        const metaTag = document.querySelector('meta[name="app-url"]');
        const appUrl = metaTag ? metaTag.getAttribute('content') : window.location.origin;
        console.log('Meta tag APP_URL:', appUrl);

        const response = await axios.get('/company');
        console.log('Company API response:', response.data);

        if (response.data.company) {
          if (response.data.company.logo) {
            // Prepend APP_URL if logo is a relative path
            const logoPath = response.data.company.logo;
            const fullLogoUrl = logoPath.startsWith('http')
              ? logoPath
              : `${appUrl}/${logoPath}`;
            console.log('Logo path from DB:', logoPath);
            console.log('Full logo URL:', fullLogoUrl);
            setCompanyLogo(fullLogoUrl);
          }
          if (response.data.company.company_name) {
            setCompanyName(response.data.company.company_name);
          }
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
      }
    };

    fetchCompanyInfo();
  }, []);

  const handleAutoSearch = async (trackingId: string) => {
    if (!trackingId.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.post('/track-ticket', {
        tracking_number: trackingId.trim()
      });

      if (response.data.success) {
        setTrackingData(response.data.data);
      } else {
        toast.error(response.data.message || 'Ticket not found');
        setTrackingData(null);
      }
    } catch (error: any) {
      console.error('Error tracking ticket:', error);
      if (error.response?.status === 404) {
        toast.error('Ticket not found with this tracking number');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to track ticket. Please try again.');
      }
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.post('/track-ticket', {
        tracking_number: trackingNumber.trim()
      });

      if (response.data.success) {
        setTrackingData(response.data.data);
        toast.success('Ticket found successfully!');
      } else {
        toast.error(response.data.message || 'Ticket not found');
        setTrackingData(null);
      }
    } catch (error: any) {
      console.error('Error tracking ticket:', error);
      if (error.response?.status === 404) {
        toast.error('Ticket not found with this tracking number');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to track ticket. Please try again.');
      }
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
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

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName || 'Company Logo'}
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  console.error('Failed to load logo:', companyLogo);
                  setCompanyLogo(''); // Clear logo to show fallback
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully:', companyLogo);
                }}
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {companyName ? companyName.charAt(0) : 'T'}
                </span>
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Ticket Status Tracking</h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5 sm:mt-1">Track your service ticket status and history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-700 sm:whitespace-nowrap">
                Track Your Ticket Status:
              </label>
              <Input
                type="text"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="w-full sm:w-auto"
                style={{ width: undefined }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </div>

        {/* Results Display */}
        {trackingData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Tracking Number */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Ticket Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Ticket Tracking Number:</span>
                  <p className="text-base sm:text-lg font-bold text-blue-600 mt-1 break-all">{trackingData.tracking_number}</p>
                </div>
                {trackingData.status && (
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Current Status:</span>
                    <div className="mt-1">
                      <span
                        className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold"
                        style={{
                          backgroundColor: trackingData.status.color,
                          color: '#ffffff'
                        }}
                      >
                        {trackingData.status.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Issues */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Issues</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Issue:</span>
                  <p className="text-sm sm:text-base text-slate-800 mt-1 break-words">{trackingData.issue}</p>
                </div>
                {trackingData.description && (
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Description:</span>
                    <p className="text-sm sm:text-base text-slate-700 mt-1 break-words">{trackingData.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Histories */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Histories</h2>
              {trackingData.histories.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {trackingData.histories.map((history, index) => (
                    <div
                      key={history.id}
                      className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 bg-slate-50 rounded-r"
                    >
                      <p className="text-sm sm:text-base text-slate-800 break-words">{history.comment}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(history.created_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs sm:text-sm">No history records found</p>
              )}
            </div>

            {/* Spare Parts */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Spare Parts</h2>
              {trackingData.spare_parts.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {trackingData.spare_parts.map((part, index) => (
                    <li key={index} className="text-sm sm:text-base text-slate-700 break-words">{part}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-xs sm:text-sm">No spare parts used</p>
              )}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!trackingData && !isLoading && hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
            <div className="text-slate-400 mb-3">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
            </div>
            <p className="text-slate-600 text-base sm:text-lg font-medium">No ticket found</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">Please check the tracking number and try again</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 mt-8 sm:mt-12">
        <div className="text-center text-slate-500 text-xs sm:text-sm">
          <p>&copy; {new Date().getFullYear()} Ticket Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
