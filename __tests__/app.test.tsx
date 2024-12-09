import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import ClientsPage from '@/app/clients/page';
import ClientDetail from '@/app/client/[id]/page';
import { mockClients } from '../__mocks__/mockData';

// Mock the AIAssistant context
jest.mock('@/context/AIAssistantContext', () => ({
  useAIAssistant: () => ({
    updatePageContext: jest.fn(),
  }),
}));

describe('Excel Trust App End-to-End Test', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should handle the complete flow of uploading and managing client data', async () => {
    const user = userEvent.setup();

    // 1. Render Home page
    const { rerender } = render(<Home />);
    
    // Mock file upload
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);

    // Mock API response for password requirement
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        status: 401,
        json: () => Promise.resolve({ requiresPassword: true, error: 'Password required' }),
      })
    );

    // Wait for password dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Enter password
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'testpassword');
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Mock successful API response with client data
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockClients }),
      })
    );

    // Verify data is populated in localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('clients', JSON.stringify(mockClients));
    });

    // 2. Navigate to Clients page
    const localStorageGetItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    const localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    localStorageGetItemSpy.mockImplementation((key: string) => {
      if (key === 'clients') {
        return JSON.stringify(mockClients);
      }
      return null;
    });
    localStorageSetItemSpy.mockImplementation(() => {});

    render(<ClientsPage />);

    // Verify client table is populated
    await waitFor(() => {
      expect(screen.getByText(mockClients[0]['Cert Number'].toString())).toBeInTheDocument();
      expect(screen.getByText(mockClients[0]['Plan Name'])).toBeInTheDocument();
    });

    // 3. Click first row and navigate to client details
    const firstRow = screen.getByText(mockClients[0]['Cert Number'].toString()).closest('tr');
    fireEvent.click(firstRow!);

    // Render client details page
    render(<ClientDetail params={{ id: mockClients[0]['Cert Number'].toString() }} />);

    // Verify client details are displayed
    await waitFor(() => {
      expect(screen.getByText(mockClients[0]['Participant Name'])).toBeInTheDocument();
      expect(screen.getByText(mockClients[0]['Plan Name'])).toBeInTheDocument();
    });

    // 4. Navigate back to home and delete all data
    rerender(<Home />);
    const deleteButton = screen.getByRole('button', { name: /remove all data/i });
    fireEvent.click(deleteButton);

    // Verify data is cleared
    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('clients');
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });
  });
});
