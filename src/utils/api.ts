const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://excel-trust-backend.onrender.com';

export const api = {
  uploadExcel: (formData: FormData) => {
    return fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
  },

  queryAI: (query: string, context: any) => {
    return fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, context }),
      credentials: 'include'
    });
  }
};
