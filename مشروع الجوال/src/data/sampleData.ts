import type { Activity, Appointment, Case, ClientSummary, Document, Task } from "@/types";

const parseDate = (value: string) => new Date(value);

export const fallbackCases: Case[] = [
  {
    id: "CASE-001",
    file_number: "2025-TRD-0192",
    title: "قضية نزاع تجاري",
    client_name: "شركة النور للتجارة",
    client_id: "CLIENT-510",
    case_type: "commercial",
    status: "active",
    priority: "high",
    created_at: parseDate("2025-07-18"),
    updated_at: parseDate("2025-09-24"),
    filing_date: parseDate("2025-07-20"),
    due_date: parseDate("2025-10-05"),
    next_hearing: parseDate("2025-10-05"),
    contract_value: 750000,
    documents: [
      {
        id: "DOC-9001",
        title: "مذكرة الرد النهائية",
        description: "المذكرة الرئيسية المرفوعة إلى المحكمة التجارية.",
        file_name: "trade-dispute-response.pdf",
        file_path: "/storage/documents/trade-dispute-response.pdf",
        file_size: 482394,
        mime_type: "application/pdf",
        category: "pleading",
        case_id: "CASE-001",
        task_id: undefined,
        uploaded_by: "LAWYER-231",
        uploaded_at: "2025-09-20T10:30:00Z",
        is_confidential: false,
        version: 2,
        tags: ["مذكرة", "جلسة"]
      } satisfies Document,
      {
        id: "DOC-9002",
        title: "مرفقات العقود",
        description: "صور من العقود السابقة بين الطرفين.",
        file_name: "contracts-attachments.zip",
        file_path: "/storage/documents/contracts-attachments.zip",
        file_size: 1832394,
        mime_type: "application/zip",
        category: "evidence",
        case_id: "CASE-001",
        task_id: undefined,
        uploaded_by: "PARALEGAL-101",
        uploaded_at: "2025-09-18T08:00:00Z",
        is_confidential: true,
        version: 1,
        tags: ["عقود", "سري"]
      } satisfies Document
    ],
    tasks: [],
    activities: [
      {
        id: "ACT-7001",
        type: "case_updated",
        title: "تحديث الحالة إلى نشطة",
        description: "تم تعيين المحامي الأساسي ومراجعة ملف القضية.",
        caseId: "CASE-001",
        performedBy: "ADMIN-1",
        performedAt: parseDate("2025-08-01"),
        metadata: { status: "active" }
      },
      {
        id: "ACT-7002",
        type: "hearing_scheduled",
        title: "تحديد جلسة استماع",
        description: "تم تحديد موعد جلسة الاستماع بتاريخ 5 أكتوبر 2025.",
        caseId: "CASE-001",
        performedBy: "LAWYER-231",
        performedAt: parseDate("2025-09-15"),
        metadata: { next_hearing: "2025-10-05" }
      }
    ]
  },
  {
    id: "CASE-002",
    file_number: "2025-CORP-0045",
    title: "إستشارة تأسيس شركة",
    client_name: "مؤسسة رؤية المستقبل",
    client_id: "CLIENT-223",
    case_type: "administrative",
    status: "pending",
    priority: "medium",
    created_at: parseDate("2025-08-02"),
    updated_at: parseDate("2025-09-21"),
    filing_date: parseDate("2025-08-02"),
    due_date: parseDate("2025-10-10"),
    next_hearing: undefined,
    contract_value: 320000,
    documents: [
      {
        id: "DOC-9101",
        title: "مسودة عقد التأسيس",
        description: "نسخة محدثة من عقد التأسيس للعميل.",
        file_name: "company-incorporation-draft.docx",
        file_path: "/storage/documents/company-incorporation-draft.docx",
        file_size: 219384,
        mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        category: "contract",
        case_id: "CASE-002",
        task_id: "TASK-1499",
        uploaded_by: "LAWYER-118",
        uploaded_at: "2025-09-12T11:15:00Z",
        is_confidential: false,
        version: 3,
        tags: ["عقد", "تأسيس"]
      } satisfies Document
    ],
    tasks: [],
    activities: [
      {
        id: "ACT-7101",
        type: "case_created",
        title: "فتح القضية",
        description: "تم فتح طلب استشارة لتأسيس الشركة.",
        caseId: "CASE-002",
        performedBy: "CLIENT-223",
        performedAt: parseDate("2025-08-02")
      },
      {
        id: "ACT-7102",
        type: "document_uploaded",
        title: "رفع مسودة العقد",
        description: "قام المحامي برفع المسودة الثالثة للعقد.",
        caseId: "CASE-002",
        performedBy: "LAWYER-118",
        performedAt: parseDate("2025-09-12")
      }
    ]
  },
  {
    id: "CASE-003",
    file_number: "2025-LBR-0081",
    title: "قضية عمالية",
    client_name: "عبدالله الحربي",
    client_id: "CLIENT-119",
    case_type: "labor",
    status: "appealed",
    priority: "urgent",
    created_at: parseDate("2025-05-11"),
    updated_at: parseDate("2025-09-15"),
    filing_date: parseDate("2025-05-12"),
    due_date: parseDate("2025-11-12"),
    next_hearing: parseDate("2025-11-12"),
    contract_value: 95000,
    documents: [
      {
        id: "DOC-9201",
        title: "محضر التفتيش",
        description: "محضر التفتيش الميداني المرفق من وزارة العمل.",
        file_name: "labor-inspection-report.pdf",
        file_path: "/storage/documents/labor-inspection-report.pdf",
        file_size: 402333,
        mime_type: "application/pdf",
        category: "report",
        case_id: "CASE-003",
        task_id: undefined,
        uploaded_by: "LAWYER-201",
        uploaded_at: "2025-08-28T09:20:00Z",
        is_confidential: false,
        version: 1,
        tags: ["تقرير", "عمل"]
      } satisfies Document
    ],
    tasks: [],
    activities: [
      {
        id: "ACT-7201",
        type: "case_updated",
        title: "تحديث للحالة",
        description: "تم رفع القضية إلى الاستئناف بناءً على قرار المحكمة الأولى.",
        caseId: "CASE-003",
        performedBy: "LAWYER-201",
        performedAt: parseDate("2025-07-30"),
        metadata: { status: "appealed" }
      },
      {
        id: "ACT-7202",
        type: "document_uploaded",
        title: "إرفاق محضر التفتيش",
        description: "محضر التفتيش تم إضافته إلى مستندات القضية.",
        caseId: "CASE-003",
        performedBy: "LAWYER-201",
        performedAt: parseDate("2025-08-28")
      }
    ]
  }
];

