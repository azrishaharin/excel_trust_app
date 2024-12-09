'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { Client } from '@/types/client';
import { calculateAge, getAgeGroup, getMonthName, parseAmount } from '@/utils/clientUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface DashboardProps {
  clients: Client[];
}

// Add type definition for chart data
interface ChartDataItem {
  name: string;
  value: number;
}

interface DashboardData {
  planChartData: ChartDataItem[];
  statusChartData: ChartDataItem[];
  paymentChartData: ChartDataItem[];
  ageChartData: ChartDataItem[];
  signupChartData: { name: string; signups: number }[];
  financialMetrics: {
    totalContributions: number;
    activeClients: number;
    totalInstallments: number;
    count: number;
  };
}

export default function Dashboard({ clients }: DashboardProps) {
  const cleanPlanName = (name: string) => {
    return name.replace(/PruBSN\s*/g, '').trim();
  };

  const dashboardData = useMemo(() => {
    // Plan distribution data
    const planDistribution = clients.reduce((acc: any, client) => {
      const plan = client['Plan Name'] || 'Unknown';
      const cleanedPlan = cleanPlanName(plan);
      acc[cleanedPlan] = (acc[cleanedPlan] || 0) + 1;
      return acc;
    }, {});

    // Status distribution data
    const statusDistribution = clients.reduce((acc: any, client) => {
      const status = client['Status'] || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Payment method distribution
    const paymentMethodDistribution = clients.reduce((acc: any, client) => {
      const method = client['Payment Method'] || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    // Age distribution data
    const ageDistribution = clients.reduce((acc: any, client) => {
      const age = calculateAge(client['New IC']);
      if (age !== null) {
        const ageGroup = getAgeGroup(age);
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      }
      return acc;
    }, {});

    // Monthly signups data for current year
    const currentYear = new Date().getFullYear();
    const monthlySignups = Array(12).fill(0);
    
    clients.forEach(client => {
      const commencedDate = client['Commenced Date'];
      if (commencedDate) {
        const date = new Date(commencedDate);
        if (date.getFullYear() === currentYear) {
          monthlySignups[date.getMonth()]++;
        }
      }
    });

    const signupChartData = monthlySignups.map((count, index) => ({
      name: getMonthName(index),
      signups: count
    }));

    // Calculate financial metrics
    const financialMetrics = clients.reduce(
      (acc: any, client) => {
        const contribution = parseAmount(client['Outst Cont']);
        const installment = parseAmount(client['Cont Installment']);
        
        acc.totalContributions += contribution;
        acc.activeClients = clients.filter(c => c.Status?.toLowerCase() === 'in force').length;
        acc.totalInstallments += installment;
        acc.count += 1;
        
        return acc;
      },
      { totalContributions: 0, activeClients: 0, totalInstallments: 0, count: 0 }
    );

    return {
      planChartData: Object.entries(planDistribution).map(([name, value]) => ({ name, value })),
      statusChartData: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
      paymentChartData: Object.entries(paymentMethodDistribution).map(([name, value]) => ({ name, value })),
      ageChartData: Object.entries(ageDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const getNumericValue = (str: string) => {
            if (str === '< 20') return 0;
            if (str === '60+') return 60;
            return parseInt(str.split('-')[0]);
          };
          return getNumericValue(a.name) - getNumericValue(b.name);
        }),
      signupChartData,
      financialMetrics
    } as DashboardData;
  }, [clients]);

  const [chartComments, setChartComments] = useState<{ [key: string]: string }>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedSavedComments, setHasLoadedSavedComments] = useState(false);

  // Load saved comments when component mounts
  useEffect(() => {
    const savedComments = localStorage.getItem('chartComments');
    const savedDataHash = localStorage.getItem('chartDataHash');
    const currentDataHash = JSON.stringify(dashboardData);
    
    if (savedComments && savedDataHash === currentDataHash) {
      setChartComments(JSON.parse(savedComments));
    }
    setHasLoadedSavedComments(true);
  }, [dashboardData]);

  const generateChartComments = async () => {
    if (!hasLoadedSavedComments) {
      return; // Wait until we've checked for saved comments
    }

    // Check if we already have comments for the current data
    const currentDataHash = JSON.stringify(dashboardData);
    const savedDataHash = localStorage.getItem('chartDataHash');
    const savedComments = localStorage.getItem('chartComments');
    
    // If data hasn't changed and we have comments, don't regenerate
    if (currentDataHash === savedDataHash && savedComments) {
      const parsedComments = JSON.parse(savedComments);
      if (Object.keys(parsedComments).length > 0) {
        setChartComments(parsedComments);
        return;
      }
    }

    setIsLoadingComments(true);
    try {
      const comments: { [key: string]: string } = {};
      
      // Prepare data for each chart
      const chartData = {
        plan: {
          type: 'Plan Distribution',
          data: dashboardData.planChartData,
          metrics: {
            totalClients: dashboardData.planChartData.reduce((sum, item) => sum + item.value, 0),
            topPlan: [...dashboardData.planChartData].sort((a, b) => b.value - a.value)[0]
          }
        },
        status: {
          type: 'Status Distribution',
          data: dashboardData.statusChartData,
          metrics: {
            inForceClients: dashboardData.statusChartData.find(item => item.name === 'In Force')?.value || 0,
            totalClients: dashboardData.statusChartData.reduce((sum, item) => sum + item.value, 0)
          }
        },
        payment: {
          type: 'Payment Method Distribution',
          data: dashboardData.paymentChartData,
          metrics: {
            totalClients: dashboardData.paymentChartData.reduce((sum, item) => sum + item.value, 0),
            methods: dashboardData.paymentChartData
          }
        },
        age: {
          type: 'Age Distribution',
          data: dashboardData.ageChartData,
          metrics: {
            totalClients: dashboardData.ageChartData.reduce((sum, item) => sum + item.value, 0),
            dominantGroup: [...dashboardData.ageChartData].sort((a, b) => b.value - a.value)[0]
          }
        },
        signups: {
          type: 'Monthly Signups',
          data: dashboardData.signupChartData.slice(-3),
          metrics: {
            trend: dashboardData.signupChartData.slice(-3)[2].signups > dashboardData.signupChartData.slice(-3)[0].signups ? 'increasing' : 'decreasing'
          }
        }
      };

      // Generate comment for each chart using OpenAI
      for (const [chartType, chartInfo] of Object.entries(chartData)) {
        const response = await fetch('/api/generate-chart-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chartType: chartInfo.type,
            data: chartInfo.data,
            metrics: chartInfo.metrics
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate comment for ${chartType} chart`);
        }

        const result = await response.json();
        comments[chartType] = result.comment;
      }

      // Save comments and data hash to localStorage
      localStorage.setItem('chartComments', JSON.stringify(comments));
      localStorage.setItem('chartDataHash', currentDataHash);
      
      setChartComments(comments);
    } catch (error) {
      console.error('Error generating chart comments:', error);
      // Check if we have saved comments to fall back to
      const savedComments = localStorage.getItem('chartComments');
      if (savedComments) {
        setChartComments(JSON.parse(savedComments));
      } else {
        // If no saved comments, use static fallback
        const fallbackComments = {
          plan: 'Analysis of plan distribution.',
          status: 'Overview of client status distribution.',
          payment: 'Summary of payment method preferences.',
          age: 'Analysis of client age demographics.',
          signups: 'Monthly signup trend analysis.'
        };
        setChartComments(fallbackComments);
        localStorage.setItem('chartComments', JSON.stringify(fallbackComments));
        localStorage.setItem('chartDataHash', currentDataHash);
      }
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Clear comments when data is removed
  useEffect(() => {
    if (!clients || clients.length === 0) {
      localStorage.removeItem('chartComments');
      localStorage.removeItem('chartDataHash');
      setChartComments({});
    }
  }, [clients]);

  useEffect(() => {
    if (hasLoadedSavedComments) {
      generateChartComments();
    }
  }, [dashboardData, hasLoadedSavedComments]);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Monthly Signups Chart */}
      <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Monthly Signups</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData.signupChartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Line
                type="monotone"
                dataKey="signups"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgb(var(--background))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                }}
                labelStyle={{ color: 'rgb(var(--foreground))', fontWeight: 500 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          {isLoadingComments ? (
            <div className="animate-pulse h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-gray-400">{chartComments.signups}</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white">Total Outstanding</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            RM {dashboardData.financialMetrics.totalContributions.toLocaleString('en-MY', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white">Active Clients</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            {dashboardData.financialMetrics.activeClients}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white">Average Contribution</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            RM {(dashboardData.financialMetrics.totalInstallments / dashboardData.financialMetrics.count || 0).toLocaleString('en-MY', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Plan Distribution Chart */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Plan Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.planChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.planChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgb(var(--background))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '0.375rem'
                  }}
                  labelStyle={{ color: 'rgb(var(--foreground))', fontWeight: 500 }}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-sm dark:text-gray-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            {isLoadingComments ? (
              <div className="animate-pulse h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-gray-400">{chartComments.plan}</p>
            )}
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgb(var(--background))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '0.375rem'
                  }}
                  labelStyle={{ color: 'rgb(var(--foreground))', fontWeight: 500 }}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-sm dark:text-gray-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            {isLoadingComments ? (
              <div className="animate-pulse h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-gray-400">{chartComments.status}</p>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout for charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Method Chart */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Payment Methods</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgb(var(--background))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '0.375rem'
                  }}
                  labelStyle={{ color: 'rgb(var(--foreground))', fontWeight: 500 }}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-sm dark:text-gray-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            {isLoadingComments ? (
              <div className="animate-pulse h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-gray-400">{chartComments.payment}</p>
            )}
          </div>
        </div>

        {/* Age Distribution Chart */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Age Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.ageChartData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--background))' }}
                  contentStyle={{ 
                    background: 'rgb(var(--background))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  }}
                  labelStyle={{ color: 'rgb(var(--foreground))', fontWeight: 500 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                >
                  {dashboardData.ageChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={[
                        '#2563eb', // Primary blue
                        '#3b82f6', // Different shade of blue
                        '#60a5fa', // Lighter blue
                        '#93c5fd', // Even lighter blue
                      ][index % 4]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            {isLoadingComments ? (
              <div className="animate-pulse h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-gray-400">{chartComments.age}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
