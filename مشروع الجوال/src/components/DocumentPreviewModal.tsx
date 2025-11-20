import { useEffect } from "react";
import { CalendarDays, Download, FileText, Shield, Tag, UserRound, X } from "lucide-react";
import type { Document } from "@/types";

interface DocumentPreviewModalProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) {
    return "غير محدد";
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

const normalizeDate = (value?: string | Date) => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const DocumentPreviewModal = ({ document: docItem, open, onClose }: DocumentPreviewModalProps) => {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !docItem) {
    return null;
  }

  const fileSize = formatFileSize(docItem.file_size ?? docItem.fileSize);
  const uploadedAt = normalizeDate(docItem.uploaded_at ?? docItem.uploadedAt);
  const uploadedLabel = uploadedAt
    ? `${uploadedAt.toLocaleDateString("ar-SA", {
        weekday: "short",
        day: "numeric",
        month: "long"
      })}، ${uploadedAt.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit"
      })}`
    : "وقت الرفع غير معروف";
  const uploader = docItem.uploaded_by ?? docItem.uploadedBy ?? "—";
  const fileUrl = docItem.url ?? docItem.file_path ?? docItem.filePath ?? undefined;

  const handleDownload = () => {
    if (!fileUrl) {
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 pb-6 pt-12 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl transition dark:bg-slate-900/95"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{docItem.title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {docItem.description ?? "لا يوجد وصف للمستند."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="إغلاق معاينة المستند"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <span>{docItem.file_name ?? docItem.fileName ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{uploadedLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-slate-400" />
            <span>{uploader}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span>{(docItem.is_confidential ?? docItem.isConfidential) ? "سري" : "عام"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-slate-400" />
            <span>الحجم: {fileSize}</span>
          </div>
        </div>

        {docItem.tags?.length ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {docItem.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <Tag className="h-3 w-3" />#{tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!fileUrl}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            <Download className="h-4 w-4" /> تنزيل المستند
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
