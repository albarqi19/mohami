<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class SimpleTestController extends Controller
{
    public function hello()
    {
        return response()->json(['message' => 'Hello World!']);
    }
    
    public function cases()
    {
        return response()->json(['message' => 'Cases endpoint works!']);
    }
    
    public function tasks()
    {
        return response()->json(['message' => 'Tasks endpoint works!']);
    }
    
    public function documents()
    {
        return response()->json(['message' => 'Documents endpoint works!']);
    }
}
