<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class GeminiAnalysisService
{
    private $apiKey;
    private $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY', 'AIzaSyC12cX1wO8-S4CLyByWC8QcA9KgrrlcjwQ');
    }

    public function analyzeDocument($fileContent, $mimeType)
    {
        try {
            // للاختبار: إرجاع نتيجة وهمية أولاً
            if (env('GEMINI_TEST_MODE', false) == 'true' || env('GEMINI_TEST_MODE', false) === true) {
                return $this->getMockAnalysis();
            }
            
            $base64Data = base64_encode($fileContent);
            
            $prompt = "حلل هذه الوثيقة القانونية بعناية واستخرج المعلومات التالية:

1. نوع الوثيقة (مثل: عقد بيع، مذكرة دفاع، حكم محكمة، لائحة دعوى، إلخ)
2. عنوان مقترح للوثيقة (مختصر ووصفي)
3. وصف تفصيلي للمحتوى (3-4 جمل)
4. أسماء الأطراف المذكورة في الوثيقة
5. التواريخ المهمة المذكورة
6. الكلمات المفتاحية ذات الصلة
7. درجة الأهمية (عالية، متوسطة، منخفضة)
8. ملخص سريع في سطرين

يرجى الرد بصيغة JSON صحيحة باللغة العربية بالشكل التالي:
{
  \"document_type\": \"نوع الوثيقة\",
  \"suggested_title\": \"العنوان المقترح\",
  \"description\": \"الوصف التفصيلي\",
  \"parties\": [\"طرف أول\", \"طرف ثاني\"],
  \"important_dates\": [\"تاريخ 1\", \"تاريخ 2\"],
  \"keywords\": [\"كلمة مفتاحية 1\", \"كلمة مفتاحية 2\"],
  \"priority\": \"الأهمية\",
  \"summary\": \"الملخص السريع\"
}";

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $base64Data
                                ]
                            ],
                            [
                                'text' => $prompt
                            ]
                        ]
                    ]
                ]
            ];

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $this->baseUrl . '?key=' . $this->apiKey,
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

            if ($curlError) {
                throw new Exception("cURL Error: " . $curlError);
            }

            if ($httpCode !== 200) {
                throw new Exception("Gemini API request failed with status: $httpCode");
            }

            $result = json_decode($response, true);
            
            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new Exception("Invalid response from Gemini API");
            }

            $analysisText = $result['candidates'][0]['content']['parts'][0]['text'];
            
            // استخراج JSON من النص
            $jsonStart = strpos($analysisText, '{');
            $jsonEnd = strrpos($analysisText, '}');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonText = substr($analysisText, $jsonStart, $jsonEnd - $jsonStart + 1);
                $analysis = json_decode($jsonText, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $analysis;
                }
            }

            // إذا فشل استخراج JSON، نحاول تحليل النص يدوياً
            return $this->parseTextToJson($analysisText);

        } catch (Exception $e) {
            Log::error('Gemini analysis failed: ' . $e->getMessage());
            throw new Exception('فشل في تحليل الوثيقة: ' . $e->getMessage());
        }
    }

    private function parseTextToJson($text)
    {
        // تحليل بسيط للنص في حالة فشل JSON
        return [
            'document_type' => 'وثيقة قانونية',
            'suggested_title' => 'وثيقة تتطلب مراجعة يدوية',
            'description' => 'تم تحليل الوثيقة ولكن تحتاج إلى مراجعة يدوية لاستخراج التفاصيل الكاملة.',
            'parties' => [],
            'important_dates' => [],
            'keywords' => ['قانونية', 'وثيقة'],
            'priority' => 'متوسطة',
            'summary' => 'وثيقة قانونية تحتاج مراجعة يدوية.',
            'raw_analysis' => $text
        ];
    }

    private function getMockAnalysis()
    {
        // بيانات تجريبية للاختبار
        return [
            'document_type' => 'عقد بيع عقار',
            'suggested_title' => 'عقد بيع شقة سكنية في الرياض',
            'description' => 'عقد بيع عقار سكني يتضمن تفاصيل البائع والمشتري وشروط البيع والثمن المتفق عليه. العقار عبارة عن شقة سكنية بمساحة 120 متر مربع في حي النرجس بالرياض.',
            'parties' => ['أحمد محمد السعد', 'فاطمة علي الأحمد'],
            'important_dates' => ['2025-01-15', '2025-02-28'],
            'keywords' => ['عقد بيع', 'عقار', 'شقة سكنية', 'الرياض', 'النرجس'],
            'priority' => 'عالية',
            'summary' => 'عقد بيع شقة سكنية في الرياض بقيمة 450,000 ريال سعودي مع موعد تسليم في نهاية فبراير 2025.'
        ];
    }
}
