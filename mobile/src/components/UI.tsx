import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, NeuShadow } from '../theme/tokens';

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  glow?: 'red' | 'green' | 'beige' | 'none';
};

export function GlassCard({ children, style, padding = Spacing.lg, glow = 'none' }: GlassCardProps) {
  const glowColor = glow === 'red' ? Colors.redGlow : glow === 'green' ? Colors.greenLight : glow === 'beige' ? Colors.beigeLight : 'transparent';
  return (
    <View style={[styles.card, { padding }, glow !== 'none' && { shadowColor: glowColor, shadowOpacity: 0.4, shadowRadius: 16 }, style]}>
      {children}
    </View>
  );
}

type RiskBadgeProps = {
  level: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
};

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
  const color = level === 'HIGH' || level === 'CRITICAL' ? Colors.red
    : level === 'MODERATE' ? Colors.orange
    : Colors.green;
  const labelColor = level === 'HIGH' || level === 'CRITICAL' ? '#ff6b6b'
    : level === 'MODERATE' ? '#ffd93d'
    : '#6bff6b';
  const fontSize = size === 'sm' ? FontSize.xs : size === 'lg' ? FontSize.lg : FontSize.sm;

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <View style={[styles.badgeDot, { backgroundColor: labelColor }]} />
      <Text style={[styles.badgeText, { color: labelColor, fontSize }]}>{level}</Text>
      {score !== undefined && (
        <Text style={[styles.badgeScore, { color: labelColor, fontSize: fontSize - 1 }]}>{Math.round(score * 100)}%</Text>
      )}
    </View>
  );
}

type NeuButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
};

export function NeuButton({ title, onPress, variant = 'primary', size = 'md', icon, disabled, style }: NeuButtonProps) {
  const bg = variant === 'primary' ? Colors.red : variant === 'danger' ? '#8b0000' : 'transparent';
  const border = variant === 'primary' ? Colors.red : variant === 'danger' ? '#8b000060' : Colors.glassBorder;
  const textColor = variant === 'secondary' ? Colors.text : '#fff';
  const btnHeight = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <View style={[styles.btn, { backgroundColor: bg, borderColor: border, height: btnHeight }, disabled && { opacity: 0.4 }, NeuShadow.sm, style]}>
      <Text style={[styles.btnText, { color: textColor, fontSize: size === 'sm' ? FontSize.sm : FontSize.md }]} onPress={disabled ? undefined : onPress}>
        {icon} {title}
      </Text>
    </View>
  );
}

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
};

export function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconWrap}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
};

export function StatCard({ label, value, icon, color = Colors.red }: StatCardProps) {
  return (
    <View style={[styles.statCard, NeuShadow.sm]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...NeuShadow.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeScore: {
    opacity: 0.7,
    marginLeft: 2,
  },
  btn: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
  },
  btnText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 90,
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800',
  },
  statLabel: {
    color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
