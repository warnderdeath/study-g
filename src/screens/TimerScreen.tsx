import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import {
  getActiveSession,
  setActiveSession,
  saveSession,
  getCourses,
} from '../services/storage';
import { StudySession, Course } from '../types';
import { formatDuration } from '../utils/dateUtils';

const TimerScreen = () => {
  const navigation = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();

    // Web: Handle page close/refresh when timer is running
    if (Platform.OS === 'web') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isRunning && currentSession) {
          e.preventDefault();
          e.returnValue = 'Sayaç çalışıyor! Sayfayı kapatırsanız çalışma süresi sıfırlanacaktır.';
          return e.returnValue;
        }
      };

      const handleVisibilityChange = async () => {
        if (document.hidden && isRunning && currentSession) {
          // Tab/window closed or minimized while timer running
          // Reset timer
          await setActiveSession(null);
          setIsRunning(false);
          setDuration(0);
          setCurrentSession(null);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        unsubscribe();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [navigation, isRunning, currentSession]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const loadData = async () => {
    const allCourses = await getCourses();
    setCourses(allCourses);

    // Check for active session
    const activeSession = await getActiveSession();
    if (activeSession) {
      setCurrentSession(activeSession);
      setSelectedCourse(allCourses.find(c => c.id === activeSession.courseId) || null);
      setIsRunning(true);
      setFocusMode(activeSession.focusMode);

      // Calculate duration from start time
      const elapsed = Math.floor((Date.now() - activeSession.startTime.getTime()) / 1000);
      setDuration(elapsed);
    }
  };

  const handleStartStop = async () => {
    if (!isRunning) {
      // Start timer
      if (!selectedCourse) {
        Alert.alert('Ders Seçin', 'Lütfen önce bir ders seçin.');
        return;
      }

      const newSession: StudySession = {
        id: Date.now().toString(),
        courseId: selectedCourse.id,
        startTime: new Date(),
        duration: 0,
        isActive: true,
        focusMode: focusMode,
      };

      setCurrentSession(newSession);
      await setActiveSession(newSession);
      setIsRunning(true);
      setDuration(0);
    } else {
      // Stop timer
      if (currentSession) {
        const updatedSession: StudySession = {
          ...currentSession,
          endTime: new Date(),
          duration: duration,
          isActive: false,
        };

        await saveSession(updatedSession);
        await setActiveSession(null);
      }

      setIsRunning(false);
      setDuration(0);
      setCurrentSession(null);
      setSelectedCourse(null);
      setFocusMode(false);

      Alert.alert('Tebrikler!', `${formatDuration(duration)} çalıştınız!`);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      hours: hrs.toString().padStart(2, '0'),
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    };
  };

  const time = formatTime(duration);

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
      {!isRunning && !currentSession ? (
        // Course Selection View
        <View style={styles.selectionView}>
          <Text style={styles.selectionTitle}>Hangi ders için çalışacaksın?</Text>

          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.courseCard,
                  selectedCourse?.id === item.id && styles.courseCardActive,
                  selectedCourse?.id === item.id && { borderColor: item.color },
                ]}
                onPress={() => setSelectedCourse(item)}
              >
                <View
                  style={[styles.courseColorDot, { backgroundColor: item.color }]}
                />
                <Text
                  style={[
                    styles.courseCardCode,
                    selectedCourse?.id === item.id && { color: item.color },
                  ]}
                >
                  {item.code}
                </Text>
                <Text style={styles.courseCardName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.courseList}
          />

          <TouchableOpacity
            style={[styles.focusModeToggle, focusMode && styles.focusModeToggleActive]}
            onPress={() => setFocusMode(!focusMode)}
          >
            <Text style={styles.focusModeIcon}>{focusMode ? '🎯' : '⚡'}</Text>
            <Text style={styles.focusModeText}>Focus Mode</Text>
            {focusMode && <Text style={styles.focusModeStatus}>Aktif</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startButton,
              !selectedCourse && styles.startButtonDisabled,
            ]}
            onPress={handleStartStop}
            disabled={!selectedCourse}
          >
            <Text style={styles.startButtonText}>Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Timer View
        <View style={styles.timerView}>
          {selectedCourse && (
            <View style={styles.courseInfo}>
              <View
                style={[styles.courseInfoDot, { backgroundColor: selectedCourse.color }]}
              />
              <Text style={styles.courseInfoText}>{selectedCourse.name}</Text>
            </View>
          )}

          {focusMode && (
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>🎯 FOCUS MODE</Text>
            </View>
          )}

          <View style={styles.timerDisplay}>
            <View style={styles.timerSegment}>
              <Text style={styles.timerNumber}>{time.hours}</Text>
              <Text style={styles.timerLabel}>SAAT</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerSegment}>
              <Text style={styles.timerNumber}>{time.minutes}</Text>
              <Text style={styles.timerLabel}>DAKİKA</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerSegment}>
              <Text style={styles.timerNumber}>{time.seconds}</Text>
              <Text style={styles.timerLabel}>SANİYE</Text>
            </View>
          </View>

          <View style={styles.timerActions}>
            {isRunning ? (
              <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
                <Text style={styles.actionButtonText}>⏸ Duraklat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                <Text style={styles.actionButtonText}>▶ Devam Et</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.stopButton} onPress={handleStartStop}>
              <Text style={styles.actionButtonText}>⏹ Bitir</Text>
            </TouchableOpacity>
          </View>

          {focusMode && (
            <View style={styles.focusMessage}>
              <Text style={styles.focusMessageText}>
                Odaklanmış kalın! Dikkat dağıtıcı şeylerden uzak durun.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectionView: {
    flex: 1,
    padding: spacing.lg,
  },
  selectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  courseList: {
    paddingBottom: spacing.lg,
  },
  courseCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
    justifyContent: 'center',
  },
  courseCardActive: {
    borderWidth: 3,
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  courseCardCode: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  courseCardName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  focusModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  focusModeToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  focusModeIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  focusModeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  focusModeStatus: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: fontWeight.bold,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  timerView: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  courseInfoDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  courseInfoText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  focusBadge: {
    backgroundColor: colors.primary + '30',
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  focusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  timerSegment: {
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 64,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    lineHeight: 72,
  },
  timerLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  timerColon: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginHorizontal: spacing.sm,
    marginTop: -spacing.lg,
  },
  timerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  stopButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  focusMessage: {
    marginTop: spacing.xl,
    backgroundColor: colors.focusGlow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  focusMessageText: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  goToCoursesButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  goToCoursesButtonText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: fontWeight.bold,
  },
});

export default TimerScreen;
