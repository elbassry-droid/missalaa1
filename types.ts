
export interface ExamGrade {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  date: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  groupId?: string;
  phone: string;
  parentPhone: string;
  balance: number;
  isExempted: boolean;
  grades: ExamGrade[];
  attendance: string[]; 
  paidMonths: string[]; 
  payments: { [monthKey: string]: number }; 
  sessionAttendance: { [monthKey: string]: boolean[] }; 
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  schedule: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'supervisor';
  name: string;
}

export type ViewState = 'dashboard' | 'students' | 'classes' | 'finance' | 'attendance-scanner' | 'ai-insights' | 'supervisors';
