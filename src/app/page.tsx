'use client';

import { useState, useEffect } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import PasswordDialog from '@/components/PasswordDialog';
import Dashboard from '@/components/Dashboard';
import { useRouter } from 'next/navigation';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { api } from '@/utils/api';

export default function Home() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updatePageContext } = useAIAssistant();

  // Load clients from localStorage on initial render
  useEffect(() => {
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      const parsedClients = JSON.parse(storedClients);
      setClients(parsedClients);

      // Update AI Assistant context
      const activeClients = parsedClients.filter((client: any) => 
        client.Status?.toLowerCase() === 'in force'
      ).length;

      const currentMonth = new Date().getMonth();
      const monthlySignups = parsedClients.filter((client: any) => {
        const commencedDate = new Date(client['Commenced Date']);
        return commencedDate.getMonth() === currentMonth;
      }).length;

      updatePageContext({
        pageName: 'dashboard',
        data: {
          totalClients: parsedClients.length,
          activeClients,
          monthlySignups,
          recentActivity: parsedClients.slice(0, 5) // Last 5 clients
        }
      });
    }
  }, [updatePageContext]);

  const processExcelFile = async (file: File, password?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (password) {
        console.log('Sending password:', password ? 'Yes' : 'No');
        formData.append('password', password);
      }

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', typeof value === 'string' ? value : 'File');
      }

      const response = await api.uploadExcel(formData);
      console.log('Upload response status:', response.status);
      const result = await response.json();
      console.log('Upload response:', result);

      if (response.status === 401 && result.requiresPassword) {
        setIsPasswordDialogOpen(true);
        setError(result.error);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process Excel file');
      }

      // Successfully got the data, close the password dialog
      setIsPasswordDialogOpen(false);
      setError(null);

      if (!result.data || !result.headers) {
        throw new Error('Invalid response format from server');
      }

      // Process the data client-side
      const processedData = result.data.map((row: any) => ({
        ...row,
        // Add any additional processing here if needed
        // For example:
        Status: row.Status || 'Pending',
        'Commenced Date': row['Commenced Date'] || new Date().toISOString().split('T')[0]
      }));

      console.log('Processed data:', processedData);

      // Store processed data in localStorage
      localStorage.setItem('clients', JSON.stringify(processedData));
      setClients(processedData);
      setCurrentFile(null);

    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentFile(file);
    await processExcelFile(file);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (currentFile) {
      await processExcelFile(currentFile, password);
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('clients');
    setClients([]);
    setError(null);
  };

  const handleRowClick = (certificateNo: string) => {
    if (!certificateNo) return;
    router.push(`/client/${encodeURIComponent(certificateNo)}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        {clients.length > 0 && (
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-150 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Remove All Data
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* File Upload Section - Only show if no clients are loaded */}
      {clients.length === 0 && (
        <div className="mb-8">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-4" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Excel files only</p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </label>
        </div>
      )}

      {/* Password Dialog */}
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onSubmit={handlePasswordSubmit}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setCurrentFile(null);
          setError(null);
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Dashboard */}
      {clients.length > 0 && <Dashboard clients={clients} />}
    </div>
  );
}
