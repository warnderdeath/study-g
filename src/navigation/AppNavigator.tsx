import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

// Import screens (we'll create these)
import HomeScreen from '../screens/HomeScreen';
import NotesScreen from '../screens/NotesScreen';
import TimerScreen from '../screens/TimerScreen';
import ExamsScreen from '../screens/ExamsScreen';
import StatsScreen from '../screens/StatsScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

export type RootTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Courses: undefined;
  Notes: undefined;
  Timer: undefined;
  Exams: undefined;
  Stats: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{name}</Text>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTitleStyle: {
            color: colors.text,
            fontSize: 18,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Study-G',
            tabBarLabel: 'Ana Sayfa',
            tabBarIcon: ({ focused }) => <TabIcon name="⚡" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{
            title: 'Ders Programı',
            tabBarLabel: 'Program',
            tabBarIcon: ({ focused }) => <TabIcon name="📋" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Courses"
          component={CoursesScreen}
          options={{
            title: 'Derslerim',
            tabBarLabel: 'Dersler',
            tabBarIcon: ({ focused }) => <TabIcon name="📚" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesScreen}
          options={{
            title: 'Notlarım',
            tabBarLabel: 'Notlar',
            tabBarIcon: ({ focused }) => <TabIcon name="📝" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Timer"
          component={TimerScreen}
          options={{
            title: 'Çalışma Saati',
            tabBarLabel: 'Sayaç',
            tabBarIcon: ({ focused }) => <TabIcon name="⏱️" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Exams"
          component={ExamsScreen}
          options={{
            title: 'Sınav Takvimi',
            tabBarLabel: 'Sınavlar',
            tabBarIcon: ({ focused }) => <TabIcon name="📅" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            title: 'İstatistikler',
            tabBarLabel: 'Analiz',
            tabBarIcon: ({ focused }) => <TabIcon name="📊" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

export default AppNavigator;
