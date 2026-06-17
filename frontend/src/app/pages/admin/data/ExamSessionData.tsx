import { useState } from "react";
import apiClient from "../../../api/client";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

export interface ExamSession {
    id: number;
    exam_name: string;
    start_time: string;
    end_time: string;
    status: string;
    participant_count: number;
    
}

 

export function ExamSessionData(){

    const { examId } = useParams();
   

    const [examsessions, setExamSessions] = useState<ExamSession[]>([]);
    const [loading, setLoading] = useState(true);
 
   
    const [timeLeft, setTimeLeft] = useState<number | null>(null); 
    const [questions, setQuestions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const refreshQuestionData = async () => {
      if (!examId) {
        setError('No exam id provided');
        setLoading(false);
        return;
      }

      try {
        const resp = await apiClient.get(`/questions/?competency_area=${examId}`);
        const data = resp.data?.results ?? resp.data;
        if (!Array.isArray(data)) {
          setQuestions([]);
        } else {
          const normalized = data.map((q: any) => ({
            id: q.id,
            text: q.text ?? q.question_text ?? q.title,
            explanation: q.explanation ?? null,
            options: q.options ?? q.question_options ?? q.choices ?? q.options_list ?? [],
            duration_minutes: q.duration_minutes ?? q.competency_area?.duration_minutes ?? null,
          }));
          // debug first question options shape
          if (normalized.length && normalized[0].options && normalized[0].options.length) {
            // eslint-disable-next-line no-console
            console.debug('Question options sample:', normalized[0].options[0]);
          }
          setQuestions(normalized);
          const duration = normalized[0]?.duration_minutes ?? 90;
          setTimeLeft(duration);
          console.log("Durations ", data);
        }
      } catch (err: any) {
        console.error('Failed to load questions:', err?.response?.status, err?.response?.data ?? err);
        const msg = err?.response?.data?.detail ?? err?.response?.data?.error ?? 'Failed to load questions';
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    };
    
    
    useEffect ( ()=>{
        refreshQuestionData();
    }, [examId] );

    return { 
        examId,
        setLoading, 
        loading, questions, 
        timeLeft, error, 
        refreshQuestionData,
         examsessions, 
         setTimeLeft,  
         setError };

}