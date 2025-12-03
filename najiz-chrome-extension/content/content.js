/**
 * إدارة المحاماة - ناجز
 * Content Script - Data Extraction
 * مُحسَّن لسحب التفاصيل الكاملة
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
    // إعدادات السحب
    extractionDelay: 1500, // تأخير بين كل قضية
    pageLoadDelay: 2000,   // تأخير بعد تحميل صفحة جديدة
    
    selectors: {
        // القضايا - Lawsuits (من القائمة)
        casesList: {
            // الكارد الرئيسي للقضية
            caseCard: '[class*="case"], .v-card, [class*="lawsuit"]',
            // زر الخيارات (الثلاث نقاط)
            optionsButton: '.mdi-dots-vertical, [class*="dots-vertical"], button.v-icon',
            // زر عرض
            viewButton: '.v-btn__content, .v-list-item',
        },
        
        // تفاصيل القضية - Case Details Page
        caseDetail: {
            // معلومات أساسية
            caseNumber: 'رقم القضية',
            caseType: 'نوع القضية',
            caseCategory: 'تصنيف القضية',
            caseDate: 'تاريخ القضية',
            caseStatus: 'الحالة',
            court: 'المحكمة',
            department: 'الدائرة',
            
            // الأطراف
            plaintiff: 'المدعي',
            defendant: 'المدعى عليه',
            role: 'الصفة',
            
            // التابات
            tabs: {
                caseFile: '#tab-1, [href*="tab-1"]',
                defenseMemo: '#tab-2, [href*="tab-2"]',
                parties: '#tab-3, [href*="tab-3"]',
                sessions: '#tab-4, [href*="tab-4"]',
                judgments: '#tab-5, [href*="tab-5"]',
                requests: '#tab-6, [href*="tab-6"]'
            }
        },
        
        // التقويم - Calendar
        calendar: {
            events: '.v-calendar .v-event, .calendar-event, .fc-event',
            eventTitle: '.event-title, .v-event-title',
            eventDate: '.event-date, .v-event-date',
            eventTime: '.event-time'
        },
        
        // الوكالات - Powers of Attorney
        wekalat: {
            container: '.v-data-table tbody tr, .wekalat-list .wekalat-item',
            number: '.wekalat-number, td:nth-child(1)',
            type: '.wekalat-type, td:nth-child(2)',
            principal: '.principal, td:nth-child(3)',
            agent: '.agent, td:nth-child(4)',
            status: '.wekalat-status, .v-chip',
            expiryDate: '.expiry-date, td:nth-child(5)'
        }
    }
};

// ========================================
// Utility Functions
// ========================================

/**
 * انتظار ظهور عنصر في الصفحة
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element not found: ${selector}`));
        }, timeout);
    });
}

/**
 * الحصول على النص من عنصر
 */
function getText(element, selectors) {
    if (!element) return '';
    
    if (typeof selectors === 'string') {
        selectors = [selectors];
    }
    
    for (const selector of selectors) {
        try {
            const el = selector ? element.querySelector(selector) : element;
            if (el) {
                return el.textContent?.trim() || '';
            }
        } catch (e) {
            continue;
        }
    }
    
    return '';
}

/**
 * الحصول على سمة من عنصر
 */
function getAttribute(element, selector, attribute) {
    try {
        const el = element.querySelector(selector);
        return el?.getAttribute(attribute) || '';
    } catch {
        return '';
    }
}

/**
 * تحويل التاريخ العربي إلى تنسيق ISO
 */
function parseArabicDate(dateStr) {
    if (!dateStr) return null;
    
    // تنظيف النص
    dateStr = dateStr.trim();
    
    // محاولة التعرف على التاريخ الهجري أو الميلادي
    const patterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{4})-(\d{2})-(\d{2})/,         // YYYY-MM-DD
        /(\d{1,2})-(\d{1,2})-(\d{4})/      // DD-MM-YYYY
    ];
    
    for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
            if (match[1].length === 4) {
                return `${match[1]}-${match[2]}-${match[3]}`;
            } else {
                return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
            }
        }
    }
    
    return dateStr;
}

/**
 * تحويل حالة القضية للإنجليزية
 */
function mapCaseStatus(arabicStatus) {
    const statusMap = {
        'نشطة': 'active',
        'مفتوحة': 'active',
        'قيد النظر': 'pending',
        'معلقة': 'pending',
        'مغلقة': 'closed',
        'منتهية': 'closed',
        'مستأنفة': 'appealed',
        'محكوم': 'closed',
        'جديدة': 'active'
    };
    
    for (const [ar, en] of Object.entries(statusMap)) {
        if (arabicStatus?.includes(ar)) {
            return en;
        }
    }
    
    return 'active';
}

/**
 * تحويل نوع القضية للإنجليزية
 */
function mapCaseType(arabicType) {
    const typeMap = {
        'مدنية': 'civil',
        'جنائية': 'criminal',
        'تجارية': 'commercial',
        'أسرية': 'family',
        'أحوال شخصية': 'family',
        'عمالية': 'labor',
        'إدارية': 'administrative',
        'عقارية': 'real_estate',
        'تنفيذ': 'execution',
        'حقوقية': 'civil',
        'النقل': 'commercial',
        'العقود التجارية': 'commercial'
    };
    
    for (const [ar, en] of Object.entries(typeMap)) {
        if (arabicType?.includes(ar)) {
            return en;
        }
    }
    
    return 'other';
}

// ========================================
// استخراج البيانات الأساسية من القائمة
// ========================================

/**
 * سحب البيانات الأساسية من كارد القضية في القائمة
 * محسّن لاستخراج المدعي والمدعى عليه من بنية ناجز الفعلية
 */
function extractBasicCaseInfo(caseElement) {
    const text = caseElement.textContent || '';
    const html = caseElement.innerHTML || '';
    
    // ===== استخراج البيانات من بنية info-item-details =====
    const infoItems = caseElement.querySelectorAll('.info-item-details');
    
    let caseNumber = '';
    let caseDate = '';
    let caseTypeArabic = '';
    let role = '';
    let plaintiffName = '';
    let defendantName = '';
    let status = 'pending';
    let najizId = '';
    let najizUrl = '';
    
    for (const item of infoItems) {
        const titleEl = item.querySelector('.info-item-details-title');
        const valueEl = item.querySelector('.info-item-details-value');
        
        if (!titleEl) continue;
        
        const title = titleEl.textContent?.trim() || '';
        // استخدم attribute 'set' للقيمة الكاملة، وإلا استخدم النص
        const fullValue = titleEl.getAttribute('set') || valueEl?.getAttribute('title') || valueEl?.textContent?.trim() || '';
        
        console.log(`[Najiz] Field: "${title}" = "${fullValue}"`);
        
        if (title.includes('رقم القضية')) {
            caseNumber = fullValue.trim();
            // استخراج UUID من الرابط
            const link = item.closest('a') || item.querySelector('a');
            if (link) {
                najizUrl = link.getAttribute('href') || '';
                const uuidMatch = najizUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
                if (uuidMatch) {
                    najizId = uuidMatch[1];
                }
            }
        } else if (title.includes('تاريخ القضية')) {
            caseDate = fullValue;
        } else if (title.includes('نوع القضية')) {
            caseTypeArabic = fullValue;
        } else if (title.includes('الصفة')) {
            role = fullValue;
        } else if (title.includes('المدعي') && !title.includes('المدعى عليه')) {
            plaintiffName = fullValue;
        } else if (title.includes('المدعى عليه')) {
            defendantName = fullValue;
        } else if (title.includes('الحالة')) {
            const statusText = fullValue.toLowerCase();
            if (statusText.includes('منتهية') || statusText.includes('مغلقة')) {
                status = 'closed';
            } else if (statusText.includes('قيد النظر')) {
                status = 'pending';
            } else if (statusText.includes('جديدة') || statusText.includes('نشطة')) {
                status = 'active';
            }
        }
    }
    
    // محاولة بديلة: البحث عن رقم القضية من النص
    if (!caseNumber) {
        const numMatch = text.match(/(\d{7,10})/);
        if (numMatch) caseNumber = numMatch[1];
    }
    
    // محاولة بديلة: استخراج UUID من أي رابط
    if (!najizId) {
        const links = caseElement.querySelectorAll('a[href*="case-file"]');
        for (const link of links) {
            const href = link.getAttribute('href') || '';
            const uuidMatch = href.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
            if (uuidMatch) {
                najizId = uuidMatch[1];
                najizUrl = href;
                break;
            }
        }
    }
    
    if (!caseNumber) {
        console.log('[Najiz Extension] ⚠️ NO CASE NUMBER FOUND in card');
        return null;
    }
    
    const caseData = {
        file_number: caseNumber,
        case_type: mapCaseType(caseTypeArabic),
        case_type_arabic: caseTypeArabic,
        status: status,
        filing_date: caseDate || null,
        role: role,
        plaintiff_name: plaintiffName || null,
        defendant_name: defendantName || null,
        source: 'najiz',
        najiz_id: najizId || caseNumber,
        najiz_url: najizUrl ? `https://najiz.sa${najizUrl}` : window.location.href
    };
    
    console.log('[Najiz Extension] ✅ Extracted case data:', JSON.stringify(caseData, null, 2));
    
    return caseData;
}

/**
 * الحصول على UUID القضية من الـ URL أو العنصر
 */
function getCaseUUID(caseElement) {
    // البحث عن رابط داخل العنصر
    const links = caseElement.querySelectorAll('a[href*="case-file"]');
    for (const link of links) {
        const href = link.getAttribute('href') || '';
        const uuidMatch = href.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch) return uuidMatch[1];
    }
    
    // البحث في onclick
    const buttons = caseElement.querySelectorAll('button, [onclick]');
    for (const btn of buttons) {
        const onclick = btn.getAttribute('onclick') || '';
        const uuidMatch = onclick.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch) return uuidMatch[1];
    }
    
    return null;
}

// ========================================
// Data Extraction Functions
// ========================================

/**
 * سحب قائمة القضايا - الصفحة الحالية (بيانات أساسية فقط)
 */
