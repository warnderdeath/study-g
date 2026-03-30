import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getCourses, getSchedule } from '../services/storage';
import { Course, ScheduleEntry, DAYS_OF_WEEK } from '../types';

interface StudyPlanEntry {
  id: string;
  dayOfWeek: number;
  courseId: string;
  startTime: string;
  endTime: string;
}

const StudyPlanScreen = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTime, setSelectedTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    loadData();
    loadStudyPlan();
  }, []);

  const loadData = async () => {
    const allCourses = await getCourses();
    const allSchedule = await getSchedule();
    setCourses(allCourses);
    setSchedule(allSchedule);
  };

  const loadStudyPlan = () => {
    const saved = localStorage.getItem('@studyg_study_plan');
    if (saved) {
      setStudyPlan(JSON.parse(saved));
    }
  };

  const saveStudyPlan = (plan: StudyPlanEntry[]) => {
    localStorage.setItem('@studyg_study_plan', JSON.stringify(plan));
    setStudyPlan(plan);
  };

  const getTimeSlot = (type: 'morning' | 'afternoon' | 'evening') => {
    switch (type) {
      case 'morning':
        return { start: '08:00', end: '12:00' };
      case 'afternoon':
        return { start: '13:00', end: '17:00' };
      case 'evening':
        return { start: '18:00', end: '22:00' };
    }
  };

  const handleAddStudySession = () => {
    if (!selectedCourse) {
      if (Platform.OS === 'web') {
        alert('Lütfen bir ders seçin!');
      } else {
        Alert.alert('Hata', 'Lütfen bir ders seçin!');
      }
      return;
    }

    const timeSlot = getTimeSlot(selectedTime);
    const newEntry: StudyPlanEntry = {
      id: Date.now().toString(),
      dayOfWeek: selectedDay,
      courseId: selectedCourse,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
    };

    const updatedPlan = [...studyPlan, newEntry];
    saveStudyPlan(updatedPlan);
    setShowAddModal(false);
    resetModal();
  };

  const handleDeleteEntry = (entryId: string) => {
    const updatedPlan = studyPlan.filter(e => e.id !== entryId);
    saveStudyPlan(updatedPlan);
  };

  const resetModal = () => {
    setSelectedCourse('');
    setSelectedDay(0);
    setSelectedTime('morning');
  };

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const getEntriesForDay = (dayIndex: number) => {
    return studyPlan
      .filter(e => e.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getScheduleForDay = (dayIndex: number) => {
    return schedule.filter(e => e.dayOfWeek === dayIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {DAYS_OF_WEEK.map((day, index) => {
          const dayStudyPlan = getEntriesForDay(index);
          const daySchedule = getScheduleForDay(index);

          return (
            <View key={index} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setSelectedDay(index);
                    setShowAddModal(true);
                  }}
                >
                  <Text style={styles.addButtonText}>+ Çalışma Ekle</Text>
                </TouchableOpacity>
              </View>

              {/* Ders Programı */}
              {daySchedule.length > 0 && (
                <View style={styles.scheduleSection}>
                  <Text style={styles.sectionTitle}>📚 Ders Programı</Text>
                  {daySchedule.map((entry) => {
                    const course = getCourseById(entry.courseId);
                    if (!course) return null;

                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.scheduleEntry,
                          { borderLeftColor: course.color },
                        ]}
                      >
                        <Text style={styles.time}>
                          {entry.startTime} - {entry.endTime}
                        </Text>
                        <Text style={styles.courseName}>{course.code}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Çalışma Planı */}
              {dayStudyPlan.length > 0 && (
                <View style={styles.studySection}>
                  <Text style={styles.sectionTitle}>✍️ Çalışma Planı</Text>
                  {dayStudyPlan.map((entry) => {
                    const course = getCourseById(entry.courseId);
                    if (!course) return null;

                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.studyEntry,
                          { borderLeftColor: course.color },
                        ]}
                      >
                        <View style={styles.studyEntryContent}>
                          <Text style={styles.time}>
                            {entry.startTime} - {entry.endTime}
                          </Text>
                          <Text style={styles.courseName}>{course.code}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {daySchedule.length === 0 && dayStudyPlan.length === 0 && (
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayText}>Henüz plan yok</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Study Session Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Çalışma Ekle</Text>
            <Text style={styles.modalSubtitle}>{DAYS_OF_WEEK[selectedDay]}</Text>

            <Text style={styles.label}>Ders Seç:</Text>
            <ScrollView style={styles.courseList}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseOption,
                    selectedCourse === course.id && styles.courseOptionActive,
                  ]}
                  onPress={() => setSelectedCourse(course.id)}
                >
                  <View
                    style={[styles.courseColorDot, { backgroundColor: course.color }]}
                  />
                  <Text style={styles.courseOptionText}>{course.code} - {course.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Zaman Dilimi:</Text>
            <View style={styles.timeOptions}>
              <TouchableOpacity
                style={[
                  styles.timeOption,
                  selectedTime === 'morning' && styles.timeOptionActive,
                ]}
                onPress={() => setSelectedTime('morning')}
              >
                <Text style={styles.timeOptionEmoji}>🌅</Text>
                <Text style={styles.timeOptionText}>Sabah</Text>
                <Text style={styles.timeOptionTime}>08:00 - 12:00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeOption,
                  selectedTime === 'afternoon' && styles.timeOptionActive,
                ]}
                onPress={() => setSelectedTime('afternoon')}
              >
                <Text style={styles.timeOptionEmoji}>☀️</Text>
                <Text style={styles.timeOptionText}>Öğleden Sonra</Text>
                <Text style={styles.timeOptionTime}>13:00 - 17:00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeOption,
                  selectedTime === 'evening' && styles.timeOptionActive,
                ]}
                onPress={() => setSelectedTime('evening')}
              >
                <Text style={styles.timeOptionEmoji}>🌙</Text>
                <Text style={styles.timeOptionText}>Akşam</Text>
                <Text style={styles.timeOptionTime}>18:00 - 22:00</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetModal();
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddStudySession}
              >
                <Text style={styles.saveButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  daySection: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: fontSize.xs,
    color: colors.background,
    fontWeight: fontWeight.semibold,
  },
  scheduleSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  studySection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.semibold,
  },
  scheduleEntry: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studyEntry: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studyEntryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  courseName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyDay: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBg,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  courseList: {
    maxHeight: 200,
  },
  courseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  courseOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  courseOptionText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  timeOptions: {
    marginBottom: spacing.lg,
  },
  timeOption: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  timeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  timeOptionEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  timeOptionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  timeOptionTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
});

export default StudyPlanScreen;
