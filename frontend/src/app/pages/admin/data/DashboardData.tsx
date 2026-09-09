import { useState, useEffect } from 'react';
import apiClient from '../../../api/client';


export interface DashboardData {
  university: string;
  department: string;
  classroom_name: string | null;
  mentor_name: string | null;
  user_role: string;
  
  overall: {
    avg_score: number;      // Average of Topic Exams
    ready_score: number;    // Average of Full Mocks
    total_exams: number;    // Count of all sessions
  };

  metrics: {
    peer_count: number;
    total_questions: number;
    coverage_percent: number;
    study_time_minutes: number;
  };

  by_competency: Array<{
    competency_area__name: string;
    average_score: number;
    national_avg: number;
    status: string;
  }>;

  history: Array<{
    id: number;
    end_time: string;
    score: number;
    competency_area__name: string | null; 
    correct_answers: number;
    total_questions: number;
    is_mock: boolean; // Used to show a different badge/color
  }>;
}




// import { useState, useEffect } from 'react';
// import apiClient from '../../../api/client';

// export interface DashboardData {
//   university: string;
//   department: string;
//   classroom_name: string | null;
//   mentor_name: string | null;
//   metrics: {
//     avg_score: number;
//     total_exams: number;
//     peer_count: number;
//     total_questions: number;
//     coverage_percent: number;
//     study_time_minutes: number;
//   };
//   by_competency: Array<{
//     competency_area__name: string;
//     average_score: number;
//     national_avg: number;
//   }>;

//   overall: {
//     avg_score: number | null;
//     total_exams: number;
//     student_count: number; 
//     total_department_students: number; 
//     voucher_balance: number;
//   };
//   student_count: number;
//   total_question_count: number;
 
//   history: Array<{
//     id: number;
//     end_time: string;
//     score: number;
//     competency_area__name: string;
//   }>;
//   progress_data: Array<{ exam: string; score: number; date: string, national_avg: number, status: string }>;

//   };


export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/dashboard/');
      setData(response.data);
      console.log("Dashboard data refreshed:", response.data);
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

  return { data, loading, error, refreshData, setData, setError };
}