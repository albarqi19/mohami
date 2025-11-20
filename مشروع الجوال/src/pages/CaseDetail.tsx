import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, CalendarDays, ChevronRight, FileText, Landmark, Phone, UserRound } from "lucide-react";
import AppShell from "@/components/AppShell";
import MobileHeader from "@/components/MobileHeader";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import ListTile from "@/components/ListTile";
import DocumentPreviewModal from "@/components/DocumentPreviewModal";
import { CaseService } from "@/services/caseService";
import { TaskService } from "@/services/taskService";
import { ActivityService } from "@/services/activityService";
import { AppointmentService } from "@/services/appointmentService";
import { DocumentService } from "@/services/documentService";
import type { Activity, Appointment, Case, Document, Task } from "@/types";
import { fallbackCaseAppointments, fallbackCases, fallbackTasks } from "@/data/sampleData";

const toDate = (value: Date | string | undefined | null) => {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value : new Date(value);
};

const formatDate = (value?: Date | string) => {
  const date = toDate(value);

  return date
    ? date.toLocaleDateString("ar-SA", {
        weekday: "short",
        day: "numeric",
        month: "long"
      })
    : "غير محدد";
};

const formatDateTime = (value?: Date | string) => {
  const date = toDate(value);

  return date
    ? `${date.toLocaleDateString("ar-SA", {
        weekday: "short",
        day: "numeric",
        month: "long"
      })}، ${date.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit"
      })}`
    : "غير محدد";
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) {
    return "—";
  }

  const units = ["بايت", "ك.ب", "م.ب", "ج.ب"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size % 1 === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

const translateCaseStatus = (status: Case["status"]) => {
  switch (status) {
    case "active":
      return "نشطة";
    case "pending":
      return "معلقة";
    case "appealed":
      return "قيد الاستئناف";
    case "closed":
      return "مغلقة";
    case "settled":
      return "منتهية بالصلح";
    case "dismissed":
      return "مرفوضة";
    default:
      return status;
  }
};

const translatePriority = (priority: Case["priority"] | Task["priority"]) => {
  switch (priority) {
    case "urgent":
      return "عاجلة";
    case "high":
      return "مرتفعة";
    case "medium":
      return "متوسطة";
    case "low":
      return "منخفضة";
    default:
      return priority;
  }
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

const translateCaseType = (type: Case["case_type"]) => {
  switch (type) {
    case "commercial":
      return "تجاري";
    case "civil":
      return "مدني";
    case "criminal":
      return "جنائي";
    case "family":
      return "أحوال شخصية";
    case "labor":
      return "عمالي";
    case "administrative":
      return "إداري";
    case "real_estate":
      return "عقاري";
    case "intellectual_property":
      return "ملكية فكرية";
    case "other":
    default:
      return "أخرى";
  }
};

const translateAppointmentType = (type: Appointment["type"]) => {
  switch (type) {
    case "court_hearing":
      return "جلسة محكمة";
    case "client_meeting":
      return "اجتماع عميل";
    case "team_meeting":
      return "اجتماع فريق";
    case "document_filing":
      return "إيداع مستند";
    case "arbitration":
      return "تحكيم";
    case "consultation":
      return "استشارة";
    case "mediation":
      return "وساطة";
    case "settlement":
      return "تسوية";
    case "other":
    default:
      return "أخرى";
  }
};

const translateAppointmentStatus = (status: Appointment["status"]) => {
  switch (status) {
    case "scheduled":
      return "مجدول";
    case "confirmed":
      return "مؤكد";
    case "in_progress":
      return "قيد التنفيذ";
    case "completed":
      return "مكتمل";
    case "cancelled":
      return "ملغى";
    case "postponed":
      return "مؤجل";
    case "no_show":
      return "لم يحضر";
    default:
      return status;
  }
};

const translateActivityType = (type: Activity["type"]) => {
  switch (type) {
    case "case_created":
      return "فتح القضية";
    case "case_updated":
      return "تحديث القضية";
    case "task_created":
      return "إنشاء مهمة";
    case "task_assigned":
      return "إسناد مهمة";
    case "task_updated":
      return "تحديث المهمة";
    case "task_completed":
      return "إكمال المهمة";
    case "document_uploaded":
      return "رفع مستند";
    case "comment_added":
      return "إضافة تعليق";
    case "hearing_scheduled":
      return "جدولة جلسة";
    case "status_changed":
      return "تغيير الحالة";
    case "user_assigned":
      return "تعيين مستخدم";
    case "client_meeting":
      return "اجتماع عميل";
    case "message_sent":
      return "إرسال رسالة";
    default:
      return "نشاط";
  }
};

const translateMetadataKey = (key: string) => {
  switch (key) {
    case "status":
      return "الحالة";
    case "next_hearing":
      return "الجلسة القادمة";
    case "assigned_to":
      return "المكلف";
    case "priority":
      return "الأولوية";
    default:
      return key;
  }
};

const formatMetadataValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn("تعذر تحويل بيانات التعريف إلى نص", error);
      return String(value);
    }
  }

  return String(value);
};

