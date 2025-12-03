/**
 * إدارة المحاماة - ناجز
 * Background Service Worker
 */

console.log('[Najiz BG] 🚀 Service Worker Starting...');

// ========================================
// Keep Alive - إبقاء Service Worker نشطاً
// ========================================
const keepAlive = () => setInterval(() => {
    console.log('[Najiz BG] 💓 Heartbeat');
}, 25000);
keepAlive();

// ========================================
// Configuration
// ========================================
const DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:8000/api/v1',
    autoSync: false,
    syncInterval: 5
};

// ========================================
// Installation
// ========================================
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Najiz BG] Installed:', details.reason);
    
    if (details.reason === 'install') {
        chrome.storage.local.set(DEFAULT_CONFIG);
    }
    
    // إنشاء Context Menu
    chrome.contextMenus.create({
        id: 'extract-data',
        title: 'سحب البيانات إلى نظام المحاماة',
        contexts: ['page'],
        documentUrlPatterns: ['https://www.najiz.sa/*', 'https://najiz.sa/*']
    });
});

// ========================================
// Message Handling - مبسط ومباشر
// ========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Najiz BG] 📨 Message:', request.action);
    
    // Ping - رد فوري
    if (request.action === 'ping') {
        console.log('[Najiz BG] 🏓 Pong!');
        sendResponse({ success: true, message: 'pong', time: Date.now() });
        return true;
    }
    
    // استخراج قضايا متعددة
    if (request.action === 'extractMultipleCases') {
        console.log('[Najiz BG] 🚀 Starting extraction:', request.caseLinks?.length, 'cases');
        
        extractAllCases(request.caseLinks, sender.tab?.id)
            .then(result => {
                console.log('[Najiz BG] ✅ Extraction complete!');
                sendResponse(result);
            })
            .catch(error => {
                console.error('[Najiz BG] ❌ Error:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true;
    }
    
    // استخراج قضية واحدة
    if (request.action === 'extractCaseInTab') {
        extractSingleCase({ url: request.url, basicInfo: {} })
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    sendResponse({ success: false, error: 'Unknown action' });
    return true;
});

// ========================================
// استخراج كل القضايا بالتوازي (3 في نفس الوقت)
// ========================================
async function extractAllCases(caseLinks, originTabId) {
    const BATCH_SIZE = 3;
    const results = [];
    let done = 0;
    
    console.log('[Najiz BG] Processing', caseLinks.length, 'cases in batches of', BATCH_SIZE);
    
    for (let i = 0; i < caseLinks.length; i += BATCH_SIZE) {
        const batch = caseLinks.slice(i, i + BATCH_SIZE);
        console.log(`[Najiz BG] 📦 Batch ${Math.floor(i/BATCH_SIZE)+1}: cases ${i+1}-${Math.min(i+BATCH_SIZE, caseLinks.length)}`);
        
        // معالجة الدفعة بالتوازي
        const batchResults = await Promise.all(
            batch.map(c => extractSingleCase(c))
        );
        
        results.push(...batchResults);
        done = results.length;
        
        // تحديث التقدم
        if (originTabId) {
            try {
                chrome.tabs.sendMessage(originTabId, {
                    action: 'extractionProgress',
                    current: done,
                    total: caseLinks.length
                });
            } catch (e) {}
        }
        
        console.log(`[Najiz BG] ✅ Done: ${done}/${caseLinks.length}`);
        
        // استراحة قصيرة
        if (i + BATCH_SIZE < caseLinks.length) {
            await sleep(800);
        }
    }
    
    console.log('[Najiz BG] 🎉 All done!', results.length, 'cases');
    return { success: true, data: results };
}

// ========================================
// استخراج قضية واحدة في تاب جديد
// ========================================
async function extractSingleCase(caseLink) {
    let tabId = null;
    
    try {
        // فتح تاب
        const tab = await chrome.tabs.create({
            url: caseLink.url,
            active: false
        });
        tabId = tab.id;
        
        // انتظار التحميل
        await waitForTab(tabId, 25000);
        await sleep(2000);
        
        // استخراج البيانات
        const result = await chrome.tabs.sendMessage(tabId, {
            action: 'extractCaseDetail'
        });
        
        // إغلاق التاب
        await chrome.tabs.remove(tabId);
        
        if (result && result.success && result.data) {
            return {
                ...caseLink.basicInfo,
                ...result.data,
                najiz_id: caseLink.najiz_id,
                najiz_url: caseLink.url
            };
        }
        
        return { ...caseLink.basicInfo, error: 'No data' };
        
    } catch (error) {
        console.error('[Najiz BG] Case error:', error.message);
        if (tabId) {
            try { await chrome.tabs.remove(tabId); } catch (e) {}
        }
        return {
            ...caseLink.basicInfo,
            najiz_id: caseLink.najiz_id,
            najiz_url: caseLink.url,
            error: error.message
        };
    }
}

// ========================================
// Helpers
// ========================================
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function waitForTab(tabId, timeout = 25000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error('Tab timeout'));
        }, timeout);
        
        const listener = (id, info) => {
            if (id === tabId && info.status === 'complete') {
                clearTimeout(timer);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
    });
}

// ========================================
// Context Menu Click
// ========================================
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extract-data') {
        chrome.tabs.sendMessage(tab.id, { action: 'extractCaseDetail' });
    }
});

console.log('[Najiz BG] ✅ Service Worker Ready!');
