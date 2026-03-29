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
          style={[styles.checkbox, { borderColor: done ? colors.accent : colors.textMuted, backgroundColor: done ? colors.accent : 'transparent' }]}
        >
          {done ? <Ionicons name="checkmark" size={14} color="#F8FAFC" /> : null}
        </Pressable>
        
        <Pressable onPress={() => onEdit?.(task)} style={styles.textBlock}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }, done && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
            {task.title}
          </Text>
          <View style={styles.metaWrap}>
            {category ? (
              <View style={[styles.badge, { backgroundColor: `${category.color}22`, borderColor: `${category.color}44` }]}>
                <View style={[styles.badgeDot, { backgroundColor: category.color }]} />
                <Text style={[styles.badgeText, { color: category.color }]}>{category.name}</Text>
              </View>
            ) : null}
            <View style={styles.createdRow}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                Created: {formatTaskDate(task.createdAt, timeFormat)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      <View style={styles.rightColumn}>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.countText, { color: colors.textMuted }]}>{done ? '1/1' : '0/1'}</Text>
        </View>
        <Pressable 
          onPress={() => onDelete(task.id)} 
          style={[styles.deleteButton, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}30` }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
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
    marginBottom: 10,
    minHeight: 86,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  leftInteraction: {
    flex: 1,
    flexDirection: 'row',
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
    width: 22,
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
    marginLeft: 10,
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
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