async function extractCasesFromCurrentPage() {
    console.log('[Najiz Extension] Extracting basic cases from current page...');
    
    const cases = [];
    
    // محاولة عدة selectors مختلفة - الأولوية لـ info-item-box
    const possibleSelectors = [
        '.info-item-box',
        '[class*="info-item-box"]',
        '[class*="case"]',
        '.v-card',
        'table tbody tr',
        '.v-data-table tbody tr',
        '[class*="lawsuit"]'
    ];
    
    let rows = [];
    
    for (const selector of possibleSelectors) {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
            // تصفية العناصر التي تحتوي على رقم قضية
            const filtered = Array.from(found).filter(el => {
                const text = el.textContent || '';
                return /\d{7,10}/.test(text) && text.includes('رقم القضية');
            });
            if (filtered.length > 0) {
                rows = filtered;
                console.log(`[Najiz Extension] Found ${rows.length} case cards with selector: ${selector}`);
                break;
            }
        }
    }
    
    // إذا لم نجد بالفلترة، نحاول بدون
    if (rows.length === 0) {
        for (const selector of possibleSelectors) {
            const found = document.querySelectorAll(selector);
            const filtered = Array.from(found).filter(el => {
                const text = el.textContent || '';
                return /\d{7,10}/.test(text);
            });
            if (filtered.length > 0 && filtered.length < 200) {
                rows = filtered;
                console.log(`[Najiz Extension] Found ${rows.length} case cards (fallback) with selector: ${selector}`);
                break;
            }
        }
    }
    
    for (const row of rows) {
        try {
            const caseInfo = extractBasicCaseInfo(row);
            if (caseInfo && caseInfo.file_number) {
                // التحقق من عدم التكرار
                if (!cases.find(c => c.file_number === caseInfo.file_number)) {
                    cases.push(caseInfo);
                }
            }
        } catch (error) {
            console.error('[Najiz Extension] Error extracting row:', error);
        }
    }
    
    console.log(`[Najiz Extension] Extracted ${cases.length} cases from current page`);
    return cases;
}

/**
 * سحب القضايا مع التفاصيل الكاملة
 * يستخدم Fetch لجلب التفاصيل بسرعة (بدون فتح تبويبات)
 */
