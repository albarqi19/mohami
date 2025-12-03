@echo off
echo Testing Add Task API...

set API_BASE=http://localhost:8000/api
set TOKEN=1|laravel_sanctum_test

echo.
echo === Testing Add Task ===
curl -X POST "%API_BASE%/tasks" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -H "Content-Type: application/json" ^
     -H "Accept: application/json" ^
     -d "{\"case_id\":\"1\",\"title\":\"Test Task from Batch\",\"description\":\"This is a test task created from batch file\",\"type\":\"general\",\"priority\":\"medium\",\"due_date\":\"2024-12-31\",\"estimated_hours\":2,\"assigned_to\":\"1\"}"

echo.
echo.
echo === Checking Activities for Case 1 ===
curl -X GET "%API_BASE%/cases/1/activities" ^
     -H "Authorization: Bearer %TOKEN%" ^
     -H "Accept: application/json"

echo.
pause
