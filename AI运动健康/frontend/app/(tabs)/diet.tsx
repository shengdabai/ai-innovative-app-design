import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { dietService } from '@services';
import { format } from 'date-fns';
import { Camera, Plus } from 'lucide-react-native';

export default function DietScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todaySummary } = useQuery({
    queryKey: ['diet-summary', today],
    queryFn: () => dietService.getTodaySummary(),
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>饮食记录</Text>
      </View>

      {/* 今日概览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日摄入</Text>
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesValue}>
            {todaySummary?.total?.calories || 0}
          </Text>
          <Text style={styles.caloriesLabel}>kcal</Text>
          {todaySummary?.targets && (
            <Text style={styles.caloriesTarget}>
              目标: {todaySummary.targets.calories} kcal
            </Text>
          )}
        </View>
      </View>

      {/* 餐次记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>餐次记录</Text>

        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => router.push('/diet/record?type=BREAKFAST')}
        >
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>早餐</Text>
            <Text style={styles.mealCalories}>
              {todaySummary?.meals?.breakfast?.calories || 0} kcal
            </Text>
          </View>
          <View style={styles.mealMacros}>
            <Text style={styles.macroText}>
              蛋白质: {todaySummary?.meals?.breakfast?.protein || 0}g
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => router.push('/diet/record?type=LUNCH')}
        >
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>午餐</Text>
            <Text style={styles.mealCalories}>
              {todaySummary?.meals?.lunch?.calories || 0} kcal
            </Text>
          </View>
          <View style={styles.mealMacros}>
            <Text style={styles.macroText}>
              蛋白质: {todaySummary?.meals?.lunch?.protein || 0}g
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => router.push('/diet/record?type=DINNER')}
        >
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>晚餐</Text>
            <Text style={styles.mealCalories}>
              {todaySummary?.meals?.dinner?.calories || 0} kcal
            </Text>
          </View>
          <View style={styles.mealMacros}>
            <Text style={styles.macroText}>
              蛋白质: {todaySummary?.meals?.dinner?.protein || 0}g
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => router.push('/diet/record?type=SNACK')}
        >
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>加餐</Text>
            <Text style={styles.mealCalories}>
              {todaySummary?.meals?.snack?.calories || 0} kcal
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 浮动按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/diet/record')}
      >
        <Camera size={24} color="#ffffff" />
      </TouchableOpacity>
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
  caloriesCard: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  caloriesTarget: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 8,
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  mealCalories: {
    fontSize: 14,
    color: '#6b7280',
  },
  mealMacros: {
    gap: 4,
  },
  macroText: {
    fontSize: 12,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
