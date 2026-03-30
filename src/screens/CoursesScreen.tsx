import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { getCourses } from '../services/storage';
import { Course } from '../types';

const CoursesScreen = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const allCourses = await getCourses();
    setCourses(allCourses);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.courseCard}>
            <View
              style={[styles.courseColorIndicator, { backgroundColor: item.color }]}
            />
            <View style={styles.courseInfo}>
              <Text style={styles.courseCode}>{item.code}</Text>
              <Text style={styles.courseName}>{item.name}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.coursesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  coursesList: {
    padding: spacing.md,
  },
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseColorIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  courseName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export default CoursesScreen;