async function extractCasesWithAutoDetails() {
    console.log('[Najiz Extension] 🚀 Starting extraction with FULL DETAILS (Fast Fetch)...');
    showNotification('جاري سحب القضايا بالتفاصيل الكاملة...', 'info');
    
    // المرحلة 1: سحب البيانات الأساسية من كل الصفحات
    console.log('[Najiz Extension] Phase 1: Extracting basic data...');
    showNotification('المرحلة 1: سحب البيانات الأساسية...', 'info');
    
    const allBasicCases = [];
    const totalPages = await getTotalPages();
    console.log(`[Najiz Extension] Total pages: ${totalPages}`);
    
    for (let page = 1; page <= totalPages; page++) {
        console.log(`[Najiz Extension] 📄 Page ${page}/${totalPages}...`);
        showNotification(`جاري سحب الصفحة ${page} من ${totalPages}...`, 'info');
        
        if (page > 1) {
            const navigated = await navigateToPage(page);
            if (!navigated) break;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        const pageCases = await extractCasesFromCurrentPage();
        if (pageCases && pageCases.length > 0) {
            allBasicCases.push(...pageCases);
        }
    }
    
    console.log(`[Najiz Extension] ✅ Phase 1 Complete: ${allBasicCases.length} cases with basic data`);
    
    if (allBasicCases.length === 0) {
        showNotification('لم يتم العثور على قضايا!', 'error');
        return [];
    }
    
    // حفظ البيانات الأساسية أولاً
    console.log('[Najiz Extension] 💾 Saving basic data...');
    showNotification(`جاري حفظ ${allBasicCases.length} قضية...`, 'info');
    await sendExtractedCasesToAPI(allBasicCases);
    showNotification(`✅ تم حفظ ${allBasicCases.length} قضية!`, 'success');
    
    // المرحلة 2: سحب التفاصيل بـ Fetch (سريع جداً)
    console.log('[Najiz Extension] Phase 2: Fetching details (Fast)...');
    showNotification(`🚀 جاري سحب التفاصيل بسرعة...`, 'info');
    
    const casesWithDetails = [];
    const BATCH_SIZE = 5; // 5 طلبات بالتوازي (أقل ضغط على السيرفر)
    let successCount = 0;
    
    for (let i = 0; i < allBasicCases.length; i += BATCH_SIZE) {
        const batch = allBasicCases.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(allBasicCases.length / BATCH_SIZE);
        
        console.log(`[Najiz Extension] 📦 Batch ${batchNum}/${totalBatches}...`);
        showNotification(`جاري سحب التفاصيل: ${Math.min(i + BATCH_SIZE, allBasicCases.length)}/${allBasicCases.length}`, 'info');
        
        // جلب كل الدفعة بالتوازي
        const batchPromises = batch.map(c => fetchCaseDetails(c));
        const batchResults = await Promise.all(batchPromises);
        
        // عد النجاحات
        batchResults.forEach(r => {
            if (r.parties?.length > 0 || r.sessions?.length > 0 || r.case_subject) {
                successCount++;
            }
        });
        
        casesWithDetails.push(...batchResults);
        
        // استراحة قصيرة
        if (i + BATCH_SIZE < allBasicCases.length) {
            await new Promise(r => setTimeout(r, 500));
        }
    }
    
    console.log(`[Najiz Extension] ✅ Got details for ${successCount}/${casesWithDetails.length} cases`);
    
    if (successCount > 0) {
        showNotification(`جاري تحديث ${successCount} قضية بالتفاصيل...`, 'info');
        await sendExtractedCasesToAPI(casesWithDetails);
    }
    
    showNotification(`✅ تم! ${allBasicCases.length} قضية (${successCount} بتفاصيل)`, 'success');
    return casesWithDetails;
}

/**
 * جلب تفاصيل قضية واحدة بـ Fetch - يستخدم API ناجز الحقيقي
 */
async function fetchCaseDetails(basicCase) {
    try {
        const url = basicCase.najiz_url;
        
        // استخراج UUID من الرابط
        const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (!uuidMatch) {
            return { ...basicCase, fetchError: 'No UUID found' };
        }
        
        const caseId = uuidMatch[1];
        const baseApiUrl = 'https://najiz.sa/applications/lawsuit//lawsuit/icms/api/cases';
        
        const details = {
            parties: [],
            sessions: [],
            case_subject: basicCase.case_subject || null,
            case_demands: null,
            case_proofs: null
        };
        
        // جلب التفاصيل الأساسية والأطراف والجلسات بالتوازي
        const [caseRes, partiesRes, sessionsRes] = await Promise.all([
            fetch(`${baseApiUrl}/${caseId}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            }).catch(() => null),
            fetch(`${baseApiUrl}/${caseId}/parties-details`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            }).catch(() => null),
            fetch(`${baseApiUrl}/${caseId}/sessions`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            }).catch(() => null)
        ]);
        
        // معالجة تفاصيل القضية الأساسية
        if (caseRes && caseRes.ok) {
            try {
                const caseData = await caseRes.json();
                // تحديث المعلومات الأساسية من API
                if (caseData.caseSubject) details.case_subject = caseData.caseSubject;
                if (caseData.caseDemands) details.case_demands = caseData.caseDemands;
                if (caseData.caseProofs) details.case_proofs = caseData.caseProofs;
                if (caseData.caseTypeName) details.case_type = caseData.caseTypeName;
                if (caseData.caseCategoryName) details.case_category = caseData.caseCategoryName;
                if (caseData.courtName) details.court = caseData.courtName;
                if (caseData.subCircleName) details.sub_circle = caseData.subCircleName;
                if (caseData.caseStatusName) details.status = caseData.caseStatusName;
                if (caseData.caseDate) details.filing_date = caseData.caseDate;
                if (caseData.caseClassificationName) details.case_classification = caseData.caseClassificationName;
                console.log(`[Najiz] Got case details: ${caseData.caseTypeName || 'N/A'}`);
            } catch (e) {
                console.log('[Najiz] Could not parse case details:', e.message);
            }
        }
        
        // معالجة الأطراف
        if (partiesRes && partiesRes.ok) {
            try {
                const partiesData = await partiesRes.json();
                const partiesArray = Array.isArray(partiesData) ? partiesData : 
                                    (partiesData.data ? partiesData.data : []);
                
                // استخراج جميع الأطراف بما فيهم المحامين من subsDictionary
                const extractParties = (parties, parentRole = null) => {
                    const result = [];
                    for (const p of parties) {
                        // إضافة الطرف الرئيسي
                        result.push({
                            name: p.name || '',
                            role: p.casePartyRoleName || p.partyTypeName || '',
                            id_number: p.identityNumber || '',
                            nationality: p.nationalityName || '',
                            party_type: p.partyTypeName || '',
                            side: determineSideFromRole(p.casePartyRole, p.casePartyRoleName)
                        });
                        
                        // إضافة المحامين والوكلاء من subsDictionary
                        if (p.subsDictionary && Array.isArray(p.subsDictionary)) {
                            for (const sub of p.subsDictionary) {
                                result.push({
                                    name: sub.name || '',
                                    role: sub.casePartyRoleName || 'محامى',
                                    id_number: sub.identityNumber || '',
                                    nationality: sub.nationalityName || '',
                                    party_type: sub.partyTypeName || '',
                                    side: 'lawyer',
                                    represents: p.name // يمثل من
                                });
                            }
                        }
                    }
                    return result;
                };
                
                details.parties = extractParties(partiesArray);
                console.log(`[Najiz] Parsed ${details.parties.length} parties from API`);
            } catch (e) {
                console.log('[Najiz] Could not parse parties:', e.message);
            }
        }
        
        // معالجة الجلسات
        if (sessionsRes && sessionsRes.ok) {
            try {
                const sessionsJson = await sessionsRes.json();
                // الجلسات تجي في data property
                const sessionsArray = sessionsJson.data || sessionsJson || [];
                
                if (Array.isArray(sessionsArray)) {
                    details.sessions = sessionsArray.map(s => ({
                        date: s.sessionDate || s.date || s.hearingDate || '',
                        time: s.sessionTime || s.time || '',
                        type: s.sessionTypeName || s.sessionType || s.type || '',
                        status: s.sessionStatusName || s.status || '',
                        location: s.courtRoom || s.location || s.hall || '',
                        session_number: s.sessionNumber || null,
                        result: s.sessionResult || s.result || ''
                    }));
                }
                console.log(`[Najiz] Parsed ${details.sessions.length} sessions from API`);
            } catch (e) {
                console.log('[Najiz] Could not parse sessions:', e.message);
            }
        }
        
        if (details.parties.length > 0 || details.sessions.length > 0) {
            console.log(`[Najiz] ✅ ${basicCase.file_number}: ${details.parties.length} parties, ${details.sessions.length} sessions`);
        }
        
        return { ...basicCase, ...details };
        
    } catch (error) {
        console.error('[Najiz] Fetch error:', error.message);
        return { ...basicCase, fetchError: error.message };
    }
}

/**
 * تحديد جانب الطرف من casePartyRole
 * 1 = مدعي (plaintiff)
 * 2 = مدعى عليه (defendant)
 * 5 = محامي (lawyer)
 */
function determineSideFromRole(roleId, roleName) {
    // أولاً نحاول من الرقم
    if (roleId === 1) return 'plaintiff';
    if (roleId === 2) return 'defendant';
    if (roleId === 5) return 'lawyer';
    
    // ثانياً من الاسم
    const name = (roleName || '').toLowerCase();
    if (name.includes('مدعي') && !name.includes('عليه')) return 'plaintiff';
    if (name.includes('مدعى عليه')) return 'defendant';
    if (name.includes('محام')) return 'lawyer';
    
    return 'other';
}

/**
 * تحديد جانب الطرف (مدعي/مدعى عليه) - للتوافق مع الكود القديم
 */
function determineSide(party) {
    const role = (party.role || party.partyRole || party.type || party.partyType || '').toLowerCase();
    const side = (party.side || party.partySide || '').toLowerCase();
    
    if (side.includes('plaintiff') || role.includes('مدعي') || role.includes('مدعى') && !role.includes('عليه')) {
        return 'plaintiff';
    }
    if (side.includes('defendant') || role.includes('مدعى عليه')) {
        return 'defendant';
    }
    return 'other';
}

/**
 * تحليل تفاصيل القضية من HTML
 */
function parseCaseDetailsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const details = {
        parties: [],
        sessions: [],
        case_subject: null
    };
    
    try {
        // استخراج موضوع القضية
        const subjectEl = doc.querySelector('[class*="subject"], [class*="موضوع"]');
        if (subjectEl) {
            details.case_subject = subjectEl.textContent.trim();
        }
        
        // البحث عن موضوع الدعوى في الجداول
        const allText = doc.body?.textContent || '';
        const subjectMatch = allText.match(/موضوع الدعوى[:\s]*([^\n]+)/);
        if (subjectMatch) {
            details.case_subject = subjectMatch[1].trim();
        }
        
        // استخراج الأطراف من الجداول
        const tables = doc.querySelectorAll('table');
        tables.forEach(table => {
            const headerRow = table.querySelector('tr');
            if (!headerRow) return;
            
            const headerText = headerRow.textContent;
            
            // جدول الأطراف
            if (headerText.includes('الطرف') || headerText.includes('الصفة') || headerText.includes('نوع الهوية')) {
                const rows = table.querySelectorAll('tr');
                rows.forEach((row, idx) => {
                    if (idx === 0) return; // skip header
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        details.parties.push({
                            name: cells[0]?.textContent.trim() || '',
                            role: cells[1]?.textContent.trim() || '',
                            id_number: cells[2]?.textContent.trim() || ''
                        });
                    }
                });
            }
            
            // جدول الجلسات
            if (headerText.includes('تاريخ الجلسة') || headerText.includes('الجلسات')) {
                const rows = table.querySelectorAll('tr');
                rows.forEach((row, idx) => {
                    if (idx === 0) return;
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        details.sessions.push({
                            date: cells[0]?.textContent.trim() || '',
                            time: cells[1]?.textContent.trim() || '',
                            type: cells[2]?.textContent.trim() || '',
                            status: cells[3]?.textContent.trim() || ''
                        });
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('[Najiz] Parse error:', error);
    }
    
    return details;
}

/**
 * إرسال القضايا المستخرجة للـ API
 */
async function sendExtractedCasesToAPI(cases) {
    console.log(`[Najiz Extension] 📤 Sending ${cases.length} cases to API...`);
    showNotification(`جاري حفظ ${cases.length} قضية في قاعدة البيانات...`, 'info');
    
    try {
        const settings = await chrome.storage.local.get(['apiUrl', 'apiToken']);
        const apiUrl = settings.apiUrl || 'http://localhost:8000/api/v1';
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (settings.apiToken) {
            headers['Authorization'] = `Bearer ${settings.apiToken}`;
        }
        
        // إرسال على دفعات
        const batchSize = 25;
        let totalImported = 0;
        let totalUpdated = 0;
        
        for (let i = 0; i < cases.length; i += batchSize) {
            const batch = cases.slice(i, i + batchSize);
            
            try {
                const response = await fetch(`${apiUrl}/najiz/cases/import`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ cases: batch })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const data = result.data || result;
                    totalImported += data.imported || 0;
                    totalUpdated += data.updated || 0;
                    
                    // Log errors if any
                    if (data.errors && data.errors.length > 0) {
                        console.log(`[Najiz] Batch had ${data.errors.length} errors:`, data.errors.slice(0, 3));
                    }
                    console.log(`[Najiz] Batch result: imported=${data.imported}, updated=${data.updated}, errors=${data.errors_count || 0}`);
                } else {
                    const errorText = await response.text();
                    console.error(`[Najiz] API error ${response.status}:`, errorText.substring(0, 200));
                }
            } catch (e) {
                console.error('[Najiz] API batch error:', e.message);
            }
        }
        
        console.log(`[Najiz Extension] ✅ API: ${totalImported} imported, ${totalUpdated} updated`);
        showNotification(`✅ تم حفظ ${totalImported + totalUpdated} قضية!`, 'success');
        
    } catch (error) {
        console.error('[Najiz Extension] API Error:', error);
        showNotification(`❌ خطأ في الحفظ: ${error.message}`, 'error');
    }
}

/**
 * إيقاف عملية الاستخراج
 */
async function stopExtraction() {
    await chrome.storage.local.set({ extractionActive: false });
    showNotification('تم إيقاف عملية الاستخراج', 'info');
    console.log('[Najiz Extension] Extraction stopped');
}

/**
 * جلب تفاصيل القضية مع محاكاة التابات
 */
async function fetchCaseDetailsWithTabs(url) {
    try {
        console.log(`[Najiz Extension] Fetching full details from: ${url}`);
        
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const caseData = {
            source: 'najiz',
            najiz_url: url
        };
        
        // استخراج UUID
        const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch) {
            caseData.najiz_id = uuidMatch[1];
        }
        
        // البيانات الأساسية
        const pageText = doc.body?.innerText || '';
        
        // رقم القضية
        const caseNumberMatch = pageText.match(/رقم القضية[:\s]*(\d{10})/);
        if (caseNumberMatch) caseData.file_number = caseNumberMatch[1];
        
        // تصنيف القضية
        const categoryMatch = pageText.match(/تصنيف القضية[:\s]*([^\n]+)/);
        if (categoryMatch) caseData.case_category = categoryMatch[1].trim();
        
        // نوع القضية
        const typeMatch = pageText.match(/نوع القضية[:\s]*([^\n]+)/);
        if (typeMatch) caseData.case_type_arabic = typeMatch[1].trim();
        
        // تاريخ القضية
        const dateMatch = pageText.match(/تاريخ القضية[:\s]*([^\n]+)/);
        if (dateMatch) caseData.case_date_hijri = dateMatch[1].trim();
        
        // المحكمة والدائرة
        const courtMatch = pageText.match(/المحكمة[:\s]*([^\n]+)/);
        if (courtMatch) caseData.court = courtMatch[1].trim();
        
        const deptMatch = pageText.match(/الدائرة[:\s]*([^\n]+)/);
        if (deptMatch) caseData.department = deptMatch[1].trim();
        
        // موضوع الدعوى
        const subjectMatch = pageText.match(/موضوع الدعوى[\s\n]+([\s\S]{50,2000}?)(?=طلبات المدعي|أسانيد|$)/);
        if (subjectMatch) caseData.case_subject = subjectMatch[1].trim();
        
        // طلبات المدعي
        const requestsMatch = pageText.match(/طلبات المدعي[\s\n]+([\s\S]{20,1000}?)(?=أسانيد|هذه دعواي|$)/);
        if (requestsMatch) caseData.plaintiff_requests = requestsMatch[1].trim();
        
        // أسانيد الدعوى
        const evidenceMatch = pageText.match(/أسانيد الدعوى[\s\n]+([^\n]+)/);
        if (evidenceMatch) caseData.case_evidence = evidenceMatch[1].trim();
        
        // الأطراف
        caseData.parties = extractPartiesFromHTML(doc);
        
        // الجلسات
        caseData.sessions = extractSessionsFromHTML(doc);
        
        // استخراج أسماء الأطراف الرئيسيين
        if (caseData.parties && caseData.parties.length > 0) {
            const plaintiff = caseData.parties.find(p => p.role === 'المدعي' || p.role === 'مدعي');
            const defendant = caseData.parties.find(p => p.role === 'مدعى عليه' || p.role === 'المدعى عليه');
            
            if (plaintiff) {
                caseData.plaintiff_name = plaintiff.name;
                caseData.plaintiff_id = plaintiff.national_id || plaintiff.commercial_reg;
            }
            if (defendant) {
                caseData.defendant_name = defendant.name;
                caseData.defendant_id = defendant.national_id || defendant.commercial_reg;
            }
        }
        
        // الجلسة القادمة
        if (caseData.sessions && caseData.sessions.length > 0) {
            const upcoming = caseData.sessions.find(s => s.status === 'جديدة' || s.status === 'new');
            if (upcoming) {
                caseData.next_hearing = upcoming.date;
                caseData.next_hearing_time = upcoming.time;
                caseData.next_hearing_type = upcoming.type;
                caseData.hearing_method = upcoming.method;
                caseData.court = upcoming.court || caseData.court;
                caseData.department = upcoming.department || caseData.department;
            }
        }
        
        // تحديد نوع القضية
        caseData.case_type = mapCaseType(caseData.case_type_arabic || caseData.case_category);
        
        // بناء العنوان
        caseData.title = `قضية ${caseData.case_type_arabic || caseData.case_category || ''} - ${caseData.file_number || ''}`.trim();
        
        return caseData;
        
    } catch (error) {
        console.error(`[Najiz Extension] Error fetching details:`, error);
        return null;
    }
}

/**
 * استخراج الأطراف من HTML
 */
function extractPartiesFromHTML(doc) {
    const parties = [];
    const pageText = doc.body?.innerText || '';
    
    // البحث عن المدعين
    const plaintiffsMatch = pageText.match(/قائمة المدعين([\s\S]*?)(?=قائمة المدعى عليهم|$)/i);
    if (plaintiffsMatch) {
        const section = plaintiffsMatch[1];
        // استخراج الأسماء
        const nameMatches = section.match(/([^\n]{5,50})\n(?:المدعي|مدعي)/g);
        if (nameMatches) {
            for (const match of nameMatches) {
                const name = match.replace(/\n(?:المدعي|مدعي)/, '').trim();
                if (name && name.length > 3 && !name.includes('قائمة')) {
                    parties.push({ name, role: 'المدعي', side: 'plaintiff' });
                }
            }
        }
    }
    
    // البحث عن المدعى عليهم
    const defendantsMatch = pageText.match(/قائمة المدعى عليهم([\s\S]*?)(?=أطراف أخرى|الجلسات|$)/i);
    if (defendantsMatch) {
        const section = defendantsMatch[1];
        const nameMatches = section.match(/([^\n]{5,50})\n(?:مدعى عليه|المدعى عليه)/g);
        if (nameMatches) {
            for (const match of nameMatches) {
                const name = match.replace(/\n(?:مدعى عليه|المدعى عليه)/, '').trim();
                if (name && name.length > 3 && !name.includes('قائمة')) {
                    parties.push({ name, role: 'مدعى عليه', side: 'defendant' });
                }
            }
        }
    }
    
    // إذا لم نجد، نحاول بطريقة أبسط
    if (parties.length === 0) {
        const plaintiffMatch = pageText.match(/المدعي[:\s]+([^\n]+)/);
        if (plaintiffMatch) {
            parties.push({ 
                name: plaintiffMatch[1].trim().replace(/\.{3,}$/, ''), 
                role: 'المدعي', 
                side: 'plaintiff' 
            });
        }
        
        const defendantMatch = pageText.match(/المدعى عليه[:\s]+([^\n]+)/);
        if (defendantMatch) {
            parties.push({ 
                name: defendantMatch[1].trim().replace(/\.{3,}$/, ''), 
                role: 'مدعى عليه', 
                side: 'defendant' 
            });
        }
    }
    
    return parties;
}

/**
 * استخراج الجلسات من HTML
 */
function extractSessionsFromHTML(doc) {
    const sessions = [];
    const pageText = doc.body?.innerText || '';
    
    // البحث عن أنماط الجلسات
    const sessionPattern = /(جلسة\s+\S+)[\s\n]*([\u0660-\u0669\d]{4}\/[\u0660-\u0669\d]{2}\/[\u0660-\u0669\d]{2})[\s\n]*(\d{1,2}:\d{2}\s*[صم]?)?/g;
    let match;
    
    while ((match = sessionPattern.exec(pageText)) !== null) {
        const session = {
            type: match[1].trim(),
            date: match[2],
            time: match[3]?.trim() || '',
            status: 'scheduled'
        };
        
        // تحديد الحالة من السياق
        const context = pageText.substring(Math.max(0, match.index - 100), match.index + 300);
        if (context.includes('جديدة')) session.status = 'جديدة';
        else if (context.includes('منتهية')) session.status = 'منتهية';
        else if (context.includes('ملغاة')) session.status = 'ملغاة';
        
        // المحكمة والدائرة
        const courtMatch = context.match(/المحكمة[:\s]+([^\n]+)/);
        if (courtMatch) session.court = courtMatch[1].trim();
        
        const deptMatch = context.match(/الدائرة[:\s]+([^\n]+)/);
        if (deptMatch) session.department = deptMatch[1].trim();
        
        // آلية الانعقاد
        if (context.includes('عن بعد')) session.method = 'عن بعد';
        else if (context.includes('حضوري')) session.method = 'حضوري';
        
        // الدرجة
        if (context.includes('الدرجة الأولى')) session.degree = 'الدرجة الأولى';
        else if (context.includes('الدرجة الثانية')) session.degree = 'الدرجة الثانية';
        
        sessions.push(session);
    }
    
    return sessions;
}

/**
 * سحب التفاصيل الكاملة لقضية واحدة من صفحة التفاصيل
 */
async function extractFullCaseDetails() {
    console.log('[Najiz Extension] 📋 Extracting FULL case details from detail page...');
    
    // انتظار تحميل الصفحة
    await new Promise(resolve => setTimeout(resolve, CONFIG.pageLoadDelay));
    
    const caseData = {
        source: 'najiz',
        najiz_url: window.location.href,
        najiz_id: '',
        status: 'pending'
    };
    
    // استخراج UUID من URL
    const uuidMatch = window.location.href.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
        caseData.najiz_id = uuidMatch[1];
    }
    
    // =========== استخراج البيانات الأساسية من الهيدر ===========
    // رقم القضية
    const caseNumberEl = document.querySelector('.info-item-details-value.text-h5');
    if (caseNumberEl) {
        caseData.file_number = caseNumberEl.textContent?.trim();
    }
    
    // البحث في info-item-details
    const infoItems = document.querySelectorAll('.info-item-details');
    for (const item of infoItems) {
        const header = item.querySelector('.info-item-details-header')?.textContent?.trim() || '';
        const value = item.querySelector('.font-info')?.textContent?.trim() || 
                      item.querySelector('.info-item-details-value')?.textContent?.trim() || '';
        
        if (header.includes('تصنيف القضية')) {
            caseData.case_category = value;
        } else if (header.includes('نوع القضية')) {
            caseData.case_type_arabic = value;
        } else if (header.includes('تاريخ القضية')) {
            caseData.case_date_hijri = value;
        } else if (header.includes('رقم القضية') && !caseData.file_number) {
            caseData.file_number = value;
        }
    }
    
    console.log('[Najiz] Basic info:', { 
        file_number: caseData.file_number, 
        category: caseData.case_category, 
        type: caseData.case_type_arabic 
    });
    
    // تحديد نوع القضية
    caseData.case_type = mapCaseType(caseData.case_type_arabic || caseData.case_category);
    
    // =========== Tab 1: موضوع الدعوى ===========
    await clickTab('tab-1');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // البحث عن محتوى موضوع الدعوى
    const caseInfoTexts = document.querySelectorAll('.case-info-text');
    const headings = document.querySelectorAll('.text-h6.text-c-green');
    
    for (let i = 0; i < headings.length; i++) {
        const headingText = headings[i].textContent?.trim() || '';
        const contentEl = headings[i].nextElementSibling || caseInfoTexts[i];
        const content = contentEl?.textContent?.trim() || '';
        
        if (headingText.includes('موضوع الدعوى')) {
            caseData.case_subject = content;
            console.log('[Najiz] Case subject found:', content.substring(0, 100) + '...');
        } else if (headingText.includes('طلبات المدعي')) {
            caseData.plaintiff_requests = content;
            console.log('[Najiz] Plaintiff requests found:', content.substring(0, 100) + '...');
        } else if (headingText.includes('أسانيد الدعوى')) {
            caseData.case_evidence = content;
        }
    }
    
    // =========== Tab 3: أطراف الدعوى ===========
    await clickTab('tab-3');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    caseData.parties = extractPartiesFromPage();
    console.log('[Najiz] Parties found:', caseData.parties?.length || 0);
    
    // =========== Tab 4: الجلسات ===========
    await clickTab('tab-4');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    caseData.sessions = extractSessionsFromPage();
    console.log('[Najiz] Sessions found:', caseData.sessions?.length || 0);
    
    // =========== استخراج معلومات من الأطراف ===========
    if (caseData.parties && caseData.parties.length > 0) {
        const plaintiffs = caseData.parties.filter(p => 
            p.role === 'المدعي' || p.role === 'مدعي'
        );
        const defendants = caseData.parties.filter(p => 
            p.role === 'مدعى عليه' || p.role === 'المدعى عليه'
        );
        const lawyers = caseData.parties.filter(p => 
            p.role === 'محامى' || p.role === 'محامي'
        );
        
        if (plaintiffs.length > 0) {
            caseData.plaintiff_name = plaintiffs[0].name;
            caseData.plaintiff_id = plaintiffs[0].national_id || plaintiffs[0].commercial_reg;
        }
        
        if (defendants.length > 0) {
            caseData.defendant_name = defendants[0].name;
            caseData.defendant_id = defendants[0].national_id || defendants[0].commercial_reg;
        }
        
        if (lawyers.length > 0) {
            caseData.lawyers = lawyers;
        }
    }
    
    // =========== استخراج معلومات من الجلسات ===========
    if (caseData.sessions && caseData.sessions.length > 0) {
        // المحكمة والدائرة من أول جلسة
        const firstSession = caseData.sessions[0];
        if (firstSession.court) caseData.court = firstSession.court;
        if (firstSession.department) caseData.department = firstSession.department;
        
        // الجلسة القادمة
        const upcomingSessions = caseData.sessions.filter(s => 
            s.status === 'جديدة' || s.status === 'new'
        );
        if (upcomingSessions.length > 0) {
            caseData.next_hearing = upcomingSessions[0].date;
            caseData.next_hearing_time = upcomingSessions[0].time;
            caseData.next_hearing_type = upcomingSessions[0].type;
        }
    }
    
    // بناء العنوان
    caseData.title = `قضية ${caseData.case_type_arabic || caseData.case_category || ''} - ${caseData.file_number || ''}`.trim();
    
    console.log('[Najiz Extension] ✅ Extracted full case details:', caseData);
    return caseData;
}

/**
 * استخراج الأطراف من صفحة التفاصيل (تاب أطراف الدعوى)
 * بناءً على هيكل HTML: card-info مع info-data-details
 */
function extractPartiesFromPage() {
    console.log('[Najiz Extension] 👥 Extracting parties from page...');
    
    const parties = [];
    
    // البحث عن كاردات الأطراف
    const partyCards = document.querySelectorAll('.card-info');
    
    for (const card of partyCards) {
        const cardText = card.textContent || '';
        
        // تجاهل إذا لم يكن طرف
        if (!cardText.includes('المدعي') && !cardText.includes('مدعى عليه') && !cardText.includes('محام')) {
            continue;
        }
        
        const party = {
            name: '',
            role: '',
            side: '',
            national_id: '',
            commercial_reg: '',
            nationality: ''
        };
        
        // استخراج الاسم (عادة في عنصر text-h6)
        const nameEl = card.querySelector('.text-h6.font-weight-black, .card-info-title');
        if (nameEl) {
            party.name = nameEl.textContent?.trim() || '';
        }
        
        // استخراج من info-data-details
        const infoItems = card.querySelectorAll('.info-data-details');
        for (const item of infoItems) {
            const title = item.querySelector('.info-data-details-title')?.textContent?.trim() || '';
            const value = item.querySelector('.info-data-details-value')?.textContent?.trim() || '';
            
            if (title.includes('الصفة') || title.includes('نوع الطرف')) {
                party.role = value;
                if (value.includes('المدعي') || value.includes('مدعي')) {
                    party.side = 'plaintiff';
                } else if (value.includes('مدعى عليه')) {
                    party.side = 'defendant';
                }
            } else if (title.includes('الهوية الوطنية') || title.includes('رقم الهوية')) {
                party.national_id = value;
            } else if (title.includes('السجل التجاري')) {
                party.commercial_reg = value;
            } else if (title.includes('الجنسية')) {
                party.nationality = value;
            }
        }
        
        // استخراج من chips
        const chips = card.querySelectorAll('.v-chip, .v-chip__content');
        for (const chip of chips) {
            const chipText = chip.textContent?.trim() || '';
            
            if (chipText === 'المدعي' || chipText === 'مدعي') {
                party.role = 'المدعي';
                party.side = 'plaintiff';
            } else if (chipText === 'مدعى عليه' || chipText === 'المدعى عليه') {
                party.role = 'مدعى عليه';
                party.side = 'defendant';
            } else if (chipText === 'محامى' || chipText === 'محامي') {
                party.role = 'محامي';
                party.side = 'plaintiff'; // المحامي عادة مع المدعي
            } else if (chipText.includes('الهوية الوطنية')) {
                party.national_id = chipText.replace(/الهوية الوطنية\s*:?\s*/g, '').trim();
            } else if (chipText.includes('السجل التجاري')) {
                party.commercial_reg = chipText.replace(/السجل التجاري\s*:?\s*/g, '').trim();
            } else if (chipText.includes('الجنسية')) {
                party.nationality = chipText.replace(/الجنسية\s*:?\s*/g, '').trim();
            }
        }
        
        // إذا وجدنا اسم وصفة، نضيف للقائمة
        if (party.name && party.role) {
            // تجنب التكرار
            if (!parties.find(p => p.name === party.name && p.role === party.role)) {
                parties.push(party);
                console.log('[Najiz] Found party:', party);
            }
        }
    }
    
    // إذا لم نجد، نحاول من النص العام
    if (parties.length === 0) {
        const pageText = document.body.innerText;
        
        // نمط المدعي
        const plaintiffMatch = pageText.match(/(?:قائمة المدعين|المدعي)[\s\S]*?([^\n]{3,50})\n\s*(?:المدعي|مدعي)/);
        if (plaintiffMatch) {
            parties.push({
                name: plaintiffMatch[1].trim(),
                role: 'المدعي',
                side: 'plaintiff'
            });
        }
        
        // نمط المدعى عليه  
        const defendantMatch = pageText.match(/(?:قائمة المدعى عليهم|المدعى عليه)[\s\S]*?([^\n]{3,50})\n\s*(?:مدعى عليه)/);
        if (defendantMatch) {
            parties.push({
                name: defendantMatch[1].trim(),
                role: 'مدعى عليه',
                side: 'defendant'
            });
        }
    }
    
    console.log(`[Najiz Extension] Found ${parties.length} parties`);
    return parties;
}

/**
 * استخراج الجلسات من صفحة التفاصيل (تاب الجلسات)
 * بناءً على هيكل HTML: degree-box و degree-1/degree-2
 */
function extractSessionsFromPage() {
    console.log('[Najiz Extension] 📅 Extracting sessions from page...');
    
    const sessions = [];
    
    // البحث عن كاردات الجلسات (degree-box أو degree-1، degree-2)
    const sessionCards = document.querySelectorAll('.degree-box, [class*="degree-1"], [class*="degree-2"]');
    
    for (const card of sessionCards) {
        const cardText = card.textContent || '';
        
        // تجاهل إذا لم يكن جلسة
        if (!cardText.includes('جلسة')) continue;
        
        const session = {
            type: '',
            date: '',
            time: '',
            status: '',
            court: '',
            department: '',
            method: '',
            degree: ''
        };
        
        // نوع الجلسة (من الهيدر)
        const headerEl = card.querySelector('.case-update-card-header, .degree-header, [class*="header"]');
        if (headerEl) {
            session.type = headerEl.textContent?.trim();
        }
        
        // الدرجة (الأولى أو الثانية)
        if (card.classList.contains('degree-1') || card.closest('.degree-1')) {
            session.degree = 'الدرجة الأولى';
        } else if (card.classList.contains('degree-2') || card.closest('.degree-2')) {
            session.degree = 'الدرجة الثانية';
        }
        
        // استخراج من info-data-details
        const infoItems = card.querySelectorAll('.info-data-details, .row.header-text');
        for (const item of infoItems) {
            const title = item.querySelector('.info-data-details-title, .text-c-green')?.textContent?.trim() || '';
            const value = item.querySelector('.info-data-details-value, .text-info-value')?.textContent?.trim() || '';
            
            if (title.includes('تاريخ الجلسة') || title.includes('التاريخ')) {
                session.date = value;
            } else if (title.includes('وقت الجلسة') || title.includes('الوقت')) {
                session.time = value;
            } else if (title.includes('حالة الجلسة') || title.includes('الحالة')) {
                session.status = value;
            } else if (title.includes('المحكمة')) {
                session.court = value;
            } else if (title.includes('الدائرة')) {
                session.department = value;
            } else if (title.includes('آلية الانعقاد') || title.includes('الية الانعقاد')) {
                session.method = value;
            }
        }
        
        // استخراج التاريخ والوقت من النص إذا لم نجدهما
        if (!session.date) {
            const dateMatch = cardText.match(/[\u0660-\u0669\d]{4}\/[\u0660-\u0669\d]{2}\/[\u0660-\u0669\d]{2}/);
            if (dateMatch) session.date = dateMatch[0];
        }
        
        if (!session.time) {
            const timeMatch = cardText.match(/(\d{1,2}:\d{2})\s*[صم]?/);
            if (timeMatch) session.time = timeMatch[0];
        }
        
        // نوع الجلسة من النص إذا لم نجده
        if (!session.type) {
            const typeMatch = cardText.match(/(جلسة\s+\S+)/);
            if (typeMatch) session.type = typeMatch[1];
        }
        
        // تنظيف نوع الجلسة من التاريخ والوقت الملتصق
        if (session.type) {
            session.type = session.type
                .replace(/[\u0660-\u0669\d]{4}\/[\u0660-\u0669\d]{2}\/[\u0660-\u0669\d]{2}/g, '')
                .replace(/\d{1,2}:\d{2}\s*[صم]?/g, '')
                .trim();
        }
        
        // إضافة للقائمة إذا وجدنا بيانات
        if (session.type || session.date) {
            sessions.push(session);
            console.log('[Najiz] Found session:', session);
        }
    }
    
    // إذا لم نجد، نحاول بطريقة أخرى
    if (sessions.length === 0) {
        const allCards = document.querySelectorAll('.v-card');
        for (const card of allCards) {
            const text = card.textContent || '';
            if (text.includes('جلسة') && text.match(/[\u0660-\u0669\d]{4}\/[\u0660-\u0669\d]{2}\/[\u0660-\u0669\d]{2}/)) {
                const session = {
                    type: (text.match(/(جلسة\s+\S+)/) || ['جلسة'])[0],
                    date: (text.match(/[\u0660-\u0669\d]{4}\/[\u0660-\u0669\d]{2}\/[\u0660-\u0669\d]{2}/) || [''])[0],
                    status: text.includes('جديدة') ? 'جديدة' : text.includes('منتهية') ? 'منتهية' : ''
                };
                sessions.push(session);
            }
        }
    }
    
    console.log(`[Najiz Extension] Found ${sessions.length} sessions`);
    return sessions;
}

/**
 * النقر على تاب معين
 */
async function clickTab(tabId) {
    try {
        const tab = document.querySelector(`a[href="#${tabId}"], [href*="${tabId}"]`);
        if (tab) {
            tab.click();
            return true;
        }
    } catch (e) {
        console.log(`[Najiz] Could not click ${tabId}`);
    }
    return false;
}

/**
 * سحب كل القضايا مع التفاصيل الكاملة
 * يستخرج روابط القضايا ثم يفتح كل رابط في نافذة جديدة
 */
async function extractAllCasesWithDetails() {
    console.log('[Najiz Extension] 🚀 Starting FULL extraction with details...');
    
    const allCases = [];
    const processedCaseNumbers = new Set();
    
    // أولاً: جمع كل أرقام القضايا وروابطها من جميع الصفحات
    const totalPages = await getTotalPages();
    console.log(`[Najiz Extension] Total pages: ${totalPages}`);
    
    const caseLinks = [];
    
    // جمع روابط القضايا من كل الصفحات
    for (let page = 1; page <= totalPages; page++) {
        console.log(`[Najiz Extension] 📄 Collecting links from page ${page}/${totalPages}...`);
        showNotification(`جاري جمع روابط الصفحة ${page} من ${totalPages}...`, 'info');
        
        if (page > 1) {
            const navigated = await navigateToPage(page);
            if (!navigated) break;
            await new Promise(resolve => setTimeout(resolve, CONFIG.pageLoadDelay));
        }
        
        // البحث عن روابط القضايا
        const links = document.querySelectorAll('a[href*="case-file"]');
        for (const link of links) {
            const href = link.getAttribute('href');
            const text = link.closest('[class*="case"], .v-card')?.textContent || link.textContent || '';
            const caseNumber = (text.match(/(\d{10})/) || [])[1];
            
            if (href && caseNumber && !processedCaseNumbers.has(caseNumber)) {
                processedCaseNumbers.add(caseNumber);
                caseLinks.push({
                    url: href.startsWith('http') ? href : `https://najiz.sa${href}`,
                    caseNumber: caseNumber,
                    basicInfo: extractBasicCaseInfo(link.closest('[class*="case"], .v-card') || link)
                });
            }
        }
        
        // إذا لم نجد روابط، نحاول البحث بطريقة أخرى
        if (caseLinks.length === 0) {
            const caseCards = document.querySelectorAll('[class*="case"], .v-card');
            for (const card of caseCards) {
                const text = card.textContent || '';
                const caseNumber = (text.match(/(\d{10})/) || [])[1];
                if (caseNumber && !processedCaseNumbers.has(caseNumber)) {
                    processedCaseNumbers.add(caseNumber);
                    caseLinks.push({
                        caseNumber: caseNumber,
                        basicInfo: extractBasicCaseInfo(card),
                        element: card
                    });
                }
            }
        }
    }
    
    console.log(`[Najiz Extension] Found ${caseLinks.length} unique cases`);
    showNotification(`تم العثور على ${caseLinks.length} قضية، جاري سحب التفاصيل...`, 'info');
    
    // محاولة سحب التفاصيل من كل قضية
    for (let i = 0; i < caseLinks.length; i++) {
        const caseInfo = caseLinks[i];
        console.log(`[Najiz Extension] Processing ${i + 1}/${caseLinks.length}: ${caseInfo.caseNumber}`);
        showNotification(`جاري سحب قضية ${caseInfo.caseNumber} (${i + 1}/${caseLinks.length})...`, 'info');
        
        let caseData = caseInfo.basicInfo || { file_number: caseInfo.caseNumber };
        
        // محاولة فتح صفحة التفاصيل
        if (caseInfo.url) {
            try {
                const details = await fetchCaseDetails(caseInfo.url);
                if (details) {
                    caseData = { ...caseData, ...details };
                }
            } catch (e) {
                console.error(`[Najiz Extension] Error fetching details for ${caseInfo.caseNumber}:`, e);
            }
        } else if (caseInfo.element) {
            // محاولة النقر على زر عرض
            try {
                const clicked = await clickViewButton(caseInfo.element);
                if (clicked) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.pageLoadDelay));
                    if (window.location.href.includes('case-file')) {
                        const details = await extractFullCaseDetails();
                        caseData = { ...caseData, ...details };
                        window.history.back();
                        await new Promise(resolve => setTimeout(resolve, CONFIG.pageLoadDelay));
                    }
                }
            } catch (e) {
                console.error(`[Najiz Extension] Error clicking view for ${caseInfo.caseNumber}:`, e);
            }
        }
        
        allCases.push(caseData);
    }
    
    console.log(`[Najiz Extension] ✅ Total extracted: ${allCases.length} cases with details`);
    showNotification(`تم سحب ${allCases.length} قضية!`, 'success');
    
    return allCases;
}

