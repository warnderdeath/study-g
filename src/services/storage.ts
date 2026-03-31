import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Note, Exam, StudySession, Course, ScheduleEntry } from '../types';

// Platform-specific storage wrapper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await storage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await storage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Storage Keys
const KEYS = {
  NOTES: '@studyg_notes',
  EXAMS: '@studyg_exams',
  SESSIONS: '@studyg_sessions',
  COURSES: '@studyg_courses',
  ACTIVE_SESSION: '@studyg_active_session',
  SCHEDULE: '@studyg_schedule',
};

// Notes Storage
export const getNotes = async (): Promise<Note[]> => {
  try {
    const data = await storage.getItem(KEYS.NOTES);
    return data ? JSON.parse(data, reviver) : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

export const saveNote = async (note: Note): Promise<void> => {
  try {
    const notes = await getNotes();
    const index = notes.findIndex(n => n.id === note.id);

    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.push(note);
    }

    await storage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const filtered = notes.filter(n => n.id !== noteId);
    await storage.setItem(KEYS.NOTES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Exams Storage
export const getExams = async (): Promise<Exam[]> => {
  try {
    const data = await storage.getItem(KEYS.EXAMS);
    return data ? JSON.parse(data, reviver) : [];
  } catch (error) {
    console.error('Error loading exams:', error);
    return [];
  }
};

export const saveExam = async (exam: Exam): Promise<void> => {
  try {
    const exams = await getExams();
    const index = exams.findIndex(e => e.id === exam.id);

    if (index >= 0) {
      exams[index] = exam;
    } else {
      exams.push(exam);
    }

    await storage.setItem(KEYS.EXAMS, JSON.stringify(exams));
  } catch (error) {
    console.error('Error saving exam:', error);
    throw error;
  }
};

export const deleteExam = async (examId: string): Promise<void> => {
  try {
    const exams = await getExams();
    const filtered = exams.filter(e => e.id !== examId);
    await storage.setItem(KEYS.EXAMS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};

// Study Sessions Storage
export const getSessions = async (): Promise<StudySession[]> => {
  try {
    const data = await storage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data, reviver) : [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const saveSession = async (session: StudySession): Promise<void> => {
  try {
    const sessions = await getSessions();
    const index = sessions.findIndex(s => s.id === session.id);

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    await storage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

export const getActiveSession = async (): Promise<StudySession | null> => {
  try {
    const data = await storage.getItem(KEYS.ACTIVE_SESSION);
    return data ? JSON.parse(data, reviver) : null;
  } catch (error) {
    console.error('Error loading active session:', error);
    return null;
  }
};

export const setActiveSession = async (session: StudySession | null): Promise<void> => {
  try {
    if (session) {
      await storage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
    }
  } catch (error) {
    console.error('Error setting active session:', error);
    throw error;
  }
};

// Default courses data
const DEFAULT_COURSES: Course[] = [
  // Alttan alınan dersler
  { id: '1', code: 'EEM-210', name: 'Elektromanyetik Alanlar', color: '#E53935' },
  { id: '2', code: 'EEM-208', name: 'Mesleki İngilizce', color: '#43A047' },
  // 3. Sınıf Dönem Dersleri
  { id: '3', code: 'EEM-306', name: 'Analog Haberleşme', color: '#1E88E5' },
  { id: '4', code: 'EEM-330', name: 'Elektromanyetik Uyumluluk', color: '#FB8C00' },
  { id: '5', code: 'EEM-316', name: 'Güç Sistemleri II', color: '#8E24AA' },
  { id: '6', code: 'EEM-302', name: 'Mikrodenetleyicilerle Kontrol', color: '#00ACC1' },
  { id: '7', code: 'EEM-314', name: 'Girişimcilik', color: '#F4511E' },
  { id: '8', code: 'EEM-308', name: 'Endüstriyel Elektronik', color: '#7CB342' },
  { id: '9', code: 'EEM-326', name: 'Optoelektronik', color: '#5E35B1' },
];

// Initialize courses with default data if empty
const initializeCoursesIfNeeded = async (): Promise<void> => {
  try {
    const data = await storage.getItem(KEYS.COURSES);
    if (!data) {
      await storage.setItem(KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
    }
  } catch (error) {
    console.error('Error initializing courses:', error);
  }
};

// Courses Storage
export const getCourses = async (): Promise<Course[]> => {
  try {
    await initializeCoursesIfNeeded();
    const data = await storage.getItem(KEYS.COURSES);
    return data ? JSON.parse(data) : DEFAULT_COURSES;
  } catch (error) {
    console.error('Error loading courses:', error);
    return DEFAULT_COURSES;
  }
};

export const saveCourse = async (course: Course): Promise<void> => {
  try {
    const courses = await getCourses();
    const index = courses.findIndex(c => c.id === course.id);

    if (index >= 0) {
      courses[index] = course;
    } else {
      courses.push(course);
    }

    await storage.setItem(KEYS.COURSES, JSON.stringify(courses));
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const courses = await getCourses();
    const filtered = courses.filter(c => c.id !== courseId);
    await storage.setItem(KEYS.COURSES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// Default schedule data
const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  // Pazartesi
  { id: '1', courseId: '3', dayOfWeek: 0, startTime: '13:30', endTime: '16:15', type: 'lecture' },
  // Salı
  { id: '2', courseId: '1', dayOfWeek: 1, startTime: '10:30', endTime: '12:15', type: 'lecture' },
  { id: '3', courseId: '4', dayOfWeek: 1, startTime: '09:30', endTime: '12:15', type: 'lecture' },
  { id: '4', courseId: '5', dayOfWeek: 1, startTime: '13:30', endTime: '16:15', type: 'lecture' },
  // Çarşamba
  { id: '5', courseId: '6', dayOfWeek: 2, startTime: '08:30', endTime: '10:15', type: 'lecture' },
  { id: '6', courseId: '7', dayOfWeek: 2, startTime: '10:30', endTime: '12:15', type: 'lecture' },
  // Perşembe
  { id: '7', courseId: '2', dayOfWeek: 3, startTime: '10:30', endTime: '12:15', type: 'lecture' },
  { id: '8', courseId: '6', dayOfWeek: 3, startTime: '08:30', endTime: '10:15', type: 'lecture' },
  { id: '9', courseId: '8', dayOfWeek: 3, startTime: '13:30', endTime: '16:15', type: 'lecture' },
  // Cuma
  { id: '10', courseId: '9', dayOfWeek: 4, startTime: '14:30', endTime: '17:15', type: 'lecture' },
];

// Initialize schedule with default data if empty
const initializeScheduleIfNeeded = async (): Promise<void> => {
  try {
    const data = await storage.getItem(KEYS.SCHEDULE);
    if (!data) {
      await storage.setItem(KEYS.SCHEDULE, JSON.stringify(DEFAULT_SCHEDULE));
    }
  } catch (error) {
    console.error('Error initializing schedule:', error);
  }
};

// Schedule Storage
export const getSchedule = async (): Promise<ScheduleEntry[]> => {
  try {
    await initializeScheduleIfNeeded();
    const data = await storage.getItem(KEYS.SCHEDULE);
    return data ? JSON.parse(data) : DEFAULT_SCHEDULE;
  } catch (error) {
    console.error('Error loading schedule:', error);
    return DEFAULT_SCHEDULE;
  }
};

export const saveScheduleEntry = async (entry: ScheduleEntry): Promise<void> => {
  try {
    const schedule = await getSchedule();
    const index = schedule.findIndex(e => e.id === entry.id);

    if (index >= 0) {
      schedule[index] = entry;
    } else {
      schedule.push(entry);
    }

    await storage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));
  } catch (error) {
    console.error('Error saving schedule entry:', error);
    throw error;
  }
};

export const deleteScheduleEntry = async (entryId: string): Promise<void> => {
  try {
    const schedule = await getSchedule();
    const filtered = schedule.filter(e => e.id !== entryId);
    await storage.setItem(KEYS.SCHEDULE, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting schedule entry:', error);
    throw error;
  }
};

// Utility function to handle Date parsing
function reviver(key: string, value: any) {
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value)) {
      return new Date(value);
    }
  }
  return value;
}

// Clear all data (for testing)
export const clearAllData = async (): Promise<void> => {
  try {
    const allKeys = [
      KEYS.NOTES,
      KEYS.EXAMS,
      KEYS.SESSIONS,
      KEYS.COURSES,
      KEYS.ACTIVE_SESSION,
      KEYS.SCHEDULE,
    ];

    if (Platform.OS === 'web') {
      allKeys.forEach(key => localStorage.removeItem(key));
    } else {
      await AsyncStorage.multiRemove(allKeys);
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
