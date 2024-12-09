import { Client } from '../types/client';

export const calculateAge = (icNumber: string | undefined): number | null => {
  if (!icNumber) return null;
  const icString = String(icNumber);
  if (icString.length < 6) return null;
  
  const yearStr = icString.slice(0, 2);
  if (!/^\d{2}$/.test(yearStr)) return null;
  
  const yearPrefix = parseInt(yearStr);
  const fullYear = yearPrefix >= 0 && yearPrefix <= 23 ? 2000 + yearPrefix : 1900 + yearPrefix;
  const currentYear = new Date().getFullYear();
  return currentYear - fullYear;
};

export const getAgeGroup = (age: number): string => {
  if (age < 20) return '< 20';
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  return '60+';
};

export const getMonthName = (month: number): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month];
};

export const parseAmount = (value: any): number => {
  if (!value) return 0;
  const cleanValue = String(value).replace(/[RM,\s]/g, '');
  const number = parseFloat(cleanValue);
  return isNaN(number) ? 0 : number;
};

export const filterClients = (clients: Client[], searchQuery: string): Client[] => {
  const searchTerm = searchQuery.toLowerCase();
  return clients.filter((client) =>
    Object.values(client).some(value => 
      String(value).toLowerCase().includes(searchTerm)
    )
  );
};
