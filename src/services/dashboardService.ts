export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
}

const BASE_URL = 'http://192.168.0.248:8080/api/v1';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const url = `${BASE_URL}/dashboard/summary`;
  
  console.log('Fetching dashboard summary from API:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
