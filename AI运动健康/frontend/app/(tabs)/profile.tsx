import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/store';
import { authService, analyticsService } from '@services';
import {
  Settings,
  Crown,
  Award,
  Target,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['achievement-stats'],
    queryFn: () => analyticsService.getDashboard(),
  });

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/auth');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(user?.nickname || user?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.nickname}>{user?.nickname || '健身者'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {user?.subscription?.plan !== 'FREE' && (
          <View style={styles.badge}>
            <Crown size={16} color="#f59e0b" />
            <Text style={styles.badgeText}>高级会员</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Award size={24} color="#10b981" />
          <Text style={styles.statValue}>{stats?.activity?.checkInStreak || 0}</Text>
          <Text style={styles.statLabel}>连续打卡</Text>
        </View>

        <View style={styles.statCard}>
          <Target size={24} color="#3b82f6" />
          <Text style={styles.statValue}>
            {stats?.overview?.currentWeight || '--'}
          </Text>
          <Text style={styles.statLabel}>当前体重</Text>
        </View>

        {user?.subscription?.plan === 'FREE' && (
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/subscription')}
          >
            <Crown size={24} color="#f59e0b" />
            <Text style={styles.statValue}>升级</Text>
            <Text style={styles.statLabel}>会员中心</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/edit')}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemTitle}>个人资料</Text>
            <Text style={styles.menuItemSubtitle}>编辑你的个人信息和目标</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/targets')}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemTitle}>我的目标</Text>
            <Text style={styles.menuItemSubtitle}>查看和调整你的健身目标</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/achievements')}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemTitle}>成就中心</Text>
            <Text style={styles.menuItemSubtitle}>查看你获得的成就</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/subscription')}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemTitle}>订阅管理</Text>
            <Text style={styles.menuItemSubtitle}>管理你的订阅计划</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemTitle}>设置</Text>
            <Text style={styles.menuItemSubtitle}>应用设置和偏好</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  menu: {
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
});
