'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useAIAssistant } from '@/context/AIAssistantContext';
import { Client } from '@/types/client';

export default function ClientDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const { updatePageContext } = useAIAssistant();

  useEffect(() => {
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      const clients = JSON.parse(storedClients);
      const foundClient = clients.find((c: Client) => c['Cert Number'].toString() === params.id);
      if (foundClient) {
        setClient(foundClient);

        // Update AI Assistant context
        updatePageContext({
          pageName: 'client-details',
          data: {
            client: foundClient,
            paymentHistory: {
              totalPaid: foundClient['Paid Contribution Count'],
              outstandingAmount: foundClient['Outst Cont'],
              status: foundClient['Status']
            },
            planDetails: {
              name: foundClient['Plan Name'],
              commencedDate: foundClient['Commenced Date'],
              noLapseProvision: foundClient['No Lapse Provision']
            }
          }
        });
      }
    }
  }, [params.id, updatePageContext]);

  if (!client) {
    return (
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
        </div>
        <div className="card p-8 text-center bg-white dark:bg-gray-800">
          <p className="text-slate-600 dark:text-slate-400">Loading client details...</p>
        </div>
      </div>
    );
  }

  const clientDetails = [
    { label: 'Certificate Number', value: client['Cert Number'] },
    { label: 'Plan Name', value: client['Plan Name'] },
    { label: 'Participant Name', value: client['Participant Name'] },
    { label: 'New IC', value: client['New IC'] },
    { label: 'Commenced Date', value: client['Commenced Date'] },
    { label: 'Contribution Installment', value: client['Cont Installment'] },
    { label: 'Payment Method', value: client['Payment Method'] },
    { label: 'NCDD', value: client['NCDD'] },
    { label: 'Outstanding Contribution', value: client['Outst Cont'] },
    { label: 'Paid Contribution Count', value: client['Paid Contribution Count'] },
    { label: 'Total Tabarru Debt', value: client['Total Tabarru Debt'] },
    { label: 'No Lapse Provision', value: client['No Lapse Provision'] },
    { label: 'Status', value: client['Status'] },
    { label: 'Discontinue Date', value: client['Discontinue Date'] || '-' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Client Details</h1>
        </div>
        {/* <div className="flex space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900">Edit</button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900">Download</button>
        </div> */}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {clientDetails.map((detail, index) => (
            <div key={index} className="space-y-1">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{detail.label}</dt>
              <dd className="text-base text-slate-900 dark:text-white">{detail.value || 'N/A'}</dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
