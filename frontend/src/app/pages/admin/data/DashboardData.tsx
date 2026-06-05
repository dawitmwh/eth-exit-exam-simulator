import { useState, useEffect } from 'react';
import apiClient from '../../../api/client';

export interface DashboardData {
  university: string;
  department: string;
  overall: {
    avg_score: number | null;
    total_exams: number;
    student_count?: number; // required for the Deans
  };
  student_count: number;
  by_competency: Array<{
    competency_area__name: string;
    average_score: number;
  }>;
  history: Array<{
    id: number;
    end_time: string;
    score: number;
    competency_area__name: string;
  }>;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/dashboard/');
      setData(response.data);
    } catch (err) {
      setError("Failed to sync dashboard data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return { data, loading, error, refreshData };
}