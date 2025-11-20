import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, Clock3, ListChecks, MoreHorizontal, Play, Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import AppShell from "@/components/AppShell";
import ListTile from "@/components/ListTile";
import { TaskService } from "@/services/taskService";
import { CaseService } from "@/services/caseService";
import type { Case, Task } from "@/types";
import { fallbackCases, fallbackTasks } from "@/data/sampleData";

const statusOptions: Array<{ value: Task["status"] | "all"; label: string }> = [
  { value: "all", label: "كل المهام" },
  { value: "todo", label: "لم تبدأ" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "review", label: "قيد المراجعة" },
  { value: "completed", label: "مكتملة" }
];

const priorityOptions: Array<{ value: Task["priority"]; label: string }> = [
  { value: "urgent", label: "عاجلة" },
  { value: "high", label: "عالية" },
  { value: "medium", label: "متوسطة" },
  { value: "low", label: "منخفضة" }
];

const taskActionItems: Array<{
  status: Task["status"];
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    status: "in_progress",
    label: "بدء التنفيذ",
    description: "تحويل المهمة إلى حالة قيد التنفيذ",
    icon: Play
  },
  {
    status: "review",
    label: "إرسال للمراجعة",
    description: "إعلام الفريق بأن المهمة جاهزة للمراجعة",
    icon: ListChecks
  },
  {
    status: "completed",
    label: "تمييز كمكتملة",
    description: "إنهاء المهمة وتحديث الإحصائيات",
    icon: CheckCircle2
  }
];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(fallbackTasks);
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>(fallbackCases);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCaseId, setNewTaskCaseId] = useState<string>("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const location = useLocation();
  const appliedFocusSignature = useRef<string | null>(null);
  const [showTaskActions, setShowTaskActions] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskActionLoading, setTaskActionLoading] = useState(false);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await TaskService.getTasks({ limit: 25 });
        if (response?.data?.length) {
          setTasks(response.data);
        }
      } catch (error) {
        console.warn("Falling back to sample tasks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await CaseService.getCases({ limit: 50 });
        if (response?.data?.length) {
          setCases(response.data);
        }
      } catch (error) {
        console.warn("Falling back to sample cases for task options", error);
      }
    };

    fetchCases();
  }, []);

  useEffect(() => {
    const focusState = (location.state as { focusCaseId?: string; focusTaskId?: string } | null) ?? null;
    if (!focusState) {
      return;
    }

    const signature = `${focusState.focusCaseId ?? ""}|${focusState.focusTaskId ?? ""}`;
    if (signature === appliedFocusSignature.current) {
      return;
    }

    if (focusState.focusCaseId) {
      setSearch(focusState.focusCaseId);
    }

    if (focusState.focusTaskId) {
      const targetedTask = tasks.find((task) => task.id === focusState.focusTaskId);
      if (targetedTask) {
        setStatusFilter(targetedTask.status);
      }
    }

    appliedFocusSignature.current = signature;
  }, [location.state, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesSearch =
        !search.trim() || task.title.includes(search) || task.caseId?.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, search]);

  const caseLookup = useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((caseItem) => {
      map.set(caseItem.id, caseItem.title);
    });
    return map;
  }, [cases]);

  const resolveCaseLabel = (caseId?: string) => {
    if (!caseId) {
      return "غير مرتبطة";
    }
    return caseLookup.get(caseId) ?? caseId;
  };

  const resetAddTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskCaseId("");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setNewTaskNotes("");
    setCreateError(null);
  };

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTaskTitle.trim()) {
      setCreateError("يجب كتابة عنوان للمهمة الجديدة");
      return;
    }

    const now = new Date();
    const dueDate = newTaskDueDate ? new Date(newTaskDueDate) : undefined;

    const optimisticTask: Task = {
      id: `LOCAL-${now.getTime()}`,
      title: newTaskTitle.trim(),
      description: newTaskNotes.trim() || undefined,
      caseId: newTaskCaseId || undefined,
      assignedTo: "current-user",
      assignedBy: "current-user",
      status: "todo",
      priority: newTaskPriority,
      type: "other",
      dueDate,
      createdAt: now,
      updatedAt: now,
      completedAt: undefined,
      documents: [],
      comments: []
    };

    setTasks((previous) => [optimisticTask, ...previous]);
    resetAddTaskForm();
    setShowAddTask(false);
  };

  const applyTaskStatusLocally = (taskId: string, status: Task["status"]) => {
    let updatedTask: Task | null = null;

    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextTask: Task = {
          ...task,
          status,
          updatedAt: new Date(),
          completedAt: status === "completed" ? new Date() : task.completedAt
        };

        updatedTask = nextTask;
        return nextTask;
      })
    );

    if (updatedTask) {
      setActiveTask(updatedTask);
    }
  };

  const openTaskActions = (task: Task) => {
    setActiveTask(task);
    setTaskActionError(null);
    setShowTaskActions(true);
    setShowAddTask(false);
  };

  const closeTaskActions = () => {
    setShowTaskActions(false);
    setTaskActionError(null);
    setTaskActionLoading(false);
    setActiveTask(null);
  };

  const handleTaskStatusChange = async (status: Task["status"]) => {
    if (!activeTask) {
      return;
    }

    setTaskActionLoading(true);
    setTaskActionError(null);

    applyTaskStatusLocally(activeTask.id, status);

    try {
      const serverTask = await TaskService.updateTaskStatus(activeTask.id, status);
      setTasks((previous) =>
        previous.map((task) => (task.id === serverTask.id ? serverTask : task))
      );
      setActiveTask(serverTask);
      setTaskActionLoading(false);
      closeTaskActions();
    } catch (error) {
      console.warn("Failed to sync task status with server", error);
      setTaskActionError("تعذر الاتصال بالخادم، تم تحديث حالة المهمة محلياً.");
      setTaskActionLoading(false);
    }
  };

  const formatDate = (date?: Date) =>
    date
      ? date.toLocaleDateString("ar-SA", {
          month: "short",
          day: "numeric"
        })
      : "غير محدد";

  return (
    <AppShell
      header={<MobileHeader title="المهام" subtitle={loading ? "يتم التحديث" : "كل شيء محدّث"} />}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-inner shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/30">
        <input
          type="search"
          placeholder="ابحث في المهام"
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as Task["status"] | "all")}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <section className="space-y-3">
        {filteredTasks.map((task) => (
          <ListTile
            key={task.id}
            title={task.title}
            subtitle={`القضية: ${resolveCaseLabel(task.caseId)}`}
            meta={formatDate(task.dueDate)}
            footer={`الحالة: ${translateTaskStatus(task.status)} • الأولوية: ${translatePriority(task.priority)}`}
            onClick={() => openTaskActions(task)}
            trailing={
              <button
                type="button"
                onClick={() => openTaskActions(task)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500"
                aria-label="خيارات المهمة"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          />
        ))}
        {filteredTasks.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">لا توجد مهام مطابقة للبحث الحالي.</p>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => {
          setShowAddTask(true);
          setCreateError(null);
          setShowTaskActions(false);
          setActiveTask(null);
          setTaskActionError(null);
        }}
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-floating transition hover:bg-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-200 dark:hover:bg-brand-400/90 dark:focus:ring-brand-500/40"
        aria-label="إضافة مهمة جديدة"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showAddTask ? (
        <div className="safe-area-padder fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">إضافة مهمة جديدة</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">سجل المهمة واحفظها لمتابعة التقدم.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetAddTaskForm();
                  setShowAddTask(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                aria-label="إغلاق نموذج إضافة المهمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateTask}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="task-title">
                  عنوان المهمة
                </label>
                <input
                  id="task-title"
                  name="title"
                  required
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="مثال: تحضير مذكرة للدعوى"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="task-case">
                    مرتبطة بقضية
                  </label>
                  <select
                    id="task-case"
                    value={newTaskCaseId}
                    onChange={(event) => setNewTaskCaseId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">غير مرتبطة</option>
                    {cases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="task-priority">
                    أولوية المهمة
                  </label>
                  <select
                    id="task-priority"
                    value={newTaskPriority}
                    onChange={(event) => setNewTaskPriority(event.target.value as Task["priority"])}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="task-due-date">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(event) => setNewTaskDueDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="task-notes">
                    ملاحظات سريعة
                  </label>
                  <input
                    id="task-notes"
                    value={newTaskNotes}
                    onChange={(event) => setNewTaskNotes(event.target.value)}
                    placeholder="خطوات أو متطلبات إضافية"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {createError ? (
                <p className="text-sm text-rose-500">{createError}</p>
              ) : (
                <p className="text-xs text-slate-400">
                  سيتم حفظ المهمة داخلياً ويمكن مزامنتها لاحقاً مع النظام الصحي عبر الإنترنت.
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-200 dark:hover:bg-brand-400/90"
              >
                حفظ المهمة
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {showTaskActions && activeTask ? (
        <div className="safe-area-padder fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">التحكم في المهمة</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeTask.title}</p>
              </div>
              <button
                type="button"
                onClick={closeTaskActions}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                aria-label="إغلاق خيارات المهمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock3 className="h-4 w-4" />
              الحالة الحالية: {translateTaskStatus(activeTask.status)}
            </div>

            {taskActionError ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-500/10 dark:text-amber-200">
                {taskActionError}
              </div>
            ) : null}

            <div className="space-y-3">
              {taskActionItems.map((action) => {
                const Icon = action.icon;
                const isCurrent = activeTask.status === action.status;

                return (
                  <button
                    key={action.status}
                    type="button"
                    disabled={taskActionLoading || isCurrent}
                    onClick={() => handleTaskStatusChange(action.status)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-right transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isCurrent
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500/50"
                    } ${taskActionLoading && !isCurrent ? "opacity-70" : ""}`}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isCurrent
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "bg-slate-100 text-brand-600 dark:bg-slate-800/60 dark:text-brand-300"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {action.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-200">الحالة الحالية</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={closeTaskActions}
              className="mt-6 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
};

const translateTaskStatus = (status: Task["status"]) => {
  switch (status) {
    case "todo":
      return "لم تبدأ";
    case "in_progress":
      return "قيد التنفيذ";
    case "review":
      return "قيد المراجعة";
    case "completed":
      return "مكتملة";
    case "cancelled":
      return "ملغاة";
    case "overdue":
      return "متأخرة";
    case "archived":
      return "مؤرشفة";
    default:
      return status;
  }
};

const translatePriority = (priority: Task["priority"]) => {
  switch (priority) {
    case "urgent":
      return "عاجلة";
    case "high":
      return "عالية";
    case "medium":
      return "متوسطة";
    case "low":
      return "منخفضة";
    default:
      return priority;
  }
};

export default Tasks;
