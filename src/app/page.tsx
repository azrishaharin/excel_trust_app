'use client';

import { useState, useEffect } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import PasswordDialog from '@/components/PasswordDialog';
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
    console.log('Dashboard useEffect running');
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      try {
        console.log('Found stored clients in localStorage');
        const parsedClients = JSON.parse(storedClients);
        console.log('Parsed stored clients:', parsedClients);
        setClients(parsedClients);
        console.log('Updated clients state from localStorage');

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
      } catch (err) {
        console.error('Error parsing stored clients:', err);
        setError('Failed to load stored client data');
      }
    } else {
      console.log('No stored clients found in localStorage');
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

      if (!result.data || !Array.isArray(result.data)) {
        console.error('Invalid data format:', result);
        throw new Error('Invalid data format received from server');
      }

      console.log('Raw data from server:', result.data);

      // Process the data client-side
      const processedData = result.data.map((row: any) => {
        console.log('Processing row:', row);
        return {
          ...row,
          // Add any additional processing here if needed
          Status: row.Status || 'Pending',
          'Commenced Date': row['Commenced Date'] || new Date().toISOString().split('T')[0]
        };
      });

      console.log('Final processed data:', processedData);

      if (processedData.length === 0) {
        throw new Error('No data was processed from the Excel file');
      }

      // Store processed data in localStorage
      localStorage.setItem('clients', JSON.stringify(processedData));
      console.log('Data stored in localStorage');
      
      // Update state
      setClients(processedData);
      console.log('State updated with data');
      
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
    <div className="flex-grow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Client Data</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : clients && clients.length > 0 ? (
            <div>
              <p className="mb-2">Total Clients: {clients.length}</p>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      {Object.keys(clients[0]).map((header) => (
                        <th key={header} className="px-4 py-2 text-left">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        {Object.values(client).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="border px-4 py-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No client data available. Please upload an Excel file.</p>
              <p className="text-sm text-gray-400 mt-2">
                {clients === null ? 'Loading...' : 'Upload a file to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="mb-8">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Excel files only</p>
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
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onSubmit={handlePasswordSubmit}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setCurrentFile(null);
          setError(null);
        }}
      />
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
  );
}