/**
 * جلب تفاصيل القضية من URL باستخدام fetch (النسخة القديمة)
 * @deprecated استخدم fetchCaseDetails الجديدة
 */
async function fetchCaseDetailsLegacy(url) {
    try {
        console.log(`[Najiz Extension] Fetching details from: ${url}`);
        
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        // تحليل HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const pageText = doc.body?.innerText || '';
        
        // استخراج البيانات
        const caseData = {
            file_number: extractFieldFromText(pageText, /رقم القضية[\s\n:]*(\d{10})/),
            case_category: extractFieldFromText(pageText, /تصنيف القضية[\s\n:]*([^\n]+)/),
            case_type_arabic: extractFieldFromText(pageText, /نوع القضية[\s\n:]*([^\n]+)/),
            case_subject: extractCaseSubjectFromText(pageText),
            plaintiff_requests: extractFieldFromText(pageText, /طلبات المدعي[\s\n:]*([^]*?)(?=أسانيد الدعوى|مذكرة الدفاع|$)/),
            court: extractFieldFromText(pageText, /المحكمة[\s\n:]*([^\n]+)/),
            department: extractFieldFromText(pageText, /الدائرة[\s\n:]*([^\n]+)/),
            najiz_url: url,
            source: 'najiz'
        };
        
        // استخراج UUID
        const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch) {
            caseData.najiz_id = uuidMatch[1];
        }
        
        // نوع القضية
        caseData.case_type = mapCaseType(caseData.case_type_arabic || caseData.case_category);
        
        // الأطراف من النص
        caseData.parties = extractPartiesFromText(pageText);
        
        // المدعي والمدعى عليه
        if (caseData.parties && caseData.parties.length > 0) {
            const plaintiff = caseData.parties.find(p => p.side === 'plaintiff' && p.role !== 'محامي' && p.role !== 'محامى');
            const defendant = caseData.parties.find(p => p.side === 'defendant');
            
            if (plaintiff) caseData.plaintiff_name = plaintiff.name;
            if (defendant) caseData.defendant_name = defendant.name;
        }
        
        // الجلسات من النص
        caseData.sessions = extractSessionsFromText(pageText);
        
        // الجلسة القادمة
        if (caseData.sessions && caseData.sessions.length > 0) {
            const upcoming = caseData.sessions.find(s => s.status === 'جديدة');
            if (upcoming) {
                caseData.next_hearing = upcoming.date;
            }
        }
        
        console.log(`[Najiz Extension] Fetched details:`, caseData);
        return caseData;
        
    } catch (error) {
        console.error(`[Najiz Extension] Error fetching ${url}:`, error);
        return null;
    }
}

