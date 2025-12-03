<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomCorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the origin from the request
        $origin = $request->headers->get('Origin');
        
        // List of allowed origins
        $allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'https://mohami-six.vercel.app',
            'https://mohami.vercel.app',
        ];
        
        // Check if origin matches patterns
        $allowedPatterns = [
            '/^https:\/\/.*\.vercel\.app$/',
            '/^https:\/\/.*\.ngrok-free\.app$/',
            '/^https:\/\/.*\.ngrok\.io$/',
        ];
        
        $isAllowed = in_array($origin, $allowedOrigins);
        
        if (!$isAllowed && $origin) {
            foreach ($allowedPatterns as $pattern) {
                if (preg_match($pattern, $origin)) {
                    $isAllowed = true;
                    break;
                }
            }
        }
        
        // Handle preflight requests
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }
        
        // Set CORS headers
        if ($isAllowed && $origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } else {
            // Fallback for development
            $response->headers->set('Access-Control-Allow-Origin', '*');
        }
        
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, ngrok-skip-browser-warning');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '86400');
        
        return $response;
    }
}
