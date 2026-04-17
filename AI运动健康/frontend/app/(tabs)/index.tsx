import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/store';
import { analyticsService } from '@services';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Target,
  Droplets,
  Award,
  Plus,
  Camera,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.getDashboard(),
    refetchInterval: 60000, // 每分钟刷新
  });

  const today = format(new Date(), 'M月d日 EEEE', { locale: zhCN });

  const WeightTrendIcon = dashboard?.overview.weightTrend === 'up'
    ? TrendingUp
    : dashboard?.overview.weightTrend === 'down'
    ? TrendingDown
    : Minus;

  const trendColor = dashboard?.overview.weightTrend === 'down' ? '#10b981' : '#ef4444';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>你好，{user?.nickname || '健身者'}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => router.push('/(tabs)/profile')}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(user?.nickname || user?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 快速操作卡片 */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/diet/record')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#10b981' }]}>
            <Camera size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>记录饮食</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/analytics/weight')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
            <Target size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>记录体重</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/analytics/workout')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#f59e0b' }]}>
            <Flame size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>记录运动</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/menu/plans')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#8b5cf6' }]}>
            <Plus size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>生成菜单</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      ) : dashboard ? (
        <>
          {/* 今日概览 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>今日概览</Text>

            <View style={styles.card}>
              {/* 热量进度 */}
              <View style={styles.progressRow}>
                <View style={styles.progressInfo}>
                  <Flame size={20} color="#f59e0b" />
                  <Text style={styles.progressLabel}>热量</Text>
                </View>
                <Text style={styles.progressValue}>
                  {dashboard.nutrition.todayCalories} / {dashboard.nutrition.targetCalories}
                  <Text style={styles.progressUnit}> kcal</Text>
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(dashboard.progress.calorieProgress, 100)}%`,
                      backgroundColor:
                        dashboard.progress.calorieProgress > 100 ? '#ef4444' : '#10b981',
                    },
                  ]}
                />
              </View>

              {/* 蛋白质 */}
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>蛋白质</Text>
                  <Text style={styles.macroValue}>
                    {dashboard.nutrition.todayProtein}
                    <Text style={styles.macroUnit}>g</Text>
                  </Text>
                  <View style={styles.macroBar}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(dashboard.progress.calorieProgress, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>碳水</Text>
                  <Text style={styles.macroValue}>
                    {dashboard.nutrition.todayCarbs}
                    <Text style={styles.macroUnit}>g</Text>
                  </Text>
                  <View style={styles.macroBar}>
                    <View
                      style={[
                        styles.macroBarFill,
                        { backgroundColor: '#3b82f6', width: '70%' },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>脂肪</Text>
                  <Text style={styles.macroValue}>
                    {dashboard.nutrition.todayFat}
                    <Text style={styles.macroUnit}>g</Text>
                  </Text>
                  <View style={styles.macroBar}>
                    <View
                      style={[
                        styles.macroBarFill,
                        { backgroundColor: '#f59e0b', width: '50%' },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 体重卡片 */}
          {dashboard.overview.currentWeight && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>体重追踪</Text>
              <View style={styles.card}>
                <View style={styles.weightRow}>
                  <View>
                    <Text style={styles.weightLabel}>当前体重</Text>
                    <Text style={styles.weightValue}>
                      {dashboard.overview.currentWeight}
                      <Text style={styles.weightUnit}> kg</Text>
                    </Text>
                  </View>
                  <View style={styles.weightChange}>
                    <WeightTrendIcon size={20} color={trendColor} />
                    <Text style={[styles.weightChangeText, { color: trendColor }]}>
                      {dashboard.overview.weightChange > 0 ? '+' : ''}
                      {dashboard.overview.weightChange} kg
                    </Text>
                    <Text style={styles.weightChangeLabel}>本周</Text>
                  </View>
                </View>
                {dashboard.overview.targetWeight && (
                  <View style={styles.goalRow}>
                    <Target size={16} color="#6b7280" />
                    <Text style={styles.goalText}>
                      目标: {dashboard.overview.targetWeight} kg
                      {dashboard.overview.daysToGoal && (
                        <Text style={styles.goalDays}>
                          {' · 预计 {dashboard.overview.daysToGoal} 天达成'}
                        </Text>
                      )}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 活动统计 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>活动统计</Text>
            <View style={styles.activityGrid}>
              <View style={styles.activityCard}>
                <Award size={24} color="#10b981" />
                <Text style={styles.activityValue}>{dashboard.activity.checkInStreak}</Text>
                <Text style={styles.activityLabel}>连续打卡(天)</Text>
              </View>

              <View style={styles.activityCard}>
                <UtensilsCrossed size={24} color="#3b82f6" />
                <Text style={styles.activityValue}>{dashboard.activity.mealsThisWeek}</Text>
                <Text style={styles.activityLabel}>本周记录(餐)</Text>
              </View>

              <View style={styles.activityCard}>
                <Dumbbell size={24} color="#f59e0b" />
                <Text style={styles.activityValue}>{dashboard.activity.workoutsThisWeek}</Text>
                <Text style={styles.activityLabel}>本周运动(次)</Text>
              </View>

              <View style={styles.activityCard}>
                <Droplets size={24} color="#06b6d4" />
                <Text style={styles.activityValue}>
                  {Math.round((dashboard.activity.waterToday / dashboard.activity.waterGoal) * 100)}
                  %
                </Text>
                <Text style={styles.activityLabel}>饮水目标</Text>
              </View>
            </View>
          </View>
        </>
      ) : null}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginTop: 1,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 'normal',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  macroUnit: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'normal',
  },
  macroBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  weightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  weightUnit: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'normal',
  },
  weightChange: {
    alignItems: 'flex-end',
  },
  weightChangeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weightChangeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalText: {
    fontSize: 14,
    color: '#6b7280',
  },
  goalDays: {
    color: '#10b981',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: (width - 52) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