/**
 * استخراج حقل من نص
 */
function extractFieldFromText(text, pattern) {
    const match = text.match(pattern);
    if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, ' ');
    }
    return '';
}

/**
 * استخراج موضوع الدعوى من النص
 */
function extractCaseSubjectFromText(text) {
    const patterns = [
        /موضوع الدعوى[\s\n:]*([^]*?)(?=طلبات المدعي|أسانيد|مذكرة)/i,
        /موضوع الدعوى[\s\n:]*(.{100,3000})/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            let subject = match[1].trim().replace(/\s+/g, ' ');
            if (subject.length > 50) {
                return subject;
            }
        }
    }
    return '';
}

/**
 * استخراج الأطراف من النص
 */
function extractPartiesFromText(text) {
    const parties = [];
    
    // المدعين
    const plaintiffSection = text.match(/قائمة المدعين([^]*?)(?=قائمة المدعى عليهم|$)/i);
    if (plaintiffSection) {
        // نمط: اسم \n صفة \n هوية: رقم \n جنسية: قيمة
        const regex = /([^\n]+)\n(المدعي|محامى|محامي)\n(?:الهوية الوطنية|السجل التجاري)\s*:\s*(\d+)\n(?:الجنسية\s*:\s*([^\n]+))?/gi;
        let match;
        while ((match = regex.exec(plaintiffSection[1])) !== null) {
            parties.push({
                name: match[1].trim(),
                role: match[2].trim(),
                national_id: match[3].trim(),
                nationality: match[4]?.trim() || '',
                side: 'plaintiff'
            });
        }
    }
    
    // المدعى عليهم
    const defendantSection = text.match(/قائمة المدعى عليهم([^]*?)(?=\n\n|أطراف|الجلسات|$)/i);
    if (defendantSection) {
        const regex = /([^\n]+)\n(مدعى عليه|المدعى عليه)\n(?:الهوية الوطنية|السجل التجاري)\s*:\s*(\d+)/gi;
        let match;
        while ((match = regex.exec(defendantSection[1])) !== null) {
            parties.push({
                name: match[1].trim(),
                role: 'مدعى عليه',
                commercial_reg: match[3].trim(),
                side: 'defendant'
            });
        }
    }
    
    // إذا لم نجد، نحاول بشكل أبسط
    if (parties.length === 0) {
        const plaintiffMatch = text.match(/المدعي[\s\n:]+([^\n]+)/);
        if (plaintiffMatch) {
            parties.push({
                name: plaintiffMatch[1].trim().replace(/\.{3}$/, ''),
                role: 'المدعي',
                side: 'plaintiff'
            });
        }
        
        const defendantMatch = text.match(/المدعى عليه[\s\n:]+([^\n]+)/);
        if (defendantMatch) {
            parties.push({
                name: defendantMatch[1].trim().replace(/\.{3}$/, ''),
                role: 'المدعى عليه',
                side: 'defendant'
            });
        }
    }
    
    return parties;
}

