// Core Data Types for Study-G

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  icon?: string;
}

export interface Note {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  imageUrl?: string;
  localImageUri?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySession {
  id: string;
  courseId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  isActive: boolean;
  focusMode: boolean;
  notes?: string;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: Date;
  time: string;
  topics: string[];
  location?: string;
  personalNote?: string;
  motivationalMessage?: string;
  isCompleted: boolean;
}

export interface ScheduleEntry {
  id: string;
  courseId: string;
  dayOfWeek: number; // 0 = Pazartesi, 6 = Pazar
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location?: string;
  type?: 'lecture' | 'lab' | 'tutorial'; // Ders tipi
}

export interface DailyStudySummary {
  date: string; // YYYY-MM-DD
  totalDuration: number; // in seconds
  sessions: StudySession[];
  courseBreakdown: {
    [courseId: string]: number; // duration per course
  };
}

export interface WeeklyStudySummary {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totalDuration: number;
  dailyBreakdown: DailyStudySummary[];
  topCourse: string;
}

// Available colors for courses
export const COURSE_COLORS = [
  '#E53935', // Red
  '#43A047', // Green
  '#1E88E5', // Blue
  '#FB8C00', // Orange
  '#8E24AA', // Purple
  '#00ACC1', // Cyan
  '#F4511E', // Deep Orange
  '#7CB342', // Light Green
  '#5E35B1', // Deep Purple
  '#00897B', // Teal
  '#FDD835', // Yellow
  '#D81B60', // Pink
];

// Days of week
export const DAYS_OF_WEEK = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
];