export const fallbackTasks: Task[] = [
  {
    id: "TASK-1501",
    title: "تحضير مذكرة الرد",
    description: "جمع المستندات الداعمة وتدقيق الصياغة النهائية.",
    caseId: "CASE-001",
    assignedTo: "LAWYER-231",
    assignedBy: "ADMIN-1",
    status: "todo",
    priority: "urgent",
    type: "document",
    dueDate: parseDate("2025-09-29"),
    createdAt: parseDate("2025-09-18"),
    updatedAt: parseDate("2025-09-24"),
    completedAt: undefined,
    documents: [],
    comments: []
  },
  {
    id: "TASK-1499",
    title: "مراجعة عقد التأسيس",
    caseId: "CASE-002",
    assignedTo: "LAWYER-118",
    assignedBy: "ADMIN-1",
    status: "in_progress",
    priority: "high",
    type: "consultation",
    dueDate: parseDate("2025-10-03"),
    createdAt: parseDate("2025-09-10"),
    updatedAt: parseDate("2025-09-22"),
    completedAt: undefined,
    documents: [],
    comments: []
  },
  {
    id: "TASK-1490",
    title: "التواصل مع الخبير",
    caseId: "CASE-003",
    assignedTo: "LAWYER-201",
    assignedBy: "ADMIN-1",
    status: "todo",
    priority: "medium",
    type: "meeting",
    dueDate: parseDate("2025-09-30"),
    createdAt: parseDate("2025-09-01"),
    updatedAt: parseDate("2025-09-15"),
    completedAt: undefined,
    documents: [],
    comments: []
  }
];

