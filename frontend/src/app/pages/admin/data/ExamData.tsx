import apiClient from '../../../api/client';
import { useState, useEffect} from 'react';



// 1. Define the real interface from Django
export interface Competency {
  id: number;
  name: string;
  department_name: string;
  duration_minutes: number;
  question_count: number;
}


export function ExamData() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
     try {
        const response = await apiClient.get('/competency-areas/');
        setCompetencies(response.data);
        console.log("Loaded competencies:", response.data); 
      } catch (error) {
        console.error("Failed to load exams", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return { competencies, loading, refreshData };
}
 