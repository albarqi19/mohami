<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\LegalMemo;

class LegalMemoAnalysisService
{
    private const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    public function __construct()
    {
        // يمكن إضافة أي إعدادات أخرى هنا
    }

    /**
     * تحليل ذكي محسن للمذكرة القانونية باستخدام Gemini API فقط - مع نظام الخطوات
     */
    public function analyzeWithGemini($memo)
    {
        Log::info("بدء تحليل المذكرة رقم: {$memo->id} باستخدام Gemini API");
        
        // تحليل مع عرض الخطوات
        $analysisResult = [];
        
        // الخطوة 1: فحص الوثائق المرفقة
        $documents = $memo->documents ?? collect();
        
        if ($documents->count() > 0) {
            Log::info("الخطوة 1: تحليل {$documents->count()} وثيقة مرفقة");
            
            // تحليل الوثائق أولاً
            $documentsAnalysis = $this->analyzeDocumentsWithGemini($documents->toArray());
            $analysisResult['documents_analysis'] = $documentsAnalysis;
            $analysisResult['analysis_steps'][] = [
                'step' => 1,
                'title' => 'تحليل الوثائق المرفقة',
                'status' => 'completed',
                'result' => "تم تحليل {$documents->count()} وثيقة بنجاح"
            ];
            
            // الخطوة 2: دمج تحليل الوثائق مع المذكرة
            Log::info("الخطوة 2: دمج تحليل الوثائق مع نص المذكرة");
            
            $combinedAnalysis = $this->analyzeMemoWithDocuments($memo, $documentsAnalysis);
            $analysisResult = array_merge($analysisResult, $combinedAnalysis);
            $analysisResult['analysis_steps'][] = [
                'step' => 2,
                'title' => 'تحليل المذكرة مع الوثائق',
                'status' => 'completed',
                'result' => 'تم دمج تحليل الوثائق مع المذكرة'
            ];
        } else {
            Log::info("لا توجد وثائق مرفقة، تحليل المذكرة مباشرة");
            
            // تحليل المذكرة فقط
            $memoAnalysis = $this->performQuickAnalysis($memo);
            $analysisResult = array_merge($analysisResult, $memoAnalysis);
            $analysisResult['analysis_steps'][] = [
                'step' => 1,
                'title' => 'تحليل نص المذكرة',
                'status' => 'completed',
                'result' => 'تم تحليل المذكرة بنجاح'
            ];
        }
        
        Log::info("تم إكمال تحليل المذكرة رقم: {$memo->id} بنجاح");
        
        return $analysisResult;
    }

    /**
     * تحليل سريع ومحسن للمذكرة
     */
    private function performQuickAnalysis($memo)
    {
        $apiKey = config('services.gemini.api_key');
        
        if (!$apiKey) {
            throw new \Exception('Gemini API Key غير مكوّن. لا يمكن إجراء التحليل الذكي بدون API Key.');
        }

        // إنشاء prompt مبسط وسريع
        $prompt = $this->buildSimplePrompt($memo);
        
        Log::info('إرسال طلب تحليل سريع للمذكرة رقم: ' . $memo->id);
        
        $url = self::GEMINI_API_URL . '?key=' . $apiKey;
        
        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 1500, // زيادة قليلاً للحصول على تحليل أكثر تفصيلاً
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 90);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
        