/**
 * استخراج الجلسات من النص
 */
function extractSessionsFromText(text) {
    const sessions = [];
    
    // البحث عن نمط الجلسات
    const sessionPattern = /(جلسة\s+\S+)\s*\n?\s*([\u0660-\u0669\d]{4}\/[\u0660-\u0669\d]{2}\/[\u0660-\u0669\d]{2})\s*\n?\s*(\d{1,2}:\d{2}\s*[صم]?)?/gi;
    
    let match;
    while ((match = sessionPattern.exec(text)) !== null) {
        const session = {
            type: match[1].trim(),
            date: match[2],
            time: match[3]?.trim() || '',
            status: 'unknown'
        };
        
        // تحديد الحالة من السياق
        const context = text.substring(Math.max(0, match.index - 50), match.index + 200);
        if (context.includes('جديدة')) session.status = 'جديدة';
        else if (context.includes('منتهية')) session.status = 'منتهية';
        
        // المحكمة
        const courtMatch = context.match(/المحكمة\s+([^\n]+)/);
        if (courtMatch) session.court = courtMatch[1].trim();
        
        sessions.push(session);
    }
    
    return sessions;
}

/**
 * الحصول على كاردات القضايا مع أزرار العرض
 */
async function getCaseCardsWithViewButtons() {
    const cards = [];
    
    // البحث عن كاردات القضايا
    const possibleSelectors = [
        '[class*="case"]',
        '.v-card',
        '[class*="lawsuit"]'
    ];
    
    let elements = [];
    for (const selector of possibleSelectors) {
        const found = document.querySelectorAll(selector);
        const filtered = Array.from(found).filter(el => {
            const text = el.textContent || '';
            return /\d{10}/.test(text);
        });
        if (filtered.length > 0) {
            elements = filtered;
            break;
        }
    }
    
    for (const el of elements) {
        cards.push({
            element: el,
            text: el.textContent || ''
        });
    }
    
    return cards;
}

