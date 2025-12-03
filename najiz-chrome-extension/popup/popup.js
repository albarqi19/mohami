/**
 * إدارة المحاماة - ناجز
 * Popup JavaScript
 */

// ========================================
// Global Variables
// ========================================
let currentTab = null;
let pageType = 'unsupported';
let settings = {
    apiUrl: 'http://localhost:8000/api/v1',
    apiToken: ''
};

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await detectCurrentPage();
    setupEventListeners();
    await testConnectionSilent();
    log('الإضافة جاهزة للعمل', 'info');
});

// ========================================
// Settings Management
// ========================================
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiUrl', 'apiToken'], (result) => {
            if (result.apiUrl) {
                settings.apiUrl = result.apiUrl;
                document.getElementById('apiUrl').value = result.apiUrl;
            }
            if (result.apiToken) {
                settings.apiToken = result.apiToken;
                document.getElementById('apiToken').value = result.apiToken;
            }
            resolve();
        });
    });
}

async function saveSettings() {
    settings.apiUrl = document.getElementById('apiUrl').value.trim();
    settings.apiToken = document.getElementById('apiToken').value.trim();
    
    return new Promise((resolve) => {
        chrome.storage.local.set({
            apiUrl: settings.apiUrl,
            apiToken: settings.apiToken
        }, () => {
            log('تم حفظ الإعدادات بنجاح', 'success');
            resolve();
        });
    });
}

// ========================================
// Page Detection
// ========================================
async function detectCurrentPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    const url = tab.url || '';
    const pageTypeElement = document.getElementById('pageType');
    
    // تحديد نوع الصفحة
    if (url.includes('najiz.sa/applications/lawsuit/cases/case-file')) {
        pageType = 'case-detail';
        pageTypeElement.textContent = '📄 صفحة تفاصيل قضية';
        showToolCard('caseDetailToolCard');
        await loadCasePreview();
    } else if (url.includes('najiz.sa/applications/lawsuit/calendar')) {
        pageType = 'calendar';
        pageTypeElement.textContent = '📅 صفحة التقويم';
        showToolCard('calendarToolCard');
    } else if (url.includes('najiz.sa/applications/lawsuit')) {
        pageType = 'cases-list';
        pageTypeElement.textContent = '📋 صفحة قائمة القضايا';
        showToolCard('casesToolCard');
    } else if (url.includes('najiz.sa/applications/wekalat')) {
        pageType = 'wekalat';
        pageTypeElement.textContent = '📜 صفحة الوكالات';
        showToolCard('wekalatToolCard');
    } else if (url.includes('najiz.sa')) {
        pageType = 'najiz-other';
        pageTypeElement.textContent = '🌐 منصة ناجز';
        pageTypeElement.classList.add('unsupported');
        showToolCard('unsupportedCard');
    } else {
        pageType = 'unsupported';
        pageTypeElement.textContent = '❌ صفحة غير مدعومة';
        pageTypeElement.classList.add('unsupported');
        showToolCard('unsupportedCard');
    }
}

function showToolCard(cardId) {
    // إخفاء جميع البطاقات
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => card.style.display = 'none');
    
    // إظهار البطاقة المطلوبة
    const targetCard = document.getElementById(cardId);
    if (targetCard) {
        targetCard.style.display = 'block';
    }
}

// ========================================
// Case Preview
// ========================================
async function loadCasePreview() {
    const previewContainer = document.getElementById('casePreview');
    previewContainer.innerHTML = '<div style="text-align: center; color: #666;">جاري تحميل البيانات...</div>';
    
    try {
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractCaseDetail'
        });
        
        if (result && result.success && result.data) {
            const data = result.data;
            previewContainer.innerHTML = `
                <div class="case-preview-item">
                    <span class="case-preview-label">رقم القضية:</span>
                    <span class="case-preview-value">${data.caseNumber || 'غير محدد'}</span>
                </div>
                <div class="case-preview-item">
                    <span class="case-preview-label">المحكمة:</span>
                    <span class="case-preview-value">${data.court || 'غير محدد'}</span>
                </div>
                <div class="case-preview-item">
                    <span class="case-preview-label">الحالة:</span>
                    <span class="case-preview-value">${data.status || 'غير محدد'}</span>
                </div>
                <div class="case-preview-item">
                    <span class="case-preview-label">الجلسة القادمة:</span>
                    <span class="case-preview-value">${data.nextHearing || 'غير محدد'}</span>
                </div>
            `;
        } else {
            previewContainer.innerHTML = '<div style="text-align: center; color: #dc3545;">تعذر تحميل البيانات</div>';
        }
    } catch (error) {
        console.error('Error loading preview:', error);
        previewContainer.innerHTML = '<div style="text-align: center; color: #dc3545;">تعذر الاتصال بالصفحة</div>';
    }
}

