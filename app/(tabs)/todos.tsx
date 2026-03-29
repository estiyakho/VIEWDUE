import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState
} from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { FloatingActionButton } from "@/components/floating-action-button";
import { SettingsOptionSheet } from "@/components/settings-option-sheet";
import { TaskFormModal } from "@/components/task-form-modal";
import { TaskItem } from "@/components/task-item";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { TaskStatus } from "@/types/task";
import { runListAnimation } from "@/utils/layout-animation";

const FILTER_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "Doing", value: "todo" },
  { label: "Done", value: "done" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" as const },
  { label: "Oldest First", value: "oldest" as const },
  { label: "Title A-Z", value: "title-asc" as const },
  { label: "Title Z-A", value: "title-desc" as const },
];

type SortMode = (typeof SORT_OPTIONS)[number]["value"];

export default function TodosScreen() {
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const colors = useAppTheme();

  const tasks = useTaskStore((state) => state.tasks);
  const categories = useTaskStore((state) => state.categories);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);

  const initialCategory = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const [activeFilter, setActiveFilter] = useState<TaskStatus>("todo");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);

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

      return right.title.localeCompare(left.title);
    });

    return result;
  }, [activeFilter, query, selectedCategoryId, sortMode, tasks]);

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

  const renderTask = useCallback(
    ({ item }: { item: (typeof filteredTasks)[number] }) => (
      <TaskItem
        task={item}
        category={
          item.categoryId ? categoryMap.get(item.categoryId) : undefined
        }
        timeFormat={timeFormat}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    ),
    [categoryMap, handleDelete, handleToggle, timeFormat],
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={styles.chipText}>All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategoryId(category.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    selectedCategoryId === category.id
                      ? category.color
                      : colors.surfaceMuted,
                  borderColor:
                    selectedCategoryId === category.id
                      ? category.color
                      : colors.border,
                },
              ]}
            >
              <Text style={styles.chipText}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title="Add a Todo"
              description="Create a to do to get started."
            />
          }
          removeClippedSubviews
          renderItem={renderTask}
          showsVerticalScrollIndicator={false}
          windowSize={8}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
        />

        <FloatingActionButton onPress={() => setAddTaskModalVisible(true)} />
      </View>

      <SettingsOptionSheet
        visible={sortSheetVisible}
        title="Sort Todos"
        iconName="swap-vertical-outline"
        options={SORT_OPTIONS}
        selectedValue={sortMode}
        onClose={() => setSortSheetVisible(false)}
        onSelect={setSortMode}
      />

      <TaskFormModal
        visible={addTaskModalVisible}
        initialCategoryId={
          selectedCategoryId !== "all" ? selectedCategoryId : undefined
        }
        onClose={() => setAddTaskModalVisible(false)}
      />
    </SafeAreaView>
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
    maxHeight: 46,
  },
  chipsContent: {
    alignItems: "center",
    gap: 10,
    paddingRight: 12,
  },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    color: "#F8FAFC",
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 92,
    paddingTop: 2,
  },
});
