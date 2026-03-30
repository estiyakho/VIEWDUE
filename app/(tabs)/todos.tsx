import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";

import { EmptyState } from "@/components/empty-state";
import { VerticalScaleDecorator } from "@/components/vertical-scale-decorator";
import { FloatingActionButton } from "@/components/floating-action-button";
import { SettingsOptionSheet } from "@/components/settings-option-sheet";
import { TaskFormModal } from "@/components/task-form-modal";
import { TaskItem } from "@/components/task-item";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { Task, TaskStatus } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";

const FILTER_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "Doing", value: "todo" },
  { label: "Done", value: "done" },
  { label: "N/A", value: "not-available" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" as const },
  { label: "Oldest First", value: "oldest" as const },
  { label: "Title A-Z", value: "title-asc" as const },
  { label: "Title Z-A", value: "title-desc" as const },
  { label: "Manual", value: "manual" as const },
];

type SortMode = (typeof SORT_OPTIONS)[number]["value"];

export default function TodosScreen() {
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();

  const tasks = useTaskStore((state) => state.tasks);
  const categories = useTaskStore((state) => state.categories);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const setTaskNotAvailable = useTaskStore((state) => state.setTaskNotAvailable);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);

  const initialCategory = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const [activeFilter, setActiveFilter] = useState<TaskStatus>("todo");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [listData, setListData] = useState<Task[]>([]);
  const justDragged = useRef(false);

  useLayoutEffect(() => {
    if (initialCategory) {
      setSelectedCategoryId(initialCategory);
    }
  }, [initialCategory]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = tasks.filter((task) => {
      const matchesStatus = task.status === activeFilter;
      const matchesCategory =
        selectedCategoryId === "all"
          ? true
          : task.categoryId === selectedCategoryId;
      const matchesQuery =
        !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesCategory && matchesQuery;
    });

    result.sort((left, right) => {
      if (sortMode === "newest") {
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      }

      if (sortMode === "oldest") {
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      }

      if (sortMode === "title-asc") {
        return left.title.localeCompare(right.title);
      }

      if (sortMode === "manual") {
        const leftOrder = left.orderIndex ?? new Date(left.createdAt).getTime();
        const rightOrder = right.orderIndex ?? new Date(right.createdAt).getTime();
        return rightOrder - leftOrder;
      }

      return right.title.localeCompare(left.title);
    });

    return result;
  }, [activeFilter, query, selectedCategoryId, sortMode, tasks]);

  useEffect(() => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    setListData(filteredTasks);
  }, [filteredTasks]);

  const categoryMap = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          {
            color: category.color,
            name: category.name,
          },
        ]),
      ),
    [categories],
  );

  const handleDelete = useCallback(
    (id: string) => {
      runListAnimation();
      deleteTask(id);
    },
    [deleteTask],
  );

  const handleToggle = useCallback(
    (id: string) => {
      runListAnimation();
      toggleTaskStatus(id);
    },
    [toggleTaskStatus],
  );

  const handleEdit = useCallback(
    (task: Task) => {
      setEditingTask(task);
    },
    [],
  );

  const handleNotAvailable = useCallback(
    (id: string) => {
      runListAnimation();
      setTaskNotAvailable(id);
    },
    [setTaskNotAvailable],
  );

  const renderTask = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => (
      <View style={{ paddingBottom: 12 }}>
        <VerticalScaleDecorator activeScale={1.03}>
          <TaskItem
            task={item}
            category={
              item.categoryId ? categoryMap.get(item.categoryId) : undefined
            }
            timeFormat={timeFormat}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onNotAvailable={handleNotAvailable}
            onEdit={handleEdit}
            onLongPress={!isActive ? drag : undefined}
          />
        </VerticalScaleDecorator>
      </View>
    ),
    [categoryMap, handleDelete, handleToggle, handleEdit, timeFormat, handleNotAvailable],
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: colors.background }]}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons color={colors.textMuted} name="search-outline" size={24} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search Todo"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
          />
        </View>

        <View style={styles.tabRow}>
          {FILTER_OPTIONS.map((option) => {
            const active = option.value === activeFilter;
            return (
              <Pressable
                key={option.value}
                onPress={() => setActiveFilter(option.value)}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? colors.text : colors.textMuted },
                  ]}
                >
                  {option.label}
                </Text>
                {active ? (
                  <View
                    style={[
                      styles.tabIndicator,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
          <Pressable
            style={styles.filterButton}
            onPress={() => setSortSheetVisible(true)}
          >
            <Ionicons
              name="filter-outline"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsRow}
        >
          <Pressable
            onPress={() => setSelectedCategoryId("all")}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedCategoryId === "all"
                    ? colors.accent
                    : colors.surfaceMuted,
                borderColor:
                  selectedCategoryId === "all" ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: selectedCategoryId === "all" ? (colors.isLight ? '#0F172A' : '#F8FAFC') : colors.textSoft }]}>All</Text>
          </Pressable>
          {categories.filter((c) => !c.isArchived).map((category) => {
            const active = selectedCategoryId === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? category.color : colors.surfaceMuted,
                    borderColor: active ? category.color : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? (colors.isLight ? '#0F172A' : '#F8FAFC') : colors.textSoft }]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <DraggableFlatList
          onDragEnd={({ data }) => {
            justDragged.current = true;
            setListData(data);
            if (sortMode !== 'manual') setSortMode('manual');
            reorderTasks(data.map(t => t.id));
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(92, insets.bottom + 80) }]}
          data={listData}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title={
                activeFilter === "todo" 
                  ? "Add a Todo" 
                  : activeFilter === "done" 
                    ? "Finished Tasks" 
                    : "Not Available"
              }
              description={
                activeFilter === "todo"
                  ? "Create a to do to get started."
                  : activeFilter === "done"
                    ? "Finished tasks will appear here."
                    : "Tasks that are not available today are here."
              }
            />
          }
          renderItem={renderTask}
          showsVerticalScrollIndicator={false}
        />

        <FloatingActionButton onPress={() => setAddTaskModalVisible(true)} />
      </View>

      <SettingsOptionSheet
        visible={sortSheetVisible}
        title="Sort Todos"
        iconName="swap-vertical-outline"
        options={SORT_OPTIONS.filter(o => o.value !== 'manual')}
        selectedValue={sortMode}
        onClose={() => setSortSheetVisible(false)}
        onSelect={setSortMode}
      />

      <TaskFormModal
        visible={addTaskModalVisible || !!editingTask}
        initialTask={editingTask}
        defaultCategoryId={
          selectedCategoryId !== "all" ? selectedCategoryId : undefined
        }
        onClose={() => {
          setAddTaskModalVisible(false);
          setEditingTask(undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  searchBar: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    marginLeft: 10,
  },
  tabRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  tabButton: {
    marginRight: 20,
    paddingBottom: 10,
    position: "relative",
  },
  tabLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 17,
  },
  tabIndicator: {
    borderRadius: 999,
    bottom: 0,
    height: 4,
    left: 0,
    position: "absolute",
    width: 36,
  },
  filterButton: {
    marginLeft: "auto",
    padding: 6,
  },
  chipsRow: {
    marginBottom: 8,
    maxHeight: 50,
  },
  chipsContent: {
    alignItems: "center",
    gap: 10,
    paddingRight: 12,
  },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 42,
    minWidth: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
    includeFontPadding: false,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 2,
  },
});
