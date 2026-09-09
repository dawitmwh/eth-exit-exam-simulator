import { useState } from "react";
import apiClient from "../../../api/client";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
 

export interface ExamSession {
    id: number;
    exam_name: string;
    start_time: string;
    end_time: string;
    status: string;
    participant_count: number;
    
}

export function ExamSessionData() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams(); // Get URL parameters like ?mode=practice
  
  // 1. Identify the mode from the URL
  const isPracticeMode = searchParams.get('mode') === 'practice';

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshQuestionData = async () => {
    if (!examId) {
      setError('No exam ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let url = '';
      let params: any = { mode: isPracticeMode ? 'practice' : 'exam' };

      if (examId === 'full-mock') {
        // 1. If it's the full mock, use the dedicated endpoint
        // NO 'competency_area' parameter needed here!
        url = '/exams/questions/full-mock/'; 
      } else {
        // 2. If it's a specific area, use the standard list and pass the ID
        url = '/exams/questions/';
        params.competency_area = examId; 
      }

      const resp = await apiClient.get(url, { params });
      const data = resp.data?.results ?? resp.data;

      if (!Array.isArray(data) || data.length === 0) {
        setQuestions([]);
        setError("No questions found for this selection.");
      } else {
        // 4. DATA NORMALIZATION
        const normalized = data.map((q: any) => ({
          id: q.id,
          text: q.text ?? q.question_text ?? 'Question text missing',
          explanation: q.explanation ?? null,
          options: q.options ?? q.question_options ?? [],
          // If it's a full mock, we might want a standard 120 mins, otherwise use database value
          duration_minutes: examId === 'full-mock' ? 120 : (q.duration_minutes ?? 60),
        }));

        setQuestions(normalized);
        
        // 5. INITIALIZE TIMER
        // We set it in minutes here; the ExamSession.tsx useEffect will handle the countdown
        setTimeLeft(normalized[0].duration_minutes);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err?.response?.data?.error ?? 'Failed to connect to exam server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQuestionData();
  }, [examId]); // Re-fetch if the user switches exams

  return { 
    examId, 
    loading, 
    questions, 
    timeLeft, 
    error, 
    isPracticeMode, // Now exported so ExamSession can use it
    refreshQuestionData 
  };
}

 

// export function ExamSessionData(){

//     const { examId } = useParams();
   

//     const [examsessions, setExamSessions] = useState<ExamSession[]>([]);
//     const [loading, setLoading] = useState(true);
 
   
//     const [timeLeft, setTimeLeft] = useState<number | null>(null); 
//     const [questions, setQuestions] = useState<any[]>([]);
//     const [error, setError] = useState<string | null>(null);

//     const refreshQuestionData = async () => {
//       if (!examId) {
//         setError('No exam id provided');
//         setLoading(false);
//         return;
//       }

//       try {
//         //const resp = await apiClient.get(`/questions/?competency_area=${examId}`);
//         const url = examId === 'full-mock' 
//           ? '/exams/questions/full-mock/' 
//           : `/exams/questions/?competency_area=${examId}`;

//         const resp = await apiClient.get(url, { params: { mode: isPracticeMode ? 'practice' : 'exam' }
//         });
//         const data = resp.data?.results ?? resp.data;

//         if (!Array.isArray(data)) {
//           setQuestions([]);
//         } else {
//           const normalized = data.map((q: any) => ({
//             id: q.id,
//             text: q.text ?? q.question_text ?? q.title,
//             explanation: q.explanation ?? null,
//             options: q.options ?? q.question_options ?? q.choices ?? q.options_list ?? [],
//             duration_minutes: q.duration_minutes ?? q.competency_area?.duration_minutes ?? null,
//           }));
//           // debug first question options shape
//           if (normalized.length && normalized[0].options && normalized[0].options.length) {
//             // eslint-disable-next-line no-console
//             console.debug('Question options sample:', normalized[0].options[0]);
//           }
//           setQuestions(normalized);
//           const duration = normalized[0]?.duration_minutes ?? 90;
//           setTimeLeft(duration);
//           console.log("Durations ", data);
//         }
//       } catch (err: any) {
//         console.error('Failed to load questions:', err?.response?.status, err?.response?.data ?? err);
//         const msg = err?.response?.data?.detail ?? err?.response?.data?.error ?? 'Failed to load questions';
//         setError(String(msg));
//       } finally {
//         setLoading(false);
//       }
//     };
    
    
//     useEffect ( ()=>{
//         refreshQuestionData();
//     }, [examId] );

//     return { 
//         examId,
//         setLoading, 
//         loading, questions, 
//         timeLeft, error, 
//         refreshQuestionData,
//          examsessions, 
//          setTimeLeft,  
//          setError };

// }