const getAppointmentStatusClasses = (status: Appointment["status"]) => {
  switch (status) {
    case "confirmed":
    case "completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "in_progress":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200";
    case "cancelled":
    case "no_show":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200";
    case "postponed":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
};

const getPriorityBadgeClasses = (priority: Case["priority"] | Task["priority"]) => {
  switch (priority) {
    case "urgent":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200";
    case "high":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    case "medium":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200";
    case "low":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
};

const normalizeCase = (item: any): Case => ({
  id: item.id,
  file_number: item.file_number ?? item.fileNumber ?? "—",
  title: item.title ?? "قضية بدون اسم",
  client_name: item.client_name ?? item.clientName ?? "عميل غير معروف",
  client_id: item.client_id ?? item.clientId ?? "—",
  client_phone: item.client_phone ?? item.clientPhone,
  client_email: item.client_email ?? item.clientEmail,
  opponent_name: item.opponent_name ?? item.opponentName,
  court: item.court ?? item.court_name ?? undefined,
  case_type: item.case_type ?? item.caseType ?? "other",
  status: item.status ?? "pending",
  priority: item.priority ?? "medium",
  assignedLawyers: item.assignedLawyers ?? item.assigned_lawyers ?? [],
  lawyers: item.lawyers ?? [],
  description: item.description ?? item.summary ?? undefined,
  created_at: toDate(item.created_at ?? item.createdAt) ?? new Date(),
  updated_at: toDate(item.updated_at ?? item.updatedAt) ?? new Date(),
  filing_date: toDate(item.filing_date ?? item.filingDate),
  due_date: toDate(item.due_date ?? item.dueDate),
  next_hearing: toDate(item.next_hearing ?? item.nextHearing),
  contract_value: item.contract_value ?? item.contractValue,
  documents: item.documents ?? [],
  tasks: item.tasks ?? [],
  activities: item.activities ?? []
});

const CaseDetail = () => {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setError("لم يتم العثور على رقم القضية");
      setLoading(false);
      return;
    }

    const fallbackCase = fallbackCases.find((item) => item.id === caseId) ?? null;

    const loadCase = async () => {
      try {
        setLoading(true);
        setError(null);

        const [remoteCase, remoteTasks, remoteDocuments, remoteActivities, remoteAppointments] = await Promise.all([
          CaseService.getCase(caseId).catch(() => null),
          TaskService.getTasks({ case_id: caseId, limit: 25 }).catch(() => null),
          DocumentService.getCaseDocuments(caseId).catch(() => null),
          ActivityService.getCaseActivities(caseId).catch(() => null),
          AppointmentService.getCaseAppointments(caseId).catch(() => null)
        ]);

        const fallbackDocuments = fallbackCase?.documents ?? [];
        const fallbackActivities = fallbackCase?.activities ?? [];
        const fallbackAppointments = fallbackCaseAppointments[caseId] ?? [];

        let resolvedCase: Case | null = null;
        if (remoteCase) {
          const normalizedRemoteCase = normalizeCase(remoteCase);
          resolvedCase = normalizedRemoteCase;
          setCaseItem(normalizedRemoteCase);
        } else if (fallbackCase) {
          resolvedCase = fallbackCase;
          setCaseItem(fallbackCase);
        } else {
          setError("لم يتم العثور على بيانات لهذه القضية");
        }

        if (remoteTasks?.data?.length) {
          setRelatedTasks(remoteTasks.data);
        } else {
          const fallbackRelated = fallbackTasks.filter((task) => task.caseId === caseId);
          setRelatedTasks(fallbackRelated);
        }

        const resolvedDocuments = remoteDocuments?.length
          ? remoteDocuments
          : resolvedCase?.documents?.length
          ? resolvedCase.documents
          : fallbackDocuments;
        setDocuments(resolvedDocuments ?? []);

        const resolvedActivities = remoteActivities?.length
          ? remoteActivities
          : resolvedCase?.activities?.length
          ? resolvedCase.activities
          : fallbackActivities;
        setActivities(resolvedActivities ?? []);

        const resolvedAppointments = remoteAppointments?.length ? remoteAppointments : fallbackAppointments;
        setAppointments(resolvedAppointments ?? []);
      } catch (loadError) {
        console.warn("فشل تحميل تفاصيل القضية", loadError);
        if (fallbackCase) {
          setCaseItem(fallbackCase);
          setRelatedTasks(fallbackTasks.filter((task) => task.caseId === caseId));
          const fallbackAppointments = fallbackCaseAppointments[caseId] ?? [];
          setDocuments(fallbackCase.documents ?? []);
          setActivities(fallbackCase.activities ?? []);
          setAppointments(fallbackAppointments ?? []);
        } else {
          setError("حدث خطأ أثناء تحميل التفاصيل");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = toDate(a.scheduled_at) ?? new Date(8640000000000000);
      const dateB = toDate(b.scheduled_at) ?? new Date(8640000000000000);
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments]);

  const orderedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const dateA = toDate(a.performedAt) ?? new Date(0);
      const dateB = toDate(b.performedAt) ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [activities]);

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDocumentPreviewOpen(true);
  };

  const closeDocumentPreview = () => {
    setIsDocumentPreviewOpen(false);
    setSelectedDocument(null);
  };

  return (
    <AppShell
      header={
        <MobileHeader
          title={caseItem?.title ?? "تفاصيل القضية"}
          subtitle={caseItem ? `رقم الملف: ${caseItem.file_number}` : loading ? "جاري التحميل" : ""}
          leftSlot={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-600"
              aria-label="الرجوع للصفحة السابقة"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          }
          rightSlot={<ThemeToggleButton />}
        />
      }
    >
      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      ) : null}

      {loading && !caseItem ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/40" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/40" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/40" />
        </div>
      ) : null}

      {caseItem ? (
        <>
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
                {translateCaseStatus(caseItem.status)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                أولوية: {translatePriority(caseItem.priority)}
              </span>
              {caseItem.case_type ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  النوع: {translateCaseType(caseItem.case_type)}
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {caseItem.description ?? "لا توجد تفاصيل مضافة لهذه القضية بعد."}
            </p>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/40">
                <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <UserRound className="h-4 w-4" /> العميل
                </dt>
                <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{caseItem.client_name}</dd>
                {caseItem.client_phone ? (
                  <dd className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {caseItem.client_phone}
                  </dd>
                ) : null}
                {caseItem.client_email ? (
                  <dd className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caseItem.client_email}</dd>
                ) : null}
              </div>
              <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/40">
                <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Landmark className="h-4 w-4" /> المحكمة
                </dt>
                <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{caseItem.court ?? "غير محدد"}</dd>
              </div>
              <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/40">
                <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-4 w-4" /> الجلسة القادمة
                </dt>
                <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{formatDate(caseItem.next_hearing)}</dd>
              </div>
              <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-800/40">
                <dt className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <FileText className="h-4 w-4" /> رقم الملف
                </dt>
                <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">{caseItem.file_number}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">المواعيد الرئيسية</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ التقديم</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatDate(caseItem.filing_date)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ الاستحقاق</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatDate(caseItem.due_date)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">مهام القضية</h2>
              <button
                type="button"
                onClick={() => navigate("/tasks", { state: { focusCaseId: caseItem.id } })}
                className="text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
              >
                إدارة المهام
              </button>
            </div>

            {relatedTasks.length ? (
              <div className="space-y-2">
                {relatedTasks.map((task) => {
                  const footerParts = [
                    `الأولوية: ${translatePriority(task.priority)}`,
                    task.assignedTo ? `المكلف: ${task.assignedTo}` : null
                  ].filter(Boolean);

                  return (
                    <ListTile
                      key={task.id}
                      title={task.title}
                      subtitle={`الحالة: ${translateTaskStatus(task.status)}`}
                      meta={task.dueDate ? formatDate(task.dueDate) : "بدون موعد"}
                      footer={footerParts.join(" • ")}
                      onClick={() => navigate("/tasks", { state: { focusTaskId: task.id } })}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد مهام مرتبطة بهذه القضية حالياً.</p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">وثائق القضية</h2>
              {documents.length ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {documents.length} مستند
                </span>
              ) : null}
            </div>

            {documents.length ? (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const subtitle = doc.description ?? doc.file_name ?? doc.fileName ?? "لا يوجد وصف لهذا المستند";
                  const uploadedMeta = formatDateTime(doc.uploaded_at ?? doc.uploadedAt);
                  const uploader = doc.uploaded_by ?? doc.uploadedBy ?? "—";
                  const sizeLabel = formatFileSize(doc.file_size ?? doc.fileSize);
                  const isConfidential = doc.is_confidential ?? doc.isConfidential;
                  const tags = Array.isArray(doc.tags) ? doc.tags : [];

                  return (
                    <ListTile
                      key={doc.id}
                      title={doc.title}
                      subtitle={subtitle}
                      meta={uploadedMeta}
                      footer={
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              الحجم: {sizeLabel}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              الرافع: {uploader}
                            </span>
                            {isConfidential ? (
                              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                                سري
                              </span>
                            ) : null}
                          </div>
                          {tags.length ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-slate-50 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-900/60 dark:text-slate-300"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      }
                      onClick={() => handleDocumentClick(doc)}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد مستندات مرتبطة بهذه القضية حالياً.</p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">مواعيد القضية</h2>
              {sortedAppointments.length ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  أقرب موعد: {formatDateTime(sortedAppointments[0].scheduled_at)}
                </span>
              ) : null}
            </div>

            {sortedAppointments.length ? (
              <div className="space-y-2">
                {sortedAppointments.map((appointment) => {
                  const attendees = appointment.attendees?.length ? appointment.attendees.join("، ") : null;
                  const statusClasses = getAppointmentStatusClasses(appointment.status);
                  const priorityClasses = getPriorityBadgeClasses(appointment.priority);

                  return (
                    <ListTile
                      key={appointment.id}
                      title={appointment.title}
                      subtitle={appointment.description ?? "لا يوجد وصف لهذا الموعد"}
                      meta={formatDateTime(appointment.scheduled_at)}
                      footer={
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              النوع: {translateAppointmentType(appointment.type)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses}`}
                            >
                              {translateAppointmentStatus(appointment.status)}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priorityClasses}`}>
                              أولوية: {translatePriority(appointment.priority)}
                            </span>
                          </div>
                          {appointment.location ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              الموقع: {appointment.location}
                            </p>
                          ) : null}
                          {attendees ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              الحضور: {attendees}
                            </p>
                          ) : null}
                          {appointment.notes ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              ملاحظات: {appointment.notes}
                            </p>
                          ) : null}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد مواعيد مجدولة لهذه القضية.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">سجل الأنشطة</h2>

            {orderedActivities.length ? (
              <div className="relative pr-5">
                <div className="absolute right-1 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                <div className="space-y-4">
                  {orderedActivities.map((activity) => {
                    const metadataEntries = activity.metadata ? Object.entries(activity.metadata) : [];
                    const performer = activity.performedBy ?? "النظام";

                    return (
                      <div key={activity.id} className="relative pr-6">
                        <span className="absolute -right-[6px] top-6 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-slate-900" />
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatDateTime(activity.performedAt)}</span>
                            <span className="font-medium text-slate-600 dark:text-slate-300">{performer}</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">
                            {activity.title ?? translateActivityType(activity.type)}
                          </p>
                          {activity.description ? (
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {activity.description}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              {translateActivityType(activity.type)}
                            </span>
                            {metadataEntries.map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-900/60 dark:text-slate-300"
                              >
                                {translateMetadataKey(key)}: {formatMetadataValue(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">لا يوجد نشاط مسجل لهذه القضية بعد.</p>
            )}
          </section>
        </>
      ) : null}

      <DocumentPreviewModal
        document={selectedDocument}
        open={isDocumentPreviewOpen}
        onClose={closeDocumentPreview}
      />
    </AppShell>
  );
};

export default CaseDetail;
