import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import ListTile from "@/components/ListTile";
import { CaseService } from "@/services/caseService";
import { TaskService } from "@/services/taskService";
import type { Case, Task } from "@/types";
import { fallbackCases, fallbackTasks } from "@/data/sampleData";

const Dashboard = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>(fallbackCases);
  const [tasks, setTasks] = useState<Task[]>(fallbackTasks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [caseResponse, taskResponse] = await Promise.all([
          CaseService.getCases({ limit: 5 }),
          TaskService.getTasks({ limit: 5 })
        ]);

        if (caseResponse?.data?.length) {
          setCases(caseResponse.data);
        }

        if (taskResponse?.data?.length) {
          setTasks(taskResponse.data);
        }
      } catch (error) {
        console.warn("Falling back to local dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const activeCases = cases.filter((c) => c.status === "active").length;
    const urgentTasks = tasks.filter((t) => t.priority === "urgent").length;
    const upcomingHearings = cases.filter((c) => c.next_hearing && c.next_hearing > new Date()).length;
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < new Date() &&
        t.status !== "completed" &&
        t.status !== "archived"
    ).length;

    return {
      totalCases: cases.length,
      activeCases,
      urgentTasks,
      upcomingHearings,
      overdueTasks
    };
  }, [cases, tasks]);

  const recentCases = useMemo(() => cases.slice(0, 3), [cases]);
  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== "completed")
        .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
        .slice(0, 3),
    [tasks]
  );

  const formatDate = (date?: Date) =>
    date
      ? date.toLocaleDateString("ar-SA", {
          month: "short",
          day: "numeric"
        })
      : "غير محدد";

  return (
    <AppShell
      header={
        <MobileHeader
          title="ملخص المكتب"
          subtitle={loading ? "جاري تحميل البيانات" : "آخر تحديث فوري"}
        />
      }
    >
      <section className="grid grid-cols-1 gap-4">
        <StatCard
          title="إجمالي القضايا"
          value={`${stats.totalCases}`}
          trend={`${stats.activeCases} نشطة الآن`}
        />
        <StatCard
          title="مهام عاجلة"
          value={`${stats.urgentTasks}`}
          trend={stats.overdueTasks ? `${stats.overdueTasks} متأخرة` : "لا توجد مهام متأخرة"}
          accent="from-rose-100 to-white dark:from-rose-500/20 dark:to-slate-900"
        />
        <StatCard
          title="جلسات قادمة"
          value={`${stats.upcomingHearings}`}
          trend={stats.upcomingHearings ? "استعد للجلسات القادمة" : "لا توجد جلسات مجدولة"}
          accent="from-emerald-100 to-white dark:from-emerald-500/20 dark:to-slate-900"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">القضايا الحديثة</h2>
        {recentCases.map((caseItem) => (
          <ListTile
            key={caseItem.id}
            title={caseItem.title}
            subtitle={`العميل: ${caseItem.client_name}`}
            meta={formatDate(caseItem.next_hearing)}
            footer={`الحالة: ${translateCaseStatus(caseItem.status)}`}
            onClick={() => navigate(`/cases/${caseItem.id}`)}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">المهام القادمة</h2>
        {upcomingTasks.map((task) => (
          <ListTile
            key={task.id}
            title={task.title}
            subtitle={`القضية: ${task.caseId ?? "غير مرتبطة"}`}
            meta={formatDate(task.dueDate)}
            footer={`الأولوية: ${translatePriority(task.priority)}`}
            onClick={() => console.log("open task", task.id)}
          />
        ))}
      </section>
    </AppShell>
  );
};

const translateCaseStatus = (status: Case["status"]) => {
  switch (status) {
    case "active":
      return "نشطة";
    case "pending":
      return "معلقة";
    case "closed":
      return "مغلقة";
    case "appealed":
      return "مستأنفة";
    case "settled":
      return "منتهية بالصلح";
    case "dismissed":
      return "مرفوضة";
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

export default Dashboard;
