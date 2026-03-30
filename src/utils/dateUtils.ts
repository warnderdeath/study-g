import { format, isToday, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export const formatDate = (date: Date, formatStr: string = 'dd MMMM yyyy'): string => {
  return format(date, formatStr);
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'dd MMM yyyy HH:mm');
};

export const isExamToday = (examDate: Date): boolean => {
  return isToday(examDate);
};

export const getDaysUntilExam = (examDate: Date): number => {
  return differenceInDays(examDate, new Date());
};

export const getExamCountdownText = (examDate: Date): string => {
  const days = getDaysUntilExam(examDate);

  if (days < 0) {
    return 'Geçti';
  } else if (days === 0) {
    return 'Bugün!';
  } else if (days === 1) {
    return 'Yarın';
  } else if (days <= 7) {
    return `${days} gün`;
  } else if (days <= 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} hafta`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} ay`;
  }
};

export const getCurrentWeekDates = (): { start: Date; end: Date } => {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
};

export const getWeekDays = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}s ${minutes}d`;
  } else if (minutes > 0) {
    return `${minutes}d ${secs}sn`;
  } else {
    return `${secs}sn`;
  }
};

export const formatDurationDetailed = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  } else if (minutes > 0) {
    return `${minutes} dakika`;
  } else {
    return `${seconds} saniye`;
  }
};

export const getDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};
