from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import University, Department, ExamBook, UniversityBookSubscription
from exams.models import CompetencyArea, Question, QuestionOption, ExamAttempt


class PracticeAndSimulatedWorkflowTests(TestCase):
    def setUp(self):
        self.tenant = University.objects.create(name='Test University', slug='test-university')
        self.department = Department.objects.create(university=self.tenant, name='Science', category='ACC')
        self.user = get_user_model().objects.create_user(username='student@test.com', email='student@test.com', password='testpass123', university=self.tenant, department=self.department)
        self.book = ExamBook.objects.create(title='Test Book', category='ACC')
        UniversityBookSubscription.objects.create(university=self.tenant, book=self.book)
        self.area = CompetencyArea.objects.create(book=self.book, name='Test Topic', duration_minutes=60)
        self.question = Question.objects.create(competency_area=self.area, text='Test question?', explanation='Test explanation')
        self.correct = QuestionOption.objects.create(question=self.question, option_text='Correct', is_correct=True)
        self.wrong = QuestionOption.objects.create(question=self.question, option_text='Wrong', is_correct=False)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_practice_session_returns_answer_key(self):
        response = self.client.get('/api/exams/questions/session/', {'competency_area': self.area.id, 'mode': 'PRACTICE'}, HTTP_HOST='test-university.localhost')
        self.assertEqual(response.status_code, 200)
        self.assertIn('is_correct', response.data[0]['options'][0])
        self.assertIn('explanation', response.data[0])

    def test_simulated_session_hides_answer_key(self):
        response = self.client.get('/api/exams/questions/session/', {'competency_area': self.area.id, 'mode': 'SIMULATED'}, HTTP_HOST='test-university.localhost')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('is_correct', response.data[0]['options'][0])
        self.assertNotIn('explanation', response.data[0])

    def test_submit_validates_option_belongs_to_question(self):
        start = self.client.post('/api/exams/attempts/start/', {'competency_area': self.area.id, 'mode': 'SIMULATED'}, format='json', HTTP_HOST='test-university.localhost')
        self.assertEqual(start.status_code, 201)
        wrong_question = Question.objects.create(competency_area=self.area, text='Second?', explanation='Second explanation')
        wrong_option = QuestionOption.objects.create(question=wrong_question, option_text='Wrong relation', is_correct=True)
        response = self.client.post(f"/api/exams/attempts/{start.data['id']}/submit/", {'answers': [{'question_id': self.question.id, 'selected_option_id': wrong_option.id, 'time_spent': 10}]}, format='json', HTTP_HOST='test-university.localhost')
        self.assertEqual(response.status_code, 400)
