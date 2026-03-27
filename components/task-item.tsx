import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { Task } from '@/types/task';
import { formatTaskDate } from '@/utils/date';

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

function TaskItemComponent({ task, onToggle, onDelete }: TaskItemProps) {
  const colors = useAppTheme();
  const category = useTaskStore((state) => state.categories.find((item) => item.id === task.categoryId));
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);
  const done = task.status === 'done';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <Pressable onPress={() => onToggle(task.id)} style={styles.content}>
        <View style={[styles.checkbox, { borderColor: colors.border }, done && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
          {done ? <Ionicons name="checkmark" size={16} color="#F8FAFC" /> : null}
        </View>
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }, done && { color: colors.textMuted }]}>
            {task.title}
          </Text>
          {task.description ? (
            <Text numberOfLines={2} style={[styles.description, { color: colors.textSoft }]}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {category ? (
              <View style={[styles.badge, { borderColor: colors.border }]}>
                <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={12} color={category.color} />
                <Text style={[styles.badgeText, { color: colors.textMuted }]}>{category.name}</Text>
              </View>
            ) : null}
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {formatTaskDate(task.createdAt, timeFormat)}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable hitSlop={8} onPress={() => onDelete(task.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
    </View>
  );
}

export const TaskItem = memo(TaskItemComponent);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  content: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
    width: 22,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 6,
  },
});