export const fallbackClients: ClientSummary[] = [
  {
    id: "CLIENT-510",
    name: "شركة النور للتجارة",
    phone: "+966555123456",
    email: "legal@alnoor.sa",
    activeCases: 2,
    lastInteraction: "2025-09-23",
    preferredChannel: "whatsapp",
    notes: "ينتظر تحديث تقدم القضية التجارية."
  },
  {
    id: "CLIENT-223",
    name: "مؤسسة رؤية المستقبل",
    phone: "+966512345678",
    email: "board@futurevision.sa",
    activeCases: 1,
    lastInteraction: "2025-09-19",
    preferredChannel: "email"
  },
  {
    id: "CLIENT-119",
    name: "عبدالله الحربي",
    phone: "+966544567890",
    email: "abdullah.harbi@example.com",
    activeCases: 1,
    lastInteraction: "2025-09-16",
    preferredChannel: "phone",
    notes: "يحتاج اتصالاً أسبوعياً للتحديث."
  }
];

export const fallbackCaseAppointments: Record<string, Appointment[]> = {
  "CASE-001": [
    {
      id: "APT-5001",
      case_id: "CASE-001",
      title: "جلسة أولية",
      description: "جلسة استماع في المحكمة التجارية لتبادل المذكرات.",
      type: "court_hearing",
      scheduled_at: parseDate("2025-10-05T09:30:00"),
      duration_minutes: 90,
      location: "محكمة الرياض التجارية - الدائرة الثانية",
      attendees: ["LAWYER-231", "CLIENT-510"],
      status: "scheduled",
    priority: "high",
    notes: "الحضور قبل الموعد بنصف ساعة",
    reminders: ["1440", "60"],
    created_by: "ADMIN-1",
    created_at: parseDate("2025-09-12T08:15:00"),
    updated_at: parseDate("2025-09-18T12:00:00")
    } satisfies Appointment
  ],
  "CASE-002": [
    {
      id: "APT-5101",
      case_id: "CASE-002",
      title: "اجتماع مراجعة عقد",
      description: "مراجعة النسخة النهائية من عقد التأسيس مع العميل.",
      type: "client_meeting",
      scheduled_at: parseDate("2025-10-02T14:00:00"),
      duration_minutes: 60,
      location: "مكتب الشركة - قاعة الاجتماعات",
      attendees: ["LAWYER-118", "CLIENT-223"],
      status: "confirmed",
    priority: "medium",
    notes: "إحضار النسخة الورقية من العقد",
    reminders: ["60"],
    created_by: "LAWYER-118",
    created_at: parseDate("2025-09-20T09:00:00"),
    updated_at: parseDate("2025-09-25T11:30:00")
    } satisfies Appointment
  ],
  "CASE-003": [
    {
      id: "APT-5201",
      case_id: "CASE-003",
      title: "جلسة استئناف",
      description: "الاستماع إلى طلب الاستئناف في المحكمة العمالية.",
      type: "court_hearing",
      scheduled_at: parseDate("2025-11-12T10:00:00"),
      duration_minutes: 120,
      location: "المحكمة العمالية - قاعة رقم 3",
      attendees: ["LAWYER-201", "CLIENT-119"],
      status: "scheduled",
    priority: "urgent",
    notes: "التنسيق مع الخبير قبل الموعد بيوم",
    reminders: ["1440", "120"],
    created_by: "LAWYER-201",
    created_at: parseDate("2025-09-05T10:00:00"),
    updated_at: parseDate("2025-09-22T16:45:00")
    } satisfies Appointment
  ]
};
