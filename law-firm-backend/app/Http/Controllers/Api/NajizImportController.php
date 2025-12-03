<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseModel;
use App\Models\CaseParty;
use App\Models\CaseSession;
use App\Models\Appointment;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class NajizImportController extends Controller
{
    /**
     * استيراد قضايا من ناجز
     */
    public function importCases(Request $request)
    {
        try {
            $cases = $request->input('cases', []);
            
            if (empty($cases)) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا توجد قضايا للاستيراد'
                ], 400);
            }
            
            $imported = 0;
            $updated = 0;
            $errors = [];
            
            DB::beginTransaction();
            
            foreach ($cases as $index => $caseData) {
                try {
                    $result = $this->processSingleCase($caseData);
                    if ($result['action'] === 'imported') {
                        $imported++;
                    } elseif ($result['action'] === 'updated') {
                        $updated++;
                    } elseif ($result['action'] === 'error') {
                        $errors[] = $result['error'];
                    }
                    
                    // Log progress every 50 cases
                    $progress = $index + 1;
                    $total = count($cases);
                    if ($progress % 50 === 0) {
                        Log::info("Najiz import progress: {$progress}/{$total}");
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'file_number' => $caseData['file_number'] ?? 'غير معروف',
                        'error' => $e->getMessage()
                    ];
                    Log::error('Error importing case from Najiz', [
                        'data' => $caseData,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }
            
            DB::commit();
            
            Log::info('Najiz import completed', [
                'imported' => $imported,
                'updated' => $updated,
                'errors_count' => count($errors)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'تم استيراد القضايا بنجاح',
                'data' => [
                    'imported' => $imported,
                    'updated' => $updated,
                    'errors' => $errors,
                    'total_received' => count($cases),
                    'errors_count' => count($errors)
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in batch import from Najiz', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الاستيراد',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * معالجة قضية واحدة
     */
    private function processSingleCase(array $caseData): array
    {
        // التحقق من وجود file_number صالح
        $fileNumber = $caseData['file_number'] ?? null;
        $najizId = $caseData['najiz_id'] ?? null;
        
        // تجاهل القضايا بدون رقم قضية
        if (empty($fileNumber) || $fileNumber === 'unknown' || $fileNumber === 'null') {
            Log::warning('Skipping case without valid file_number', [
                'najiz_id' => $najizId,
                'raw_data' => $caseData
            ]);
            return ['action' => 'error', 'error' => [
                'file_number' => 'غير موجود',
                'najiz_id' => $najizId,
                'error' => 'لا يوجد رقم قضية صالح'
            ]];
        }
        
        // التحقق من وجود القضية مسبقاً
        $existingCase = null;
        if (!empty($najizId)) {
            $existingCase = CaseModel::where('najiz_id', $najizId)->first();
        }
        if (!$existingCase && !empty($fileNumber)) {
            $existingCase = CaseModel::where('file_number', $fileNumber)->first();
        }
        
        // استخراج أسماء الأطراف
        $plaintiffName = $this->cleanName($caseData['plaintiff_name'] ?? null);
        $defendantName = $this->cleanName($caseData['defendant_name'] ?? null);
        $plaintiffId = $caseData['plaintiff_id'] ?? null;
        $defendantId = $caseData['defendant_id'] ?? null;
        
        // محاولة استخراج من الأطراف
        if (isset($caseData['parties']) && is_array($caseData['parties'])) {
            foreach ($caseData['parties'] as $party) {
                $partyRole = $party['role'] ?? '';
                if (in_array($partyRole, ['مدعي', 'المدعي']) && empty($plaintiffName)) {
                    $plaintiffName = $this->cleanName($party['name'] ?? null);
                    $plaintiffId = $party['national_id'] ?? $party['commercial_reg'] ?? null;
                }
                if (in_array($partyRole, ['مدعى عليه', 'المدعى عليه']) && empty($defendantName)) {
                    $defendantName = $this->cleanName($party['name'] ?? null);
                    $defendantId = $party['national_id'] ?? $party['commercial_reg'] ?? null;
                }
            }
        }
        
        // بناء العنوان
        $title = $caseData['title'] ?? null;
        if (empty($title)) {
            $caseType = $caseData['case_type_arabic'] ?? $caseData['case_category'] ?? '';
            $title = "قضية {$caseType} - {$fileNumber}";
        }
        
        // الجلسة القادمة
        $nextHearing = $caseData['next_hearing'] ?? null;
        $nextHearingTime = $caseData['next_hearing_time'] ?? null;
        $nextHearingType = $caseData['next_hearing_type'] ?? null;
        $hearingMethod = $caseData['hearing_method'] ?? null;
        
        if (isset($caseData['sessions']) && is_array($caseData['sessions'])) {
            foreach ($caseData['sessions'] as $session) {
                if (in_array($session['status'] ?? '', ['جديدة', 'new', 'scheduled'])) {
                    $nextHearing = $session['date'] ?? $nextHearing;
                    $nextHearingTime = $session['time'] ?? $nextHearingTime;
                    $nextHearingType = $session['type'] ?? $nextHearingType;
                    $hearingMethod = $session['method'] ?? $hearingMethod;
                    break;
                }
            }
        }
        
        // تخزين البيانات الإضافية كـ JSON
        $additionalData = [
            'parties' => $caseData['parties'] ?? null,
            'sessions' => $caseData['sessions'] ?? null,
            'lawyers' => $caseData['lawyers'] ?? null,
            'raw_data' => $caseData,
        ];
        
        // البيانات الأساسية للقضية
        $caseFields = [
            'title' => $title,
            'court' => $caseData['court'] ?? null,
            'department' => $caseData['department'] ?? null,
            'sub_circle' => $caseData['sub_circle'] ?? null,
            'case_type' => $caseData['case_type'] ?? 'other',
            'case_type_arabic' => $caseData['case_type_arabic'] ?? $caseData['case_type'] ?? null,
            'case_category' => $caseData['case_category'] ?? null,
            'case_classification' => $caseData['case_classification'] ?? null,
            'status' => $this->mapStatus($caseData['status'] ?? 'pending'),
            'najiz_status' => $caseData['status'] ?? null, // الحالة الأصلية من ناجز
            'client_name' => $plaintiffName ?? 'عميل ناجز',
            'plaintiff_name' => $plaintiffName,
            'plaintiff_id' => $plaintiffId,
            'opponent_name' => $defendantName,
            'defendant_name' => $defendantName,
            'defendant_id' => $defendantId,
            'case_subject' => $caseData['case_subject'] ?? null,
            'case_demands' => $caseData['case_demands'] ?? null,
            'case_proofs' => $caseData['case_proofs'] ?? null,
            'plaintiff_requests' => $caseData['plaintiff_requests'] ?? null,
            'case_evidence' => $caseData['case_evidence'] ?? null,
            'case_date_hijri' => $caseData['case_date_hijri'] ?? null,
            'filing_date' => $caseData['filing_date'] ?? null,
            'next_hearing' => $nextHearing,
            'next_hearing_time' => $nextHearingTime,
            'next_hearing_type' => $nextHearingType,
            'hearing_method' => $hearingMethod,
            'najiz_url' => $caseData['najiz_url'] ?? null,
            'najiz_data' => json_encode($additionalData),
            'najiz_synced_at' => now(),
            'source' => 'najiz',
        ];
        
        if ($existingCase) {
            // تحديث القضية الموجودة
            $existingCase->update($caseFields);
            $case = $existingCase;
            $action = 'updated';
        } else {
            // إنشاء قضية جديدة
            $caseFields['file_number'] = $fileNumber;
            $caseFields['najiz_id'] = $najizId;
            $caseFields['client_id'] = $caseData['client_id'] ?? 0;
            $caseFields['priority'] = 'medium';
            $caseFields['created_by'] = 1;
            
            $case = CaseModel::create($caseFields);
            $action = 'imported';
        }
        
        // حفظ الأطراف
        if (isset($caseData['parties']) && is_array($caseData['parties'])) {
            $this->saveParties($case, $caseData['parties']);
        }
        
        // حفظ الجلسات
        if (isset($caseData['sessions']) && is_array($caseData['sessions'])) {
            $this->saveSessions($case, $caseData['sessions']);
        }
        
        Log::info('Successfully processed case', [
            'file_number' => $fileNumber,
            'najiz_id' => $najizId,
            'action' => $action
        ]);
        
        return ['action' => $action, 'case' => $case];
    }

    /**
     * حفظ أطراف القضية
     */
    private function saveParties(CaseModel $case, array $parties): void
    {
        try {
            // حذف الأطراف القديمة
            CaseParty::where('case_id', $case->id)->delete();
            
            $savedCount = 0;
            foreach ($parties as $party) {
                if (empty($party['name'])) continue;
                
                CaseParty::create([
                    'case_id' => $case->id,
                    'name' => $party['name'],
                    'role' => $party['role'] ?? 'unknown',
                    'side' => $party['side'] ?? ($this->isPlaintiffRole($party['role'] ?? '') ? 'plaintiff' : 'defendant'),
                    'national_id' => $party['id_number'] ?? $party['national_id'] ?? null,
                    'commercial_reg' => $party['commercial_reg'] ?? null,
                    'nationality' => $party['nationality'] ?? null,
                    'party_type' => $party['party_type'] ?? null,
                    'represents' => $party['represents'] ?? null,
                ]);
                $savedCount++;
            }
            
            if ($savedCount > 0) {
                Log::info("Saved {$savedCount} parties for case {$case->id}");
            }
        } catch (\Exception $e) {
            Log::error("Error saving parties for case {$case->id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * حفظ جلسات القضية
     */
    private function saveSessions(CaseModel $case, array $sessions): void
    {
        // حذف الجلسات القديمة أولاً
        $deletedCount = CaseSession::where('case_id', $case->id)->delete();
        Log::info("Deleted {$deletedCount} old sessions for case {$case->id}");
        
        foreach ($sessions as $session) {
            try {
                $sessionDate = $session['date'] ?? null;
                $sessionTime = $session['time'] ?? null;
                
                // استخدام الحالة من ناجز أولاً، ثم التحديد بناءً على التاريخ
                $najizStatus = $session['status'] ?? '';
                $status = 'scheduled';
                
                // تحويل حالة الجلسة من ناجز
                if (!empty($najizStatus)) {
                    $najizStatusLower = mb_strtolower(trim($najizStatus));
                    if (str_contains($najizStatusLower, 'منعقدة') || 
                        str_contains($najizStatusLower, 'منتهية') || 
                        str_contains($najizStatusLower, 'مكتملة') ||
                        str_contains($najizStatusLower, 'completed') ||
                        str_contains($najizStatusLower, 'تمت')) {
                        $status = 'completed';
                    } elseif (str_contains($najizStatusLower, 'ملغية') || 
                              str_contains($najizStatusLower, 'cancelled')) {
                        $status = 'cancelled';
                    } elseif (str_contains($najizStatusLower, 'مؤجلة') || 
                              str_contains($najizStatusLower, 'postponed')) {
                        $status = 'postponed';
                    }
                }
                
                // إذا لم نحصل على الحالة من ناجز، نحددها بناءً على التاريخ
                if ($status === 'scheduled' && $sessionDate) {
                    $sessionDateTime = strtotime($sessionDate);
                    $now = time();
                    if ($sessionDateTime < $now) {
                        $status = 'completed'; // جلسة منتهية بناءً على التاريخ
                    }
                }
                
                $caseSession = CaseSession::create([
                    'case_id' => $case->id,
                    'session_type' => $session['type'] ?? null,
                    'session_date' => $sessionDate,
                    'session_time' => $sessionTime,
                    'status' => $status,
                    'najiz_status' => $najizStatus, // حفظ الحالة الأصلية من ناجز
                    'court' => $session['court'] ?? $case->court,
                    'department' => $session['department'] ?? $case->department,
                    'method' => $session['method'] ?? null,
                    'degree' => $session['degree'] ?? null,
                    'location' => $session['location'] ?? null,
                    'session_number' => $session['session_number'] ?? null,
                    'result' => $session['result'] ?? null,
                ]);
                
                // إنشاء موعد للجلسة إذا كانت مستقبلية
                if ($sessionDate && $status === 'scheduled') {
                    $this->createAppointmentForSession($case, $session, $sessionDate);
                }
            } catch (\Exception $e) {
                Log::warning("Error saving session for case {$case->id}: " . $e->getMessage());
                continue;
            }
        }
    }
    
    /**
     * إنشاء موعد للجلسة
     */
    private function createAppointmentForSession(CaseModel $case, array $session, string $sessionDate): void
    {
        try {
            // التحقق من عدم وجود موعد مكرر
            $existingAppointment = Appointment::where('case_id', $case->id)
                ->where('date', $sessionDate)
                ->where('type', 'hearing')
                ->first();
            
            if ($existingAppointment) return;
            
            $sessionTime = $session['time'] ?? '09:00';
            $sessionType = $session['type'] ?? 'جلسة';
            
            Appointment::create([
                'title' => "جلسة: {$case->case_type} - {$case->case_number}",
                'description' => "جلسة {$sessionType} - {$case->court}",
                'date' => $sessionDate,
                'time' => $sessionTime,
                'type' => 'hearing',
                'case_id' => $case->id,
                'status' => 'scheduled',
                'location' => $case->court,
                'notes' => "تم استيراد الموعد من ناجز - نوع الجلسة: {$sessionType}"
            ]);
            
            Log::info('Created appointment for session', [
                'case_id' => $case->id,
                'date' => $sessionDate,
                'time' => $sessionTime
            ]);
        } catch (\Exception $e) {
            Log::warning('Could not create appointment for session', [
                'case_id' => $case->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * تنظيف الاسم
     */
    private function cleanName(?string $name): ?string
    {
        if (!$name) return null;
        $name = trim(preg_replace('/\.{3,}$/', '', $name));
        return strlen($name) >= 3 ? $name : null;
    }

    /**
     * تحديد إذا كان الدور مدعي
     */
    private function isPlaintiffRole(string $role): bool
    {
        return in_array($role, ['المدعي', 'مدعي', 'محامي', 'محامى']);
    }

    /**
     * تحويل حالة ناجز للحالة المحلية
     */
    private function mapStatus(string $status): string
    {
        $statusLower = mb_strtolower(trim($status));
        
        // قائمة شاملة بجميع حالات ناجز المحتملة
        $closedStatuses = [
            'منتهية', 'مغلقة', 'closed', 'completed', 'finished', 'ended',
            'مقفلة', 'محكومة', 'صدر فيها حكم', 'منتهية بحكم',
            'تم الحكم', 'مفصولة', 'انتهت'
        ];
        
        $activeStatuses = [
            'نشطة', 'active', 'جارية', 'قائمة', 'مفعلة'
        ];
        
        $pendingStatuses = [
            'قيد النظر', 'pending', 'جديدة', 'new', 'قيد الإجراء',
            'تحت النظر', 'معلقة', 'بانتظار'
        ];
        
        foreach ($closedStatuses as $closed) {
            if (str_contains($statusLower, mb_strtolower($closed))) {
                return 'closed';
            }
        }
        
        foreach ($activeStatuses as $active) {
            if (str_contains($statusLower, mb_strtolower($active))) {
                return 'active';
            }
        }
        
        foreach ($pendingStatuses as $pending) {
            if (str_contains($statusLower, mb_strtolower($pending))) {
                return 'pending';
            }
        }
        
        Log::info('Unknown status from Najiz: ' . $status);
        return 'pending';
    }
    
    /**
     * استيراد قضية واحدة من ناجز
     */
    public function importCase(Request $request)
    {
        try {
            $validated = $request->validate([
                'file_number' => 'nullable|string|max:255',
                'title' => 'nullable|string|max:255',
                'court' => 'nullable|string|max:255',
                'case_type' => 'nullable|string|max:50',
                'status' => 'nullable|string|max:50',
                'client_name' => 'nullable|string|max:255',
                'opponent_name' => 'nullable|string|max:255',
                'filing_date' => 'nullable|date',
                'next_hearing' => 'nullable|date',
                'description' => 'nullable|string',
                'najiz_id' => 'nullable|string',
                'najiz_url' => 'nullable|url',
            ]);
            
            // التحقق من وجود القضية
            $existingCase = null;
            if (!empty($validated['file_number'])) {
                $existingCase = CaseModel::where('file_number', $validated['file_number'])->first();
            }
            if (!$existingCase && !empty($validated['najiz_id'])) {
                $existingCase = CaseModel::where('najiz_id', $validated['najiz_id'])->first();
            }
            
            if ($existingCase) {
                // تحديث
                $existingCase->update(array_merge($validated, [
                    'najiz_synced_at' => now()
                ]));
                
                return response()->json([
                    'success' => true,
                    'message' => 'تم تحديث القضية بنجاح',
                    'data' => $existingCase->fresh()
                ]);
            } else {
                // إنشاء جديد
                $fileNumber = $validated['file_number'] ?? CaseModel::generateCaseNumber();
                $case = CaseModel::create(array_merge($validated, [
                    'file_number' => $fileNumber,
                    'title' => $validated['title'] ?? 'قضية مستوردة من ناجز ' . $fileNumber,
                    'client_name' => $validated['client_name'] ?? 'عميل ناجز',
                    'client_id' => $validated['client_id'] ?? 0,
                    'case_type' => $validated['case_type'] ?? 'other',
                    'status' => $validated['status'] ?? 'active',
                    'priority' => 'medium',
                    'source' => 'najiz',
                    'created_by' => 1,
                    'najiz_synced_at' => now()
                ]));
                
                return response()->json([
                    'success' => true,
                    'message' => 'تم إنشاء القضية بنجاح',
                    'data' => $case
                ], 201);
            }
            
        } catch (\Exception $e) {
            Log::error('Error importing single case from Najiz', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الاستيراد',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * استيراد مواعيد من ناجز
     */
    public function importAppointments(Request $request)
    {
        try {
            $appointments = $request->input('appointments', []);
            
            if (empty($appointments)) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا توجد مواعيد للاستيراد'
                ], 400);
            }
            
            $imported = 0;
            $updated = 0;
            $errors = [];
            
            DB::beginTransaction();
            
            foreach ($appointments as $appointmentData) {
                try {
                    // البحث عن القضية المرتبطة
                    $case = null;
                    if (!empty($appointmentData['case_number'])) {
                        $case = CaseModel::where('file_number', $appointmentData['case_number'])->first();
                    }
                    
                    // التحقق من وجود الموعد
                    $existingAppointment = Appointment::where('najiz_id', $appointmentData['najiz_id'] ?? null)
                        ->first();
                    
                    if ($existingAppointment) {
                        $existingAppointment->update([
                            'title' => $appointmentData['title'] ?? $existingAppointment->title,
                            'date' => $appointmentData['date'] ?? $existingAppointment->date,
                            'time' => $appointmentData['time'] ?? $existingAppointment->time,
                            'location' => $appointmentData['location'] ?? $existingAppointment->location,
                            'najiz_synced_at' => now(),
                        ]);
                        $updated++;
                    } else {
                        Appointment::create([
                            'case_id' => $case?->id,
                            'title' => $appointmentData['title'] ?? 'موعد من ناجز',
                            'type' => $appointmentData['type'] ?? 'hearing',
                            'date' => $appointmentData['date'] ?? null,
                            'time' => $appointmentData['time'] ?? null,
                            'location' => $appointmentData['location'] ?? null,
                            'status' => 'scheduled',
                            'najiz_id' => $appointmentData['najiz_id'] ?? null,
                            'source' => 'najiz',
                            'najiz_synced_at' => now(),
                        ]);
                        $imported++;
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'title' => $appointmentData['title'] ?? 'غير معروف',
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'تم استيراد المواعيد بنجاح',
                'data' => [
                    'imported' => $imported,
                    'updated' => $updated,
                    'errors' => $errors
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error importing appointments from Najiz', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء استيراد المواعيد',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * الحصول على حالة المزامنة
     */
    public function getSyncStatus()
    {
        try {
            $lastSync = CaseModel::whereNotNull('najiz_synced_at')
                ->orderBy('najiz_synced_at', 'desc')
                ->first();
            
            $totalFromNajiz = CaseModel::where('source', 'najiz')->count();
            $syncedToday = CaseModel::where('source', 'najiz')
                ->whereDate('najiz_synced_at', today())
                ->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'last_sync' => $lastSync?->najiz_synced_at,
                    'total_from_najiz' => $totalFromNajiz,
                    'synced_today' => $syncedToday
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على القضايا المستوردة من ناجز
     */
    public function getCases()
    {
        try {
            $cases = CaseModel::where('source', 'najiz')
                ->orderBy('najiz_synced_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'count' => $cases->count(),
                'data' => $cases
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
