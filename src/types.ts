export type Role = 'student' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  registerNumber: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AcademicData {
  name: string;
  registerNumber: string;
  iatMarks: number[];
  internalMarks: number[];
  attendance: number;
  result: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  registerNumber: string;
  role: Role;
  academic: {
    id?: string;
    iatMarks: number[];
    internalMarks: number[];
    attendance: number;
    result: string;
  };
}

export interface ComplaintRecord {
  id: string;
  userId: string;
  studentName?: string;
  registerNumber?: string;
  image: string;
  description: string;
  location: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: string;
}

export interface NotificationRecord {
  _id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}
