const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://excel-trust-backend.onrender.com';

export const api = {
  uploadExcel: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return response;
  },

  processClients: async (data: any) => {
    const response = await fetch(`${API_URL}/process_clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return response;
  },

  queryAI: async (query: string, context: any) => {
    const response = await fetch(`${API_URL}/query_ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, context }),
      credentials: 'include',
    });
    return response;
  },
};