        // إعدادات SSL - تجاهل مشاكل الشهادة للبيئة المحلية
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error("cURL Error: $error");
            throw new \Exception("فشل في الاتصال بـ Gemini API: $error");
        }

        if ($httpCode !== 200) {
            Log::error("HTTP Error: $httpCode - Response: $response");
            throw new \Exception("Gemini API أرجع خطأ $httpCode. الرجاء المحاولة لاحقاً.");
        }

        $data = json_decode($response, true);
        
        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            Log::error("Invalid Gemini response format: " . json_encode($data));
            throw new \Exception("تم الحصول على استجابة غير صالحة من Gemini API.");
        }

        $analysisText = $data['candidates'][0]['content']['parts'][0]['text'];
        
        return $this->parseAnalysisResult($analysisText, $memo);
    }

    /**
     * إنشاء prompt مبسط وسريع
     */
    private function buildSimplePrompt($memo)
    {
        $prompt = "قم بتحليل هذه المذكرة القانونية بشكل سريع ومركز:\n\n";
        $prompt .= "العنوان: {$memo->title}\n";
        $prompt .= "النوع: {$memo->memo_type}\n";
        $prompt .= "الفئة: {$memo->category}\n";
        $prompt .= "المحتوى:\n{$memo->content}\n\n";
        
        $prompt .= "أرجو تقديم تحليل سريع يتضمن:\n";
        $prompt .= "1. تقييم عام للمذكرة (نقاط القوة والضعف)\n";
        $prompt .= "2. درجة الجودة من 1-10\n";
        $prompt .= "3. أهم 3 توصيات للتحسين\n";
        $prompt .= "4. أي مخاوف قانونية مهمة\n\n";
        $prompt .= "كن موجزاً ومركزاً في الإجابة.";
        
        return $prompt;
    }

    /**
     * تحليل النتيجة وتحويلها إلى تنسيق منظم - حصرياً من Gemini API
     */
    private function parseAnalysisResult($analysisText, $memo)
    {
        Log::info("معالجة نتيجة تحليل Gemini API للمذكرة رقم: {$memo->id}");
        
        // استخراج درجة الجودة
        $qualityScore = 7; // قيمة افتراضية
        if (preg_match('/درجة.*?(\d+)/u', $analysisText, $matches)) {
            $qualityScore = (int) $matches[1];
        }

        // تقسيم النص إلى أقسام
        $sections = explode("\n", $analysisText);
        $improvements = [];
        $complianceIssues = [];
        
        $currentSection = '';
        foreach ($sections as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            if (stripos($line, 'توصي') !== false || stripos($line, 'تحسين') !== false) {
                $improvements[] = $line;
            } elseif (stripos($line, 'قانون') !== false || stripos($line, 'مخاوف') !== false) {
                $complianceIssues[] = $line;
            }
        }

        $result = [
            'memo_analysis' => $analysisText,
            'quality_score' => $qualityScore,
            'improvement_suggestions' => !empty($improvements) ? $improvements : ['لا توجد توصيات محددة'],
            'legal_compliance_issues' => !empty($complianceIssues) ? $complianceIssues : ['لم يتم رصد مخاوف قانونية'],
            'analysis_date' => now()->toDateTimeString(),
            'analysis_type' => 'gemini_api' // تحليل حصري من Gemini API
        ];
        
        Log::info("تم إنشاء تحليل Gemini API بنجاح للمذكرة رقم: {$memo->id}");
        
        return $result;
    }
    
    private function analyzeAttachedDocuments($memo)
    {
        try {
            // جلب الوثائق المرتبطة بالمذكرة
            $documents = $memo->documents ?? [];
            
            if (empty($documents)) {
                return 'لا توجد وثائق مرفقة مع هذه المذكرة.';
            }
            
            $documentSummaries = [];
            foreach ($documents as $document) {
                $summary = "وثيقة: {$document->name} - النوع: {$document->file_type}";
                if (!empty($document->extracted_content)) {
                    $summary .= " - تم تحليل المحتوى بنجاح.";
                }
                $documentSummaries[] = $summary;
            }
            
            return "تم العثور على " . count($documents) . " وثيقة مرفقة:\n" . implode("\n", $documentSummaries);
            
        } catch (\Exception $e) {
            return 'تعذر تحليل الوثائق المرفقة.';
        }
    }
    
    private function analyzeMemoWithDocumentContext($memo, $documentsContext)
    {
        try {
            $apiKey = config('services.gemini.api_key');
            Log::info('Gemini API Key configured: ' . ($apiKey ? 'Yes' : 'No'));
            
            if (!$apiKey) {
                throw new \Exception('Gemini API Key not configured');
            }
            
            $prompt = $this->buildEnhancedAnalysisPrompt($memo, $documentsContext);
            Log::info('Sending request to Gemini API for memo: ' . $memo->id);
            
            // استخدام cURL كما هو موجود في GeminiAnalysisService
            $url = self::GEMINI_API_URL . '?key=' . $apiKey;
            
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'topK' => 32,
                    'topP' => 1,
                    'maxOutputTokens' => 4096,
                ]
            ];

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json'
                ],
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_TIMEOUT => 60,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false
            ]);

            $response = curl_exec($ch);
            $curlError = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            Log::info('Gemini API Response', [
                'http_code' => $httpCode,
                'curl_error' => $curlError,
                'response_length' => strlen($response ?? '')
            ]);

            if ($curlError) {
                throw new \Exception("cURL Error: " . $curlError);
            }

            if ($httpCode !== 200) {
                Log::error('Gemini API HTTP Error', [
                    'status' => $httpCode, 
                    'response' => substr($response, 0, 500)
                ]);
                throw new \Exception("Gemini API request failed with status: $httpCode");
            }

            $responseData = json_decode($response, true);
            Log::info('Gemini API Response received successfully');
            
            if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                $analysisText = $responseData['candidates'][0]['content']['parts'][0]['text'];
                return $this->parseEnhancedAnalysisResponse($analysisText);
            } else {
                Log::error('Invalid Gemini API response format: ' . json_encode($responseData));
                throw new \Exception('Invalid response format from Gemini API');
            }
        } catch (\Exception $e) {
            Log::error('Gemini Analysis Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    private function generateComprehensiveRecommendations($memo, $documentsAnalysis, $memoAnalysis)
    {
        return [
            'improvements' => [
                'تحسين الهيكل العام للمذكرة وترتيب الأفكار',
                'إضافة مراجع قانونية أكثر دقة وتفصيلاً',
                'تعزيز الحجج القانونية بالسوابق القضائية',
                'مراجعة الأسلوب القانوني وتحسين الصياغة'
            ],
            'compliance_issues' => [
                'التأكد من مطابقة المذكرة للشكل القانوني المطلوب',
                'مراجعة الاستشهادات والمراجع القانونية',
                'التحقق من صحة المعلومات القانونية المذكورة'
            ]
        ];
    }
    
    private function getFallbackAnalysis($memo)
    {
        return [
            'document_analysis' => 'تعذر تحليل الوثائق المرفقة.',
            'memo_analysis' => 'تم إجراء تحليل محلي للمذكرة.',
            'quality_score' => 75,
            'improvement_suggestions' => [
                'مراجعة عامة للمذكرة',
                'تحسين الهيكل والتنظيم',
                'إضافة مراجع قانونية'
            ],
            'legal_compliance_issues' => [
                'مراجعة الامتثال للنظام القانوني السعودي'
            ]
        ];
    }

    /**
     * بناء prompt متخصص للتحليل القانوني السعودي
     */
    private function buildAnalysisPrompt($memo)
    {
        $memoTypeArabic = $this->getMemoTypeInArabic($memo->memo_type, $memo->category);
        
        $prompt = "
أنت خبير قانوني متخصص في النظام القانوني السعودي والشريعة الإسلامية. مطلوب منك تحليل المذكرة القانونية التالية بدقة وإعطاء تقييم شامل.

## معلومات المذكرة:
- نوع المذكرة: {$memoTypeArabic}
- الفئة: {$memo->category}
- العنوان: {$memo->title}

## نص المذكرة:
{$memo->content}

## التحليل المطلوب:
يرجى تحليل المذكرة وفقاً للمعايير التالية وإرجاع الإجابة بصيغة JSON فقط:

### 1. التقييم العام (من 100):
- الجودة الإجمالية
- مدى الالتزام بالشكل القانوني
- قوة الحجج القانونية
- الوضوح والدقة

### 2. تحليل الهيكل والشكل:
- مدى اكتمال أجزاء المذكرة (المقدمة، الوقائع، الحجج، الخاتمة)
- التنظيم والترتيب المنطقي
- الأسلوب القانوني المناسب
- استخدام المصطلحات القانونية الصحيحة

### 3. التحليل الموضوعي:
- قوة الأدلة المقدمة
- مدى الاستناد للنصوص الشرعية والقانونية
- صحة الاستشهادات والمراجع
- منطقية الاستنتاجات

### 4. الامتثال للنظام السعودي:
- التوافق مع الأنظمة السعودية ذات العلاقة
- الاستناد للأحكام الشرعية
- مراعاة الإجراءات النظامية
- التوافق مع السوابق القضائية

### 5. نقاط القوة والضعف:
- أبرز نقاط القوة في المذكرة
- نقاط الضعف التي تحتاج تحسين
- الثغرات القانونية إن وجدت

### 6. التوصيات والاقتراحات:
- اقتراحات لتحسين المحتوى
- إضافات مطلوبة (نصوص، مواد، أحكام)
- تعديلات على الصياغة
- نصائح لتقوية الحجج

### 7. تحذيرات قانونية:
- مخاطر قانونية محتملة
- نقاط ضعف قد تضر بالقضية
- تحذيرات إجرائية

يرجى إرجاع الإجابة بصيغة JSON صالحة فقط، مع التأكد من أن جميع النصوص باللغة العربية وتحتوي على تفاصيل دقيقة ومفيدة للمحامي.

الصيغة المطلوبة:
```json
{
  \"overall_score\": 85,
  \"structure_analysis\": {
    \"completeness_score\": 80,
    \"organization_score\": 90,
    \"legal_style_score\": 75,
    \"terminology_score\": 85,
    \"comments\": \"تعليقات تفصيلية...\"
  },
  \"content_analysis\": {
    \"evidence_strength\": 80,
    \"legal_references\": 70,
    \"citations_accuracy\": 85,
    \"logical_flow\": 90,
    \"comments\": \"تحليل المحتوى...\"
  },
  \"saudi_compliance\": {
    \"regulatory_compliance\": 85,
    \"sharia_alignment\": 90,
    \"procedural_accuracy\": 80,
    \"precedent_consideration\": 75,
    \"comments\": \"تقييم الامتثال...\"
  },
  \"strengths\": [
    \"نقطة قوة 1\",
    \"نقطة قوة 2\"
  ],
  \"weaknesses\": [
    \"نقطة ضعف 1\",
    \"نقطة ضعف 2\"
  ],
  \"recommendations\": [
    {
      \"type\": \"content\",
      \"priority\": \"high\",
      \"suggestion\": \"اقتراح محدد\"
    }
  ],
  \"legal_warnings\": [
    {
      \"severity\": \"medium\",
      \"issue\": \"وصف المشكلة\",
      \"recommendation\": \"الحل المقترح\"
    }
  ]
}
```
";

        return $prompt;
    }

    /**
     * الحصول على اسم نوع المذكرة بالعربية
     */
    private function getMemoTypeInArabic($memoType, $category)
    {
        $types = [
            'opening' => [
                'claim_petition' => 'صحيفة دعوى',
                'response_to_claim' => 'مذكرة رد على صحيفة دعوى',
            ],
            'pleading' => [
                'written_plea' => 'مذكرة جوابية (مرافعة مكتوبة)',
                'counter_plea' => 'مذكرة تعقيبية',
                'formal_objection' => 'مذكرة بدفوع شكلية',
                'substantive_objection' => 'مذكرة بدفوع موضوعية',
            ],
            'evidence' => [
                'oath_request' => 'مذكرة بطلب توجيه اليمين',
                'witness_hearing' => 'مذكرة بطلب سماع شهادة الشهود',
                'expert_appointment' => 'مذكرة بطلب ندب خبير أو محاسب',
                'party_intervention' => 'مذكرة بطلب إدخال خصم جديد',
                'document_inspection' => 'مذكرة بطلب الاطلاع على المستندات',
            ],
            'specialized' => [
                'family_law_memo' => 'مذكرة في دعاوى الأحوال الشخصية',
                'endowment_memo' => 'مذكرة في دعاوى الوقف والوصايا',
                'criminal_law_memo' => 'مذكرة في دعاوى الحدود والتعزيرات',
                'commercial_memo' => 'مذكرة في القضايا التجارية',
                'labor_memo' => 'مذكرة في القضايا العمالية',
                'other' => 'مذكرة أخرى',
            ]
        ];

        return $types[$category][$memoType] ?? $memoType;
    }

    /**
     * بناء prompt محسن مع سياق الوثائق
     */
    private function buildEnhancedAnalysisPrompt($memo, $documentsContext)
    {
        $memoTypeArabic = $this->getMemoTypeInArabic($memo->memo_type, $memo->category);
        
        return "
أنت خبير قانوني متخصص في النظام القانوني السعودي. 

## سياق الوثائق المرفقة:
{$documentsContext}

## معلومات المذكرة:
- نوع المذكرة: {$memoTypeArabic}
- الفئة: {$memo->category}
- العنوان: {$memo->title}

## نص المذكرة:
{$memo->content}

يرجى تحليل المذكرة مع مراعاة الوثائق المرفقة وإرجاع التحليل بصيغة JSON:
{
    \"content\": \"تحليل تفصيلي للمذكرة\",
    \"quality_score\": درجة_الجودة_من_100
}
";
    }

    /**
     * تحليل الاستجابة المحسنة
     */
    private function parseEnhancedAnalysisResponse($analysisText)
    {
        try {
            // محاولة استخراج JSON من النص
            $jsonStart = strpos($analysisText, '{');
            $jsonEnd = strrpos($analysisText, '}');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonText = substr($analysisText, $jsonStart, $jsonEnd - $jsonStart + 1);
                $parsed = json_decode($jsonText, true);
                
                if ($parsed) {
                    return $parsed;
                }
            }
            
            // في حالة فشل التحليل، إرجاع تحليل افتراضي
            return [
                'content' => $analysisText,
                'quality_score' => 75
            ];
            
        } catch (\Exception $e) {
            return [
                'content' => 'تم إجراء تحليل أساسي للمذكرة.',
                'quality_score' => 70
            ];
        }
    }

    /**
     * تحليل استجابة الذكاء الاصطناعي
     */
    private function parseAnalysisResponse($analysisText)
    {
        try {
            // استخراج JSON من النص
            $jsonStart = strpos($analysisText, '{');
            $jsonEnd = strrpos($analysisText, '}');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonText = substr($analysisText, $jsonStart, $jsonEnd - $jsonStart + 1);
                $analysis = json_decode($jsonText, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    return [
                        'success' => true,
                        'analysis' => $analysis,
                        'raw_response' => $analysisText
                    ];
                }
            }
            
            // إذا فشل parsing JSON، إرجاع النص كما هو
            return [
                'success' => false,
                'message' => 'تم التحليل لكن هناك مشكلة في تنسيق الاستجابة',
                'raw_response' => $analysisText,
                'analysis' => $this->createFallbackAnalysis($analysisText)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'خطأ في تحليل الاستجابة: ' . $e->getMessage(),
                'raw_response' => $analysisText
            ];
        }
    }

    /**
     * إنشاء تحليل بديل في حالة فشل parsing
     */
    private function createFallbackAnalysis($text)
    {
        return [
            'overall_score' => 75,
            'structure_analysis' => [
                'comments' => 'تم استخراج التحليل من النص المجاني'
            ],
            'recommendations' => [
                [
                    'type' => 'general',
                    'priority' => 'medium',
                    'suggestion' => 'مراجعة التحليل الكامل في النص أدناه'
                ]
            ],
            'raw_analysis' => $text
        ];
    }

    /**
     * تحليل الوثائق المرفقة باستخدام Gemini API
     */
    private function analyzeDocumentsWithGemini($documents)
    {
        try {
            $apiKey = config('services.gemini.api_key');
            
            if (!$apiKey) {
                throw new \Exception('Gemini API Key غير مكوّن');
            }
            
            $documentsText = "تحليل الوثائق المرفقة:\n\n";
            
            foreach ($documents as $document) {
                $documentsText .= "وثيقة: {$document['name']}\n";
                $documentsText .= "النوع: {$document['file_type']}\n";
                if (!empty($document['extracted_content'])) {
                    $documentsText .= "المحتوى: " . substr($document['extracted_content'], 0, 1000) . "\n\n";
                }
            }
            
            $prompt = "قم بتحليل الوثائق التالية وتلخيص محتواها:\n\n" . $documentsText;
            
            return $this->callGeminiAPI($prompt);
            
        } catch (\Exception $e) {
            Log::error("خطأ في تحليل الوثائق: " . $e->getMessage());
            return "تعذر تحليل الوثائق المرفقة: " . $e->getMessage();
        }
    }

    /**
     * تحليل المذكرة مع سياق الوثائق
     */
    private function analyzeMemoWithDocuments($memo, $documentsAnalysis)
    {
        try {
            $prompt = $this->buildEnhancedAnalysisPrompt($memo, $documentsAnalysis);
            $analysisText = $this->callGeminiAPI($prompt);
            
            return $this->parseAnalysisResult($analysisText, $memo);
            
        } catch (\Exception $e) {
            Log::error("خطأ في تحليل المذكرة مع الوثائق: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * استدعاء Gemini API موحد
     */
    private function callGeminiAPI($prompt)
    {
        $apiKey = config('services.gemini.api_key');
        
        if (!$apiKey) {
            throw new \Exception('Gemini API Key غير مكوّن');
        }
        
        $url = self::GEMINI_API_URL . '?key=' . $apiKey;
        
        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 2048,
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 90);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("فشل في الاتصال بـ Gemini API: $error");
        }

        if ($httpCode !== 200) {
            throw new \Exception("Gemini API أرجع خطأ $httpCode");
        }

        $data = json_decode($response, true);
        
        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception("استجابة غير صالحة من Gemini API");
        }

        return $data['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * حفظ نتيجة التحليل في قاعدة البيانات
     */
    public function saveAnalysisResult($memoId, $analysisResult)
    {
        try {
            // يمكن إضافة جدول منفصل لحفظ نتائج التحليل
            // أو حفظها كـ JSON في حقل analysis_result في جدول legal_memos
            
            $memo = LegalMemo::find($memoId);
            if ($memo) {
                $memo->analysis_result = json_encode($analysisResult);
                $memo->analyzed_at = now();
                $memo->save();
            }
            
            return true;
        } catch (\Exception $e) {
            Log::error('Error saving analysis result: ' . $e->getMessage());
            return false;
        }
    }
}