// ========================================
// API Connection
// ========================================
async function testConnection() {
    updateConnectionStatus('checking');
    log('جاري اختبار الاتصال...', 'info');
    
    try {
        const response = await fetch(`${settings.apiUrl}/simple/hello`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            updateConnectionStatus('connected');
            log('تم الاتصال بنجاح!', 'success');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        updateConnectionStatus('disconnected');
        log(`فشل الاتصال: ${error.message}`, 'error');
        return false;
    }
}

async function testConnectionSilent() {
    try {
        const response = await fetch(`${settings.apiUrl}/simple/hello`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            updateConnectionStatus('connected');
            return true;
        }
    } catch (error) {
        updateConnectionStatus('disconnected');
    }
    return false;
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('.status-text');
    
    dot.className = 'status-dot ' + status;
    
    switch (status) {
        case 'connected':
            text.textContent = 'متصل';
            break;
        case 'disconnected':
            text.textContent = 'غير متصل';
            break;
        case 'checking':
            text.textContent = 'جاري الاتصال...';
            break;
    }
}

// ========================================
// Data Extraction
// ========================================

/**
 * سحب القضايا من الصفحة الحالية فقط
 */
async function extractCurrentPageOnly() {
    const statusEl = document.getElementById('casesStatus');
    setStatus(statusEl, 'loading', 'جاري سحب الصفحة الحالية...');
    log('بدء سحب الصفحة الحالية...', 'info');
    
    try {
        // استخدام action مختلف للصفحة الحالية فقط
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractCurrentPage'
        });
        
        if (result && result.success && result.data) {
            log(`تم سحب ${result.data.length} قضية من الصفحة الحالية`, 'success');
            
            // إرسال للـ API
            const apiResult = await sendToAPI('/najiz/cases/import', { cases: result.data });
            
            if (apiResult.success) {
                const data = apiResult.data.data || apiResult.data;
                setStatus(statusEl, 'success', `✅ تم: ${data.imported || 0} جديد، ${data.updated || 0} تحديث`);
                log('تم حفظ القضايا في قاعدة البيانات', 'success');
            } else {
                setStatus(statusEl, 'error', `فشل الحفظ: ${apiResult.error}`);
                log(`فشل الحفظ: ${apiResult.error}`, 'error');
            }
        } else {
            setStatus(statusEl, 'error', 'لم يتم العثور على قضايا');
            log('لم يتم العثور على قضايا في الصفحة', 'error');
        }
    } catch (error) {
        setStatus(statusEl, 'error', `خطأ: ${error.message}`);
        log(`خطأ في سحب القضايا: ${error.message}`, 'error');
    }
}

/**
 * سحب كل القضايا من جميع الصفحات
 */
async function extractAllPages() {
    const statusEl = document.getElementById('casesStatus');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    setStatus(statusEl, 'loading', '🚀 جاري سحب كل الصفحات (سريع)...');
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'جاري التحضير...';
    log('بدء سحب كل الصفحات (بيانات أساسية)...', 'info');
    
    try {
        // إرسال طلب سحب كل الصفحات
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractCasesList'  // هذا سيسحب كل الصفحات تلقائياً
        });
        
        if (result && result.success && result.data) {
            const casesCount = result.data.length;
            progressFill.style.width = '100%';
            progressText.textContent = `تم سحب ${casesCount} قضية`;
            log(`✅ تم سحب ${casesCount} قضية من كل الصفحات`, 'success');
            
            // إرسال للـ API على دفعات
            const batchSize = 50;
            let totalImported = 0;
            let totalUpdated = 0;
            let totalErrors = 0;
            
            for (let i = 0; i < result.data.length; i += batchSize) {
                const batch = result.data.slice(i, i + batchSize);
                const progress = Math.round(((i + batch.length) / result.data.length) * 100);
                
                progressText.textContent = `جاري الحفظ... ${progress}%`;
                
                const apiResult = await sendToAPI('/najiz/cases/import', { cases: batch });
                
                if (apiResult.success) {
                    const data = apiResult.data.data || apiResult.data;
                    totalImported += data.imported || 0;
                    totalUpdated += data.updated || 0;
                    // حساب الأخطاء - قد تكون array أو رقم
                    const batchErrors = data.errors;
                    if (Array.isArray(batchErrors)) {
                        totalErrors += batchErrors.length;
                    } else if (typeof batchErrors === 'number') {
                        totalErrors += batchErrors;
                    }
                }
            }
            
            progressContainer.style.display = 'none';
            setStatus(statusEl, 'success', `✅ تم: ${totalImported} جديد، ${totalUpdated} تحديث، ${totalErrors} أخطاء`);
            log(`تم حفظ ${totalImported + totalUpdated} قضية في قاعدة البيانات`, 'success');
        } else {
            progressContainer.style.display = 'none';
            setStatus(statusEl, 'error', 'لم يتم العثور على قضايا');
            log('لم يتم العثور على قضايا في الصفحة', 'error');
        }
    } catch (error) {
        progressContainer.style.display = 'none';
        setStatus(statusEl, 'error', `خطأ: ${error.message}`);
        log(`خطأ في سحب القضايا: ${error.message}`, 'error');
    }
}