/**
 * النقر على زر عرض للقضية
 */
async function clickViewButton(caseElement) {
    // الخطوة 1: النقر على زر الثلاث نقاط
    const dotsButton = caseElement.querySelector('.mdi-dots-vertical, [class*="dots-vertical"]');
    
    if (dotsButton) {
        dotsButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // الخطوة 2: البحث عن زر "عرض" في القائمة المنسدلة
        const menuItems = document.querySelectorAll('.v-list-item, .v-menu__content button, .v-menu__content .v-list-item');
        
        for (const item of menuItems) {
            const text = item.textContent || '';
            if (text.includes('عرض')) {
                item.click();
                return true;
            }
        }
    }
    
    // محاولة بديلة: البحث عن رابط مباشر
    const viewLink = caseElement.querySelector('a[href*="case-file"]');
    if (viewLink) {
        viewLink.click();
        return true;
    }
    
    // محاولة ثالثة: النقر على الكارد نفسه
    const clickableArea = caseElement.querySelector('[class*="clickable"], .cursor-pointer');
    if (clickableArea) {
        clickableArea.click();
        return true;
    }
    
    return false;
}

/**
 * سحب كل القضايا من جميع الصفحات عبر API (في الخلفية) - البيانات الأساسية فقط
 */
async function extractAllCasesViaAPI() {
    console.log('[Najiz Extension] 🚀 Fetching ALL cases (basic info only)...');
    
    const allCases = [];
    let page = 1;
    
    // أولاً: نحاول سحب من الصفحة الحالية
    const currentPageCases = await extractCasesFromCurrentPage();
    console.log(`[Najiz Extension] Page 1: ${currentPageCases.length} cases`);
    allCases.push(...currentPageCases);
    
    // محاولة جلب المزيد من الصفحات بالنقر على زر التالي
    const totalPages = await getTotalPages();
    console.log(`[Najiz Extension] Total pages detected: ${totalPages}`);
    
    if (totalPages > 1) {
        showNotification(`جاري سحب ${totalPages} صفحة...`, 'info');
        
        for (page = 2; page <= totalPages; page++) {
            try {
                console.log(`[Najiz Extension] Fetching page ${page}/${totalPages}...`);
                
                // النقر على زر الصفحة التالية
                const navigated = await navigateToPage(page);
                
                if (navigated) {
                    // انتظار تحميل البيانات
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // سحب القضايا من الصفحة
                    const pageCases = await extractCasesFromCurrentPage();
                    console.log(`[Najiz Extension] Page ${page}: ${pageCases.length} cases`);
                    
                    // إزالة المكررات
                    pageCases.forEach(c => {
                        if (!allCases.find(existing => existing.file_number === c.file_number)) {
                            allCases.push(c);
                        }
                    });
                    
                    // تحديث الإشعار
                    showNotification(`تم سحب ${allCases.length} قضية (صفحة ${page}/${totalPages})`, 'info');
                } else {
                    console.log(`[Najiz Extension] Could not navigate to page ${page}`);
                    break;
                }
            } catch (error) {
                console.error(`[Najiz Extension] Error fetching page ${page}:`, error);
                break;
            }
        }
    }
    
    console.log(`[Najiz Extension] ✅ Total extracted: ${allCases.length} cases`);
    return allCases;
}

/**
 * الحصول على عدد الصفحات الكلي
 */
async function getTotalPages() {
    // البحث عن عنصر يظهر عدد الصفحات
    const paginationInfo = document.querySelector('.v-pagination, [class*="pagination"]');
    
    if (paginationInfo) {
        // البحث عن آخر رقم صفحة
        const pageButtons = paginationInfo.querySelectorAll('button, .v-pagination__item, [class*="page"]');
        let maxPage = 1;
        
        pageButtons.forEach(btn => {
            const num = parseInt(btn.textContent?.trim());
            if (!isNaN(num) && num > maxPage) {
                maxPage = num;
            }
        });
        
        return maxPage;
    }
    
    // البحث في النص عن "صفحة X من Y"
    const bodyText = document.body.innerText;
    const pageMatch = bodyText.match(/صفحة\s*\d+\s*من\s*(\d+)/i) ||
                      bodyText.match(/(\d+)\s*صفحة/i) ||
                      bodyText.match(/(\d+)\s*من\s*(\d+)/);
    
    if (pageMatch) {
        return parseInt(pageMatch[1]) || parseInt(pageMatch[2]) || 1;
    }
    
    // حساب من إجمالي العناصر
    const totalMatch = bodyText.match(/(\d+)\s*(?:قضية|نتيجة|عنصر)/i);
    if (totalMatch) {
        const total = parseInt(totalMatch[1]);
        return Math.ceil(total / 20); // 20 عنصر لكل صفحة
    }
    
    return 1;
}

/**
 * الانتقال إلى صفحة معينة
 */
async function navigateToPage(pageNumber) {
    // البحث عن زر الصفحة المطلوبة
    const selectors = [
        `.v-pagination button:contains("${pageNumber}")`,
        `.v-pagination__item[aria-label*="${pageNumber}"]`,
        `[class*="pagination"] button:nth-child(${pageNumber + 1})`,
        `button[aria-label="Go to page ${pageNumber}"]`,
        `.v-pagination__navigation:last-child` // زر التالي
    ];
    
    // محاولة إيجاد الزر بطرق مختلفة
    let targetButton = null;
    
    // البحث عن زر يحتوي الرقم المطلوب
    const allButtons = document.querySelectorAll('.v-pagination button, [class*="pagination"] button');
    
    for (const btn of allButtons) {
        const btnText = btn.textContent?.trim();
        if (btnText === String(pageNumber)) {
            targetButton = btn;
            break;
        }
    }
    
    // إذا لم نجد الرقم، نبحث عن زر "التالي"
    if (!targetButton) {
        const nextSelectors = [
            '.v-pagination__navigation:last-child',
            '[class*="next"]',
            'button[aria-label*="Next"]',
            'button[aria-label*="التالي"]'
        ];
        
        for (const sel of nextSelectors) {
            targetButton = document.querySelector(sel);
            if (targetButton && !targetButton.disabled) break;
        }
    }
    
    if (targetButton && !targetButton.disabled) {
        targetButton.click();
        return true;
    }
    
    return false;
}

/**
 * سحب قائمة القضايا (يستخدم الطريقة المناسبة تلقائياً)
 */
async function extractCasesList() {
    console.log('[Najiz Extension] Extracting cases list...');
    
    // انتظار تحميل الصفحة
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // التحقق من عدد الصفحات
    const totalPages = await getTotalPages();
    console.log(`[Najiz Extension] Detected ${totalPages} pages`);
    
    if (totalPages > 1) {
        // سحب كل الصفحات
        return await extractAllCasesViaAPI();
    } else {
        // سحب الصفحة الحالية فقط
        return await extractCasesFromCurrentPage();
    }
}

/**
 * استخراج من النص مباشرة
 */
function extractCasesFromText() {
    const cases = [];
    const bodyText = document.body.innerText;
    
    // البحث عن أنماط أرقام القضايا
    const caseNumberPattern = /(\d{1,2}\/\d{4,}|\d{4,}\/\d+)/g;
    const matches = bodyText.match(caseNumberPattern) || [];
    
    console.log('[Najiz Extension] Found case numbers in text:', matches);
    
    matches.forEach((num, index) => {
        cases.push({
            file_number: num,
            source: 'najiz',
            najiz_id: `text-${index}`,
            najiz_url: window.location.href
        });
    });
    
    return cases;
}

/**
 * استخراج نمط من نص
 */
function extractPattern(text, pattern) {
    if (!text) return '';
    const match = text.match(pattern);
    return match ? match[0] : '';
}

/**
 * سحب تفاصيل قضية واحدة
 */
