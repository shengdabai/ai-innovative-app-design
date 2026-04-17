import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@services';
import { LineChart } from 'react-native-chart-kit';

export default function AnalyticsScreen() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.getDashboard(),
  });

  const { data: weightChart } = useQuery({
    queryKey: ['weight-chart'],
    queryFn: () => analyticsService.getWeightChart(30),
  });

  const { data: nutritionChart } = useQuery({
    queryKey: ['nutrition-chart'],
    queryFn: () => analyticsService.getNutritionChart(30),
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>数据分析</Text>
      </View>

      {/* 体重趋势 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>体重趋势</Text>
        <View style={styles.chartCard}>
          {weightChart && weightChart.length > 0 ? (
            <LineChart
              data={{
                labels: weightChart.map((d) => d.date.slice(5)),
                datasets: [
                  {
                    data: weightChart.map((d) => d.weight),
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={350}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.emptyText}>暂无数据</Text>
          )}
        </View>
      </View>

      {/* 营养摄入趋势 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>营养摄入趋势</Text>
        <View style={styles.chartCard}>
          {nutritionChart && nutritionChart.length > 0 ? (
            <LineChart
              data={{
                labels: nutritionChart.slice(-7).map((d) => d.date.slice(5)),
                datasets: [
                  {
                    data: nutritionChart.slice(-7).map((d) => d.calories),
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={350}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.emptyText}>暂无数据</Text>
          )}
        </View>
      </View>

      {/* 目标进度 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>目标进度</Text>
        {dashboard && (
          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>体重目标</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(dashboard.progress.weightProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressValue}>
                {dashboard.progress.weightProgress}%
              </Text>
            </View>

            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>运动目标</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(dashboard.progress.workoutProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressValue}>
                {dashboard.progress.workoutProgress}%
              </Text>
            </View>

            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>饮水目标</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(dashboard.progress.waterProgress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressValue}>
                {dashboard.progress.waterProgress}%
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
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
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    padding: 40,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressValue: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});
