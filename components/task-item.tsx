import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Task } from '@/types/task';
import { formatTaskDate } from '@/utils/date';

type TaskItemProps = {
  task: Task;
  category?: {
    color: string;
    name: string;
  };
  timeFormat: '12h' | '24h';
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
};

function TaskItemComponent({ task, category, timeFormat, onToggle, onDelete, onEdit }: TaskItemProps) {
  const colors = useAppTheme();
  const done = task.status === 'done';

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
      <View style={styles.leftInteraction}>
        <Pressable 
          hitSlop={12}
          onPress={() => onToggle(task.id)} 
          style={[
            styles.checkbox, 
            { 
              borderColor: done ? colors.accent : colors.border, 
              backgroundColor: done ? colors.accent : colors.surfaceMuted 
            }
          ]}
        >
          {done ? <Ionicons name="checkmark" size={14} color={colors.isLight ? "#0F172A" : "#FFFFFF"} /> : null}
        </Pressable>
        
        <Pressable onPress={() => onEdit?.(task)} style={styles.textBlock}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }, done && { color: colors.textSoft, textDecorationLine: 'line-through' }]}>
            {task.title}
          </Text>
          <View style={styles.metaWrap}>
            {category ? (
              <View style={[styles.badge, { backgroundColor: `${category.color}15`, borderColor: `${category.color}30` }]}>
                <View style={[styles.badgeDot, { backgroundColor: category.color }]} />
                <Text style={[styles.badgeText, { color: colors.isLight ? '#0F172A' : category.color }]}>{category.name}</Text>
              </View>
            ) : null}
            <View style={styles.createdRow}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {formatTaskDate(task.createdAt, timeFormat)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      <View style={styles.rightColumn}>
        <Pressable 
          onPress={() => onDelete(task.id)} 
          style={[styles.deleteButton, { backgroundColor: `${colors.danger}12` }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.countText, { color: colors.textMuted }]}>{done ? '1/1' : '0/1'}</Text>
        </View>
      </View>
    </View>
  );
}

export const TaskItem = memo(TaskItemComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftInteraction: {
    flex: 1,
    flexDirection: 'row',
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    width: 24,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontFamily: AppFonts.semibold,
    fontSize: 17,
    marginBottom: 6,
  },
  metaWrap: {
    gap: 6,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  badgeText: {
    fontFamily: AppFonts.semibold,
    fontSize: 12,
  },
  createdRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  timestamp: {
    fontFamily: AppFonts.medium,
    fontSize: 12,
    marginLeft: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  countPill: {
    borderRadius: 12,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  countText: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
    textAlign: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