/**
 * سحب كل القضايا مع التفاصيل الكاملة - نسخة سريعة
 */
async function extractWithFullDetails() {
    const statusEl = document.getElementById('casesStatus');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    setStatus(statusEl, 'loading', '🚀 جاري السحب السريع بالتوازي...');
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'جاري جمع روابط القضايا...';
    log('بدء السحب السريع - 5 قضايا بالتوازي!', 'info');
    
    try {
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractWithDetails'
        });
        
        if (result && result.success && result.data) {
            const casesCount = result.data.length;
            progressFill.style.width = '100%';
            progressText.textContent = `تم سحب ${casesCount} قضية!`;
            
            // عد القضايا التي لها بيانات كاملة
            const withParties = result.data.filter(c => c.parties?.length > 0).length;
            const withSessions = result.data.filter(c => c.sessions?.length > 0).length;
            const withSubject = result.data.filter(c => c.case_subject).length;
            
            log(`✅ تم سحب ${casesCount} قضية`, 'success');
            log(`   📋 ${withParties} مع أطراف، ${withSessions} مع جلسات، ${withSubject} مع موضوع`, 'info');
            
            progressContainer.style.display = 'none';
            setStatus(statusEl, 'success', `✅ تم سحب ${casesCount} قضية وحفظها!`);
        } else {
            progressContainer.style.display = 'none';
            setStatus(statusEl, 'error', result?.error || 'لم يتم العثور على قضايا');
            log(result?.error || 'فشل السحب', 'error');
        }
    } catch (error) {
        progressContainer.style.display = 'none';
        setStatus(statusEl, 'error', `خطأ: ${error.message}`);
        log(`خطأ: ${error.message}`, 'error');
    }
}

async function extractCases() {
    // استخدام سحب كل الصفحات افتراضياً
    await extractAllPages();
}

async function extractCaseDetail() {
    const statusEl = document.getElementById('caseDetailStatus');
    setStatus(statusEl, 'loading', 'جاري سحب تفاصيل القضية...');
    log('بدء سحب تفاصيل القضية...', 'info');
    
    try {
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractCaseDetail'
        });
        
        if (result && result.success && result.data) {
            log('تم سحب تفاصيل القضية', 'success');
            
            // إرسال للـ API
            const apiResult = await sendToAPI('/najiz/case', result.data);
            
            if (apiResult.success) {
                setStatus(statusEl, 'success', 'تم حفظ القضية بنجاح');
                log('تم حفظ القضية في قاعدة البيانات', 'success');
            } else {
                setStatus(statusEl, 'error', `فشل الحفظ: ${apiResult.error}`);
                log(`فشل الحفظ: ${apiResult.error}`, 'error');
            }
        } else {
            setStatus(statusEl, 'error', 'لم يتم العثور على بيانات');
            log('لم يتم العثور على بيانات القضية', 'error');
        }
    } catch (error) {
        setStatus(statusEl, 'error', `خطأ: ${error.message}`);
        log(`خطأ في سحب القضية: ${error.message}`, 'error');
    }
}

