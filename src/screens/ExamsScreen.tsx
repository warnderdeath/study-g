import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getExams, saveExam, deleteExam, getCourses } from '../services/storage';
import { Exam, Course } from '../types';
import { getDaysUntilExam, formatDate, getExamCountdownText } from '../utils/dateUtils';

const ExamsScreen = () => {
  const navigation = useNavigation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Form states
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourse, setNewExamCourse] = useState('');
  const [newExamDate, setNewExamDate] = useState(new Date());
  const [newExamTime, setNewExamTime] = useState('09:00');
  const [newExamLocation, setNewExamLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const allExams = await getExams();
    const allCourses = await getCourses();

    // Sort: upcoming first, then past
    const sortedExams = allExams.sort((a, b) => {
      const daysA = getDaysUntilExam(a.date);
      const daysB = getDaysUntilExam(b.date);

      // If both are upcoming or both are past, sort by date
      if ((daysA >= 0 && daysB >= 0) || (daysA < 0 && daysB < 0)) {
        return a.date.getTime() - b.date.getTime();
      }

      // Otherwise, upcoming exams come first
      return daysB - daysA;
    });

    setExams(sortedExams);
    setCourses(allCourses);
  };

  const handleAddExam = async () => {
    if (!newExamTitle.trim() || !newExamCourse) {
      if (Platform.OS === 'web') {
        alert('Lütfen sınav adı ve ders seçin.');
      } else {
        Alert.alert('Hata', 'Lütfen sınav adı ve ders seçin.');
      }
      return;
    }

    const newExam: Exam = {
      id: Date.now().toString(),
      courseId: newExamCourse,
      title: newExamTitle,
      date: newExamDate,
      time: newExamTime,
      topics: [],
      location: newExamLocation || undefined,
      isCompleted: false,
    };

    await saveExam(newExam);
    await loadData();
    resetAddModal();
  };

  const handleDeleteExam = async (examId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bu sınavı silmek istediğinize emin misiniz?')) {
        await deleteExam(examId);
        await loadData();
        setSelectedExam(null);
      }
    } else {
      Alert.alert('Sınavı Sil', 'Bu sınavı silmek istediğinize emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await deleteExam(examId);
            await loadData();
            setSelectedExam(null);
          },
        },
      ]);
    }
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setNewExamTitle('');
    setNewExamCourse('');
    setNewExamDate(new Date());
    setNewExamTime('09:00');
    setNewExamLocation('');
  };

  const getCourseById = (courseId: string) => {
    return courses.find((c) => c.id === courseId);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewExamDate(selectedDate);
    }
  };

  // If no courses, show message
  if (courses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Önce ders eklemelisin</Text>
          <Text style={styles.emptyStateSubtext}>
            Dersler sekmesinden derslerini ekle
          </Text>
          <TouchableOpacity
            style={styles.goToCoursesButton}
            onPress={() => navigation.navigate('Courses' as never)}
          >
            <Text style={styles.goToCoursesButtonText}>Derslere Git</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {exams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Henüz sınav eklenmemiş</Text>
          <Text style={styles.emptyStateSubtext}>
            Aşağıdaki + butonuna basarak sınav ekleyebilirsin
          </Text>
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const course = getCourseById(item.courseId);
            const daysUntil = getDaysUntilExam(item.date);
            const isPast = daysUntil < 0;

            return (
              <TouchableOpacity
                style={[styles.examCard, isPast && styles.examCardPast]}
                onPress={() => setSelectedExam(item)}
              >
                <View style={styles.examCardHeader}>
                  <View style={styles.examCardLeft}>
                    <Text style={[styles.examTitle, isPast && styles.examTitlePast]}>
                      {item.title}
                    </Text>
                    <View
                      style={[
                        styles.courseBadge,
                        { backgroundColor: course?.color + '30' },
                      ]}
                    >
                      <Text style={[styles.courseBadgeText, { color: course?.color }]}>
                        {course?.code}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.countdownBadge,
                      isPast && styles.countdownBadgePast,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countdownText,
                        isPast && styles.countdownTextPast,
                      ]}
                    >
                      {getExamCountdownText(item.date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.examCardFooter}>
                  <Text style={styles.examDateTime}>
                    📅 {formatDate(item.date, 'dd MMMM yyyy')} • ⏰ {item.time}
                  </Text>
                  {item.location && (
                    <Text style={styles.examLocation}>📍 {item.location}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.examsList}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Exam Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetAddModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yeni Sınav</Text>

              <TextInput
                style={styles.input}
                placeholder="Sınav Adı (ör. Vize, Final)"
                placeholderTextColor={colors.textTertiary}
                value={newExamTitle}
                onChangeText={setNewExamTitle}
              />

              <Text style={styles.label}>Ders:</Text>
              <ScrollView style={styles.courseList}>
                {courses.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.courseOption,
                      newExamCourse === item.id && styles.courseOptionActive,
                      newExamCourse === item.id && { borderColor: item.color },
                    ]}
                    onPress={() => setNewExamCourse(item.id)}
                  >
                    <View style={[styles.courseColorDot, { backgroundColor: item.color }]} />
                    <View style={styles.courseTextContainer}>
                      <Text
                        style={[
                          styles.courseOptionCode,
                          newExamCourse === item.id && { color: item.color },
                        ]}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={[
                          styles.courseOptionName,
                          newExamCourse === item.id && { color: item.color },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Tarih:</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={newExamDate.toISOString().split('T')[0]}
                  onChange={(e) => setNewExamDate(new Date(e.target.value))}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    fontSize: fontSize.md,
                    color: colors.text,
                    marginBottom: spacing.md,
                    border: 'none',
                    width: '100%',
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(newExamDate, 'dd MMMM yyyy')}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={newExamDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </>
              )}

              <Text style={styles.label}>Saat:</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor={colors.textTertiary}
                value={newExamTime}
                onChangeText={setNewExamTime}
              />

              <Text style={styles.label}>Yer (Opsiyonel):</Text>
              <TextInput
                style={styles.input}
                placeholder="Sınıf veya bina adı"
                placeholderTextColor={colors.textTertiary}
                value={newExamLocation}
                onChangeText={setNewExamLocation}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetAddModal}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddExam}>
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* View Exam Modal */}
      <Modal
        visible={selectedExam !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedExam(null)}
      >
        {selectedExam && (
          <View style={styles.modalOverlay}>
            <View style={styles.viewModalContent}>
              <Text style={styles.viewModalTitle}>{selectedExam.title}</Text>

              <View style={styles.viewDetailRow}>
                <Text style={styles.viewDetailLabel}>Ders:</Text>
                <Text style={styles.viewDetailValue}>
                  {getCourseById(selectedExam.courseId)?.name}
                </Text>
              </View>

              <View style={styles.viewDetailRow}>
                <Text style={styles.viewDetailLabel}>Tarih:</Text>
                <Text style={styles.viewDetailValue}>
                  {formatDate(selectedExam.date, 'dd MMMM yyyy')}
                </Text>
              </View>

              <View style={styles.viewDetailRow}>
                <Text style={styles.viewDetailLabel}>Saat:</Text>
                <Text style={styles.viewDetailValue}>{selectedExam.time}</Text>
              </View>

              {selectedExam.location && (
                <View style={styles.viewDetailRow}>
                  <Text style={styles.viewDetailLabel}>Yer:</Text>
                  <Text style={styles.viewDetailValue}>{selectedExam.location}</Text>
                </View>
              )}

              <View style={styles.viewModalActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteExam(selectedExam.id)}
                >
                  <Text style={styles.deleteButtonText}>Sil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedExam(null)}
                >
                  <Text style={styles.closeButtonText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  examsList: {
    padding: spacing.md,
  },
  examCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  examCardPast: {
    opacity: 0.6,
    borderLeftColor: colors.textTertiary,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  examCardLeft: {
    flex: 1,
  },
  examTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  examTitlePast: {
    color: colors.textSecondary,
  },
  courseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  courseBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  countdownBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  countdownBadgePast: {
    backgroundColor: colors.textTertiary + '30',
  },
  countdownText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  countdownTextPast: {
    color: colors.textTertiary,
  },
  examCardFooter: {
    gap: spacing.xs,
  },
  examDateTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  examLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBg,
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  courseList: {
    maxHeight: 300,
    marginBottom: spacing.md,
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
    borderWidth: 2,
    backgroundColor: colors.surfaceLight,
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  courseTextContainer: {
    flex: 1,
  },
  courseOptionCode: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  courseOptionName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dateButton: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
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
    marginLeft: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  viewModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  viewModalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  viewDetailRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  viewDetailLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    width: 80,
  },
  viewDetailValue: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  viewModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
  goToCoursesButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  goToCoursesButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
});

export default ExamsScreen;
