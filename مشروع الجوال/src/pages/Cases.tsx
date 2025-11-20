import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import AppShell from "@/components/AppShell";
import ListTile from "@/components/ListTile";
import { CaseService } from "@/services/caseService";
import type { Case } from "@/types";
import { fallbackCases } from "@/data/sampleData";

const caseStatusFilters: Array<{ value: Case["status"] | "all"; label: string }> = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشطة" },
  { value: "pending", label: "معلقة" },
  { value: "appealed", label: "قيد الاستئناف" },
  { value: "closed", label: "مغلقة" }
];

const Cases = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>(fallbackCases);
  const [statusFilter, setStatusFilter] = useState<Case["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await CaseService.getCases({ limit: 20 });
        if (response?.data?.length) {
          setCases(response.data);
        }
      } catch (error) {
        console.warn("Falling back to sample cases", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((caseItem) => {
      const matchesFilter = statusFilter === "all" || caseItem.status === statusFilter;
      const matchesSearch =
        !search.trim() ||
        caseItem.title.includes(search) ||
        caseItem.client_name.includes(search) ||
        caseItem.file_number.includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [cases, statusFilter, search]);

  return (
    <AppShell
      header={<MobileHeader title="القضايا" subtitle={loading ? "جاري التحميل" : "جاهزة للمتابعة"} />}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-inner shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/30">
        <input
          type="search"
          placeholder="البحث بالعميل أو رقم القضية"
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as Case["status"] | "all")}
        >
          {caseStatusFilters.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <section className="space-y-3">
        {filteredCases.map((caseItem) => (
          <ListTile
            key={caseItem.id}
            title={caseItem.title}
            subtitle={`العميل: ${caseItem.client_name}`}
            meta={caseItem.file_number}
            footer={`الحالة: ${translateCaseStatus(caseItem.status)} • الموعد القادم: ${formatDate(caseItem.next_hearing)}`}
            onClick={() => navigate(`/cases/${caseItem.id}`)}
          />
        ))}
        {filteredCases.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">لا توجد قضايا مطابقة للبحث الحالي.</p>
        ) : null}
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
      return "قيد الاستئناف";
    case "settled":
      return "منتهية بالصلح";
    case "dismissed":
      return "مرفوضة";
    default:
      return status;
  }
};

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString("ar-SA", {
        month: "short",
        day: "numeric"
      })
    : "غير محدد";

export default Cases;
