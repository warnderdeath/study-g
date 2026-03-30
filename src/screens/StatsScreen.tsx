import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getSessions, getCourses } from '../services/storage';
import { StudySession, Course } from '../types';
import {
  getDateKey,
  getCurrentWeekDates,
  formatDurationDetailed,
  formatDate,
} from '../utils/dateUtils';

const { width } = Dimensions.get('window');

const StatsScreen = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week'>('today');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allSessions = await getSessions();
    const allCourses = await getCourses();

    // Filter only completed sessions
    const completedSessions = allSessions.filter((s) => !s.isActive && s.duration > 0);

    setSessions(completedSessions);
    setCourses(allCourses);
  };

  const getTodayStats = () => {
    const today = getDateKey(new Date());
    const todaySessions = sessions.filter(
      (s) => getDateKey(s.startTime) === today
    );

    const totalDuration = todaySessions.reduce((acc, s) => acc + s.duration, 0);

    const courseBreakdown: { [key: string]: number } = {};
    todaySessions.forEach((session) => {
      courseBreakdown[session.courseId] =
        (courseBreakdown[session.courseId] || 0) + session.duration;
    });

    return {
      totalDuration,
      sessionCount: todaySessions.length,
      courseBreakdown,
    };
  };

  const getWeekStats = () => {
    const { start, end } = getCurrentWeekDates();
    const weekSessions = sessions.filter((s) => {
      const sessionDate = s.startTime;
      return sessionDate >= start && sessionDate <= end;
    });

    const totalDuration = weekSessions.reduce((acc, s) => acc + s.duration, 0);

    const courseBreakdown: { [key: string]: number } = {};
    weekSessions.forEach((session) => {
      courseBreakdown[session.courseId] =
        (courseBreakdown[session.courseId] || 0) + session.duration;
    });

    // Find top course
    let topCourse = '';
    let maxDuration = 0;
    Object.entries(courseBreakdown).forEach(([courseId, duration]) => {
      if (duration > maxDuration) {
        maxDuration = duration;
        topCourse = courseId;
      }
    });

    return {
      totalDuration,
      sessionCount: weekSessions.length,
      courseBreakdown,
      topCourse,
    };
  };

  const getCourseById = (courseId: string) => {
    return courses.find((c) => c.id === courseId);
  };

  const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}s ${minutes}d`;
    } else if (minutes > 0) {
      return `${minutes}d`;
    } else {
      return `${seconds}sn`;
    }
  };

  const stats = selectedPeriod === 'today' ? getTodayStats() : getWeekStats();

  // Sort courses by duration
  const sortedCourses = Object.entries(stats.courseBreakdown)
    .map(([courseId, duration]) => ({
      course: getCourseById(courseId),
      duration,
    }))
    .filter((item) => item.course)
    .sort((a, b) => b.duration - a.duration);

  const maxDuration = sortedCourses[0]?.duration || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'today' && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod('today')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'today' && styles.periodButtonTextActive,
            ]}
          >
            Bugün
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'week' && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive,
            ]}
          >
            Bu Hafta
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {Math.floor(stats.totalDuration / 3600)}
          </Text>
          <Text style={styles.summaryUnit}>SAAT</Text>
          <Text style={styles.summaryLabel}>Toplam</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{stats.sessionCount}</Text>
          <Text style={styles.summaryUnit}>OTURUM</Text>
          <Text style={styles.summaryLabel}>Çalışma</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{sortedCourses.length}</Text>
          <Text style={styles.summaryUnit}>DERS</Text>
          <Text style={styles.summaryLabel}>Kapsam</Text>
        </View>
      </View>

      {/* Course Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ders Bazlı Analiz</Text>

        {sortedCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedPeriod === 'today'
                ? 'Bugün henüz çalışma kaydı yok'
                : 'Bu hafta henüz çalışma kaydı yok'}
            </Text>
          </View>
        ) : (
          sortedCourses.map(({ course, duration }, index) => {
            if (!course) return null;

            const percentage = (duration / maxDuration) * 100;

            return (
              <View key={course.id} style={styles.courseBar}>
                <View style={styles.courseBarHeader}>
                  <View style={styles.courseBarLeft}>
                    <View
                      style={[
                        styles.courseColorDot,
                        { backgroundColor: course.color },
                      ]}
                    />
                    <Text style={styles.courseBarName}>{course.code}</Text>
                  </View>
                  <Text style={styles.courseBarDuration}>
                    {formatSeconds(duration)}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: course.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Oturumlar</Text>
          {sessions
            .slice(0, 5)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .map((session) => {
              const course = getCourseById(session.courseId);
              if (!course) return null;

              return (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionCardLeft}>
                    <View
                      style={[
                        styles.sessionColorDot,
                        { backgroundColor: course.color },
                      ]}
                    />
                    <View>
                      <Text style={styles.sessionCourseName}>{course.code}</Text>
                      <Text style={styles.sessionDate}>
                        {formatDate(session.startTime, 'dd MMM')} •{' '}
                        {session.startTime.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionCardRight}>
                    <Text style={styles.sessionDuration}>
                      {formatSeconds(session.duration)}
                    </Text>
                    {session.focusMode && (
                      <Text style={styles.focusBadge}>🎯</Text>
                    )}
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {/* Motivational Quote */}
      <View style={styles.quoteBox}>
        <Text style={styles.quoteIcon}>💡</Text>
        <Text style={styles.quoteText}>
          {stats.totalDuration > 0
            ? 'Harika gidiyorsun! Her çalışma seansı seni hedefe bir adım daha yaklaştırıyor.'
            : 'Çalışmaya başlamak için en iyi zaman şimdi!'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.background,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
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
  courseBar: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  courseBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  courseBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  courseBarName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  courseBarDuration: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  sessionCourseName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sessionCardRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  focusBadge: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  quoteBox: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  quoteIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  quoteText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
});

export default StatsScreen;