async function extractCaseDetail() {
    console.log('[Najiz Extension] Extracting case details...');
    
    const selectors = CONFIG.selectors.caseDetail;
    
    // انتظار تحميل الصفحة
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // استخراج البيانات من عناصر مختلفة
    const extractFromPage = () => {
        const data = {};
        
        // البحث في جميع العناصر النصية
        const allText = document.body.innerText;
        
        // رقم القضية
        const caseNumberMatch = allText.match(/رقم\s*القضية[:\s]*([^\n]+)/i) ||
                                allText.match(/رقم\s*الطلب[:\s]*([^\n]+)/i) ||
                                allText.match(/رقم\s*الملف[:\s]*([^\n]+)/i);
        if (caseNumberMatch) {
            data.file_number = caseNumberMatch[1].trim();
        }
        
        // المحكمة
        const courtMatch = allText.match(/المحكمة[:\s]*([^\n]+)/i) ||
                          allText.match(/الجهة[:\s]*([^\n]+)/i);
        if (courtMatch) {
            data.court = courtMatch[1].trim();
        }
        
        // نوع القضية
        const typeMatch = allText.match(/نوع\s*القضية[:\s]*([^\n]+)/i) ||
                         allText.match(/التصنيف[:\s]*([^\n]+)/i);
        if (typeMatch) {
            data.case_type = mapCaseType(typeMatch[1].trim());
        }
        
        // الحالة
        const statusMatch = allText.match(/حالة\s*القضية[:\s]*([^\n]+)/i) ||
                           allText.match(/الحالة[:\s]*([^\n]+)/i);
        if (statusMatch) {
            data.status = mapCaseStatus(statusMatch[1].trim());
        }
        
        // الجلسة القادمة
        const hearingMatch = allText.match(/الجلسة\s*القادمة[:\s]*([^\n]+)/i) ||
                            allText.match(/موعد\s*الجلسة[:\s]*([^\n]+)/i);
        if (hearingMatch) {
            data.next_hearing = hearingMatch[1].trim();
        }
        
        // المدعي
        const plaintiffMatch = allText.match(/المدعي[:\s]*([^\n]+)/i) ||
                              allText.match(/صاحب\s*الطلب[:\s]*([^\n]+)/i);
        if (plaintiffMatch) {
            data.client_name = plaintiffMatch[1].trim();
        }
        
        // المدعى عليه
        const defendantMatch = allText.match(/المدعى\s*عليه[:\s]*([^\n]+)/i);
        if (defendantMatch) {
            data.opponent_name = defendantMatch[1].trim();
        }
        
        // تاريخ القيد
        const filingMatch = allText.match(/تاريخ\s*القيد[:\s]*([^\n]+)/i) ||
                           allText.match(/تاريخ\s*التقديم[:\s]*([^\n]+)/i);
        if (filingMatch) {
            data.filing_date = parseArabicDate(filingMatch[1].trim());
        }
        
        return data;
    };
    
    // محاولة استخدام السيليكتورات أولاً
    let caseData = {
        file_number: '',
        title: '',
        court: '',
        case_type: 'other',
        status: 'active',
        client_name: '',
        opponent_name: '',
        filing_date: null,
        next_hearing: null,
        description: '',
        source: 'najiz',
        najiz_url: window.location.href
    };
    
    // استخراج من السيليكتورات
    for (const [key, selector] of Object.entries(selectors)) {
        if (typeof selector === 'string') {
            const value = getText(document, selector.split(', '));
            if (value) {
                caseData[key] = value;
            }
        }
    }
    
    // دمج مع البيانات المستخرجة من النص
    const pageData = extractFromPage();
    caseData = { ...caseData, ...pageData };
    
    // تنظيف البيانات
    caseData.case_type = mapCaseType(caseData.case_type);
    caseData.status = mapCaseStatus(caseData.status);
    caseData.title = caseData.title || `قضية ${caseData.file_number}`;
    
    console.log('[Najiz Extension] Extracted case data:', caseData);
    return caseData;
}

/**
 * سحب أحداث التقويم
 */
async function extractCalendar() {
    console.log('[Najiz Extension] Extracting calendar events...');
    
    const events = [];
    const selectors = CONFIG.selectors.calendar;
    
    // انتظار تحميل التقويم
    await waitForElement('.v-calendar, .calendar-container').catch(() => {});
    
    const eventElements = document.querySelectorAll(selectors.events);
    
    eventElements.forEach((event) => {
        try {
            const eventData = {
                title: getText(event, selectors.eventTitle),
                date: parseArabicDate(getText(event, selectors.eventDate)),
                time: getText(event, selectors.eventTime),
                type: 'hearing',
                source: 'najiz'
            };
            
            if (eventData.title || eventData.date) {
                events.push(eventData);
            }
        } catch (error) {
            console.error('Error extracting event:', error);
        }
    });
    
    // محاولة استخراج من النص إذا لم نجد عناصر
    if (events.length === 0) {
        const allText = document.body.innerText;
        const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})\s*-?\s*([^\n]+)/g;
        let match;
        
        while ((match = datePattern.exec(allText)) !== null) {
            events.push({
                date: parseArabicDate(match[1]),
                title: match[2].trim(),
                type: 'hearing',
                source: 'najiz'
            });
        }
    }
    
    console.log(`[Najiz Extension] Found ${events.length} events`);
    return events;
}

/**
 * سحب الوكالات
 */
async function extractWekalat() {
    console.log('[Najiz Extension] Extracting powers of attorney...');
    
    const wekalat = [];
    const selectors = CONFIG.selectors.wekalat;
    
    // انتظار تحميل الجدول
    await waitForElement('.v-data-table, .wekalat-list').catch(() => {});
    
    const rows = document.querySelectorAll(selectors.container);
    
    rows.forEach((row) => {
        try {
            const wekalatData = {
                number: getText(row, selectors.number.split(', ')),
                type: getText(row, selectors.type.split(', ')),
                principal: getText(row, selectors.principal.split(', ')),
                agent: getText(row, selectors.agent.split(', ')),
                status: getText(row, selectors.status.split(', ')),
                expiry_date: parseArabicDate(getText(row, selectors.expiryDate.split(', '))),
                source: 'najiz'
            };
            
            if (wekalatData.number || wekalatData.principal) {
                wekalat.push(wekalatData);
            }
        } catch (error) {
            console.error('Error extracting wekalat:', error);
        }
    });
    
    console.log(`[Najiz Extension] Found ${wekalat.length} powers of attorney`);
    return wekalat;
}

// ========================================
// Message Handler
// ========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Najiz Extension] Received message:', request.action);
    
    const handleRequest = async () => {
        try {
            switch (request.action) {
                case 'extractCasesList':
                    // سحب كل الصفحات (بيانات أساسية)
                    const cases = await extractCasesList();
                    return { success: true, data: cases };
                
                case 'extractCurrentPage':
                    // سحب الصفحة الحالية فقط (بيانات أساسية)
                    const currentPageCases = await extractCasesFromCurrentPage();
                    return { success: true, data: currentPageCases };
                
                case 'extractWithDetails':
                    // سحب مع التفاصيل الكاملة تلقائياً
                    // هذا سيبدأ عملية تتابعية وسيتم التنقل بين الصفحات
                    await extractCasesWithAutoDetails();
                    // إذا وصلنا هنا فإما لم تكن هناك قضايا أو حدث خطأ
                    // لأن في الحالة العادية ستتغير الصفحة
                    return { success: true, data: null, message: 'Extraction started - navigating to cases' };
                
                case 'stopExtraction':
                    // إيقاف عملية الاستخراج
                    await stopExtraction();
                    return { success: true, message: 'Extraction stopped' };
                    
                case 'getExtractionStatus':
                    // الحصول على حالة الاستخراج
                    const status = await chrome.storage.local.get([
                        'extractionActive', 
                        'extractionIndex', 
                        'extractionQueue',
                        'extractedCases'
                    ]);
                    return { 
                        success: true, 
                        data: {
                            active: status.extractionActive || false,
                            current: (status.extractionIndex || 0) + 1,
                            total: status.extractionQueue?.length || 0,
                            extracted: status.extractedCases?.length || 0
                        }
                    };
                
                case 'getLastExtractedCases':
                    // الحصول على آخر قضايا مستخرجة
                    const lastData = await chrome.storage.local.get(['lastExtractedCases']);
                    return { success: true, data: lastData.lastExtractedCases || [] };
                
                case 'extractAllWithDetails':
                    // سحب كل القضايا مع التفاصيل (الطريقة القديمة)
                    const allCasesWithDetails = await extractAllCasesWithDetails();
                    return { success: true, data: allCasesWithDetails };
                    
                case 'extractCaseDetail':
                    // سحب تفاصيل القضية الحالية
                    const caseData = await extractFullCaseDetails();
                    return { success: true, data: caseData };
                    
                case 'extractCalendar':
                    const events = await extractCalendar();
                    return { success: true, data: events };
                    
                case 'extractWekalat':
                    const wekalat = await extractWekalat();
                    return { success: true, data: wekalat };
                    
                case 'ping':
                    return { success: true, message: 'pong' };
                    
                default:
                    return { success: false, error: 'Unknown action' };
            }
        } catch (error) {
            console.error('[Najiz Extension] Error:', error);
            return { success: false, error: error.message };
        }
    };
    
    handleRequest().then(sendResponse);
    return true; // للإشارة إلى أننا سنرد بشكل غير متزامن
});

// ========================================
// Initialization
// ========================================
console.log('[Najiz Extension] Content script loaded on:', window.location.href);

// حقن شريط الأدوات
injectToolbar();

/**
 * حقن شريط أدوات في الصفحة
 */
function injectToolbar() {
    // التحقق من وجود الشريط مسبقاً
    if (document.getElementById('najiz-law-toolbar')) {
        return;
    }
    
    const toolbar = document.createElement('div');
    toolbar.id = 'najiz-law-toolbar';
    toolbar.innerHTML = `
        <div class="nlt-container">
            <div class="nlt-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#fff" stroke-width="2"/>
                    <path d="M2 17L12 22L22 17" stroke="#fff" stroke-width="2"/>
                    <path d="M2 12L12 17L22 12" stroke="#fff" stroke-width="2"/>
                </svg>
                <span>إدارة المحاماة</span>
            </div>
            <div class="nlt-actions">
                <button class="nlt-btn" id="nlt-extract" title="سحب البيانات">
                    <span>📥</span> سحب
                </button>
                <button class="nlt-btn nlt-btn-success" id="nlt-sync" title="مزامنة مع النظام">
                    <span>🔄</span> مزامنة
                </button>
                <button class="nlt-btn-icon" id="nlt-minimize" title="تصغير">
                    ➖
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toolbar);
    
    // أحداث الأزرار
    document.getElementById('nlt-extract')?.addEventListener('click', async () => {
        const btn = document.getElementById('nlt-extract');
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> جاري السحب...';
        
        try {
            const url = window.location.href;
            let result;
            
            if (url.includes('case-file')) {
                result = await extractCaseDetail();
            } else if (url.includes('calendar')) {
                result = await extractCalendar();
            } else if (url.includes('wekalat')) {
                result = await extractWekalat();
            } else {
                result = await extractCasesList();
            }
            
            console.log('Extracted data:', result);
            showNotification('تم سحب البيانات بنجاح!', 'success');
        } catch (error) {
            showNotification('فشل سحب البيانات: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>📥</span> سحب';
        }
    });
    
    document.getElementById('nlt-sync')?.addEventListener('click', async () => {
        showNotification('جاري المزامنة...', 'info');
        // سيتم تنفيذ المزامنة من خلال الـ popup
    });
    
    document.getElementById('nlt-minimize')?.addEventListener('click', () => {
        toolbar.classList.toggle('minimized');
    });
}

/**
 * عرض إشعار
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `nlt-notification nlt-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
