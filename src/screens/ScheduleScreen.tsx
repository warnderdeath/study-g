import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getSchedule, getCourses } from '../services/storage';
import { ScheduleEntry, Course, DAYS_OF_WEEK } from '../types';

const ScheduleScreen = () => {
  const navigation = useNavigation();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const allSchedule = await getSchedule();
    const allCourses = await getCourses();
    setSchedule(allSchedule);
    setCourses(allCourses);
  };

  const getCourseById = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const getEntriesForDay = (dayIndex: number) => {
    return schedule
      .filter(e => e.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getTypeLabel = (type?: 'lecture' | 'lab' | 'tutorial') => {
    switch (type) {
      case 'lab':
        return 'Lab';
      case 'tutorial':
        return 'Uygulama';
      default:
        return 'Ders';
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView>
        {DAYS_OF_WEEK.map((day, index) => {
          const dayEntries = getEntriesForDay(index);
          return (
            <View key={index} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <Text style={styles.dayCount}>{dayEntries.length} ders</Text>
              </View>

              {dayEntries.length === 0 ? (
                <View style={styles.noCourses}>
                  <Text style={styles.noCoursesText}>Bu gün için ders yok</Text>
                </View>
              ) : (
                dayEntries.map((entry) => {
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
                      <View style={styles.entryTime}>
                        <Text style={styles.startTime}>{entry.startTime}</Text>
                        <Text style={styles.timeSeparator}>-</Text>
                        <Text style={styles.endTime}>{entry.endTime}</Text>
                      </View>
                      <View style={styles.entryDetails}>
                        <View style={styles.entryHeader}>
                          <Text style={styles.courseCode}>{course.code}</Text>
                          <View
                            style={[
                              styles.typeBadge,
                              { backgroundColor: course.color + '30' },
                            ]}
                          >
                            <Text style={[styles.typeBadgeText, { color: course.color }]}>
                              {getTypeLabel(entry.type)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.courseName}>{course.name}</Text>
                        {entry.location && (
                          <Text style={styles.location}>📍 {entry.location}</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>
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
  dayCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  noCourses: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noCoursesText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  scheduleEntry: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    borderLeftWidth: 4,
  },
  entryTime: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTime: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  timeSeparator: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginVertical: 2,
  },
  endTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  entryDetails: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  courseCode: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  courseName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});

export default ScheduleScreen;
