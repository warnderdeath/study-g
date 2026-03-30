import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getExams, getCourses } from '../services/storage';
import { Exam, Course } from '../types';
import { isExamToday, getDaysUntilExam, getExamCountdownText } from '../utils/dateUtils';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [todayExam, setTodayExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const allCourses = await getCourses();
    setCourses(allCourses);

    if (allCourses.length > 0) {
      loadExams();
    }
  };

  const loadExams = async () => {
    const allExams = await getExams();
    const sortedExams = allExams
      .filter(exam => !exam.isCompleted)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    setExams(sortedExams);

    // Check for today's exam
    const examToday = sortedExams.find(exam => isExamToday(exam.date));
    if (examToday) {
      setTodayExam(examToday);
      setShowExamModal(true);
    }

    // Get next 3 upcoming exams
    const upcoming = sortedExams
      .filter(exam => getDaysUntilExam(exam.date) >= 0)
      .slice(0, 3);
    setUpcomingExams(upcoming);
  };

  const closeExamModal = () => {
    setShowExamModal(false);
  };

  const nextExam = upcomingExams[0];
  const daysUntilNext = nextExam ? getDaysUntilExam(nextExam.date) : null;

  // If no courses, show onboarding
  if (courses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.onboardingContainer}>
          <Text style={styles.onboardingIcon}>📚</Text>
          <Text style={styles.onboardingTitle}>Study-G'ye Hoş Geldin!</Text>
          <Text style={styles.onboardingText}>
            Başlamak için önce derslerini eklemelisin.
          </Text>
          <TouchableOpacity
            style={styles.onboardingButton}
            onPress={() => navigation.navigate('Courses' as never)}
          >
            <Text style={styles.onboardingButtonText}>Derslerimi Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Hoş Geldin</Text>
          <Text style={styles.appName}>Study-G</Text>
          <View style={styles.divider} />
        </View>

        {/* Next Exam Countdown */}
        {nextExam && (
          <View style={styles.countdownCard}>
            <Text style={styles.countdownLabel}>Bir Sonraki Sınav</Text>
            <View style={styles.countdownMain}>
              <Text style={styles.countdownNumber}>
                {daysUntilNext !== null && daysUntilNext === 0
                  ? '🔥'
                  : daysUntilNext}
              </Text>
              <Text style={styles.countdownUnit}>
                {daysUntilNext === 0 ? 'BUGÜN' : 'GÜN'}
              </Text>
            </View>
            <Text style={styles.countdownExamName}>{nextExam.title}</Text>
            <Text style={styles.countdownExamCourse}>
              {nextExam.date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}

        {/* Upcoming Exams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan Sınavlar</Text>
          {upcomingExams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Henüz sınav eklenmemiş</Text>
              <Text style={styles.emptyStateSubtext}>
                Sınavlar sekmesinden ekleyebilirsin
              </Text>
            </View>
          ) : (
            upcomingExams.map((exam) => (
              <View key={exam.id} style={styles.examCard}>
                <View style={styles.examCardLeft}>
                  <Text style={styles.examCardTitle}>{exam.title}</Text>
                  <Text style={styles.examCardDate}>
                    {exam.date.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long'
                    })} • {exam.time}
                  </Text>
                </View>
                <View style={styles.examCardRight}>
                  <Text style={styles.examCardCountdown}>
                    {getExamCountdownText(exam.date)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Stats Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bugün</Text>
          <View style={styles.statsPreview}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Saat</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Oturum</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Not</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Exam Day Modal */}
      <Modal
        visible={showExamModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeExamModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎯</Text>
            <Text style={styles.modalTitle}>Sınav Günü!</Text>
            <Text style={styles.modalExamName}>{todayExam?.title}</Text>

            {todayExam?.personalNote && (
              <View style={styles.personalNoteBox}>
                <Text style={styles.personalNoteLabel}>Kendine Not:</Text>
                <Text style={styles.personalNote}>{todayExam.personalNote}</Text>
              </View>
            )}

            <View style={styles.motivationalBox}>
              <Text style={styles.motivationalText}>
                {todayExam?.motivationalMessage ||
                  "Hazırlıklısın! Huzurlu ve odaklanmış ol. Sen yaparsın! 💪"}
              </Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={closeExamModal}>
              <Text style={styles.modalButtonText}>Başlayalım 🚀</Text>
            </TouchableOpacity>
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
  scrollContent: {
    padding: spacing.lg,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 2,
    width: 60,
    backgroundColor: colors.primary,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  countdownLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  countdownMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  countdownUnit: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  countdownExamName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  countdownExamCourse: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  examCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examCardLeft: {
    flex: 1,
  },
  examCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  examCardDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  examCardRight: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  examCardCountdown: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  modalExamName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  personalNoteBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
  },
  personalNoteLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  personalNote: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  motivationalBox: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  motivationalText: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  modalButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.background,
    textAlign: 'center',
  },
  // Onboarding styles
  onboardingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  onboardingIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  onboardingTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  onboardingText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 26,
  },
  onboardingButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  onboardingButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
});

export default HomeScreen;