async function extractCalendar() {
    const statusEl = document.getElementById('calendarStatus');
    setStatus(statusEl, 'loading', 'جاري سحب المواعيد...');
    log('بدء سحب المواعيد...', 'info');
    
    try {
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractCalendar'
        });
        
        if (result && result.success && result.data) {
            log(`تم سحب ${result.data.length} موعد`, 'success');
            
            // إرسال للـ API
            const apiResult = await sendToAPI('/najiz/appointments/import', { appointments: result.data });
            
            if (apiResult.success) {
                const data = apiResult.data.data || apiResult.data;
                setStatus(statusEl, 'success', `تم: ${data.imported || 0} جديد، ${data.updated || 0} تحديث`);
                log('تم حفظ المواعيد في قاعدة البيانات', 'success');
            } else {
                setStatus(statusEl, 'error', `فشل الحفظ: ${apiResult.error}`);
            }
        } else {
            setStatus(statusEl, 'error', 'لم يتم العثور على مواعيد');
        }
    } catch (error) {
        setStatus(statusEl, 'error', `خطأ: ${error.message}`);
        log(`خطأ في سحب المواعيد: ${error.message}`, 'error');
    }
}

async function extractWekalat() {
    const statusEl = document.getElementById('wekalatStatus');
    setStatus(statusEl, 'loading', 'جاري سحب الوكالات...');
    log('بدء سحب الوكالات...', 'info');
    
    try {
        const result = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'extractWekalat'
        });
        
        if (result && result.success && result.data) {
            log(`تم سحب ${result.data.length} وكالة`, 'success');
            setStatus(statusEl, 'success', `تم سحب ${result.data.length} وكالة`);
        } else {
            setStatus(statusEl, 'error', 'لم يتم العثور على وكالات');
        }
    } catch (error) {
        setStatus(statusEl, 'error', `خطأ: ${error.message}`);
        log(`خطأ في سحب الوكالات: ${error.message}`, 'error');
    }
}

// ========================================
// API Communication
// ========================================
async function sendToAPI(endpoint, data) {
    try {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        if (settings.apiToken) {
            headers['Authorization'] = `Bearer ${settings.apiToken}`;
        }
        
        const response = await fetch(`${settings.apiUrl}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            return { success: true, data: result };
        } else {
            return { success: false, error: result.message || 'Unknown error' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========================================
// UI Helpers
// ========================================
function setStatus(element, type, message) {
    element.className = `extraction-status ${type}`;
    element.textContent = message;
    element.style.display = 'block';
}

function log(message, type = '') {
    const container = document.getElementById('logContainer');
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    
    const time = new Date().toLocaleTimeString('ar-SA');
    item.textContent = `[${time}] ${message}`;
    
    container.insertBefore(item, container.firstChild);
    
    // الحفاظ على آخر 50 سجل فقط
    while (container.children.length > 50) {
        container.removeChild(container.lastChild);
    }
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // حفظ الإعدادات
    document.getElementById('saveSettings').addEventListener('click', async () => {
        await saveSettings();
        await testConnection();
    });
    
    // اختبار الاتصال
    document.getElementById('testConnection').addEventListener('click', testConnection);
    
    // سحب القضايا
    document.getElementById('extractAllCases')?.addEventListener('click', extractAllPages);
    document.getElementById('extractCurrentPage')?.addEventListener('click', extractCurrentPageOnly);
    document.getElementById('extractWithDetails')?.addEventListener('click', extractWithFullDetails);
    
    // سحب تفاصيل قضية
    document.getElementById('extractCaseDetail')?.addEventListener('click', extractCaseDetail);
    document.getElementById('viewCaseData')?.addEventListener('click', async () => {
        try {
            const result = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'extractCaseDetail'
            });
            if (result && result.success && result.data) {
                console.log('Case Data:', result.data);
                // عرض البيانات في نافذة جديدة
                const dataWindow = window.open('', '_blank', 'width=800,height=600');
                dataWindow.document.write(`
                    <html dir="rtl">
                    <head>
                        <title>بيانات القضية</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                            pre { background: white; padding: 20px; border-radius: 8px; overflow: auto; direction: ltr; }
                            h2 { color: #00AD68; }
                        </style>
                    </head>
                    <body>
                        <h2>بيانات القضية</h2>
                        <pre>${JSON.stringify(result.data, null, 2)}</pre>
                    </body>
                    </html>
                `);
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في جلب البيانات: ' + error.message);
        }
    });
    
    // سحب التقويم
    document.getElementById('extractCalendar')?.addEventListener('click', extractCalendar);
    
    // سحب الوكالات
    document.getElementById('extractWekalat')?.addEventListener('click', extractWekalat);
    
    // طي/فتح السجل
    document.querySelector('.log-section h3')?.addEventListener('click', function() {
        this.parentElement.classList.toggle('collapsed');
        const container = document.getElementById('logContainer');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    });
}
