# Test script for lawyer WhatsApp notifications
$baseUrl = "http://localhost:8000/api"
$adminToken = ""

Write-Host "=== Testing Lawyer WhatsApp Notifications ===" -ForegroundColor Green

# 1. Admin login to get token
Write-Host "`n1. Admin login..." -ForegroundColor Yellow
$loginData = @{
    identity_number = "1111111111"
    secret_code = "1111"
} | ConvertTo-Json -Depth 10

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/login" -Method POST -ContentType "application/json" -Body $loginData
    $adminToken = $loginResponse.token
    Write-Host "✓ Admin logged in successfully" -ForegroundColor Green
    Write-Host "Token: $($adminToken.Substring(0,20))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# 2. Create a test lawyer
Write-Host "`n2. Creating test lawyer..." -ForegroundColor Yellow
$lawyerData = @{
    name = "Test Lawyer"
    email = "lawyer.test@example.com"
    phone = "966530996778"
    identity_number = "2223334444"
    secret_code = "2222"
    specialization = "Civil Law"
    experience_years = 5
    license_number = "LIC123456"
    whatsapp_notifications = $true
} | ConvertTo-Json -Depth 10

try {
    $lawyerResponse = Invoke-RestMethod -Uri "$baseUrl/admin/lawyers" -Method POST -Headers $headers -Body $lawyerData
    $lawyerId = $lawyerResponse.lawyer.id
    Write-Host "✓ Lawyer created successfully - ID: $lawyerId" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create lawyer: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# 3. Create a test client
Write-Host "`n3. Creating test client..." -ForegroundColor Yellow
$clientData = @{
    name = "Test Client"
    email = "client.test@example.com"
    phone = "966530996778"
    identity_number = "3334445555"
    secret_code = "3333"
    address = "Riyadh, Saudi Arabia"
    whatsapp_notifications = $true
} | ConvertTo-Json -Depth 10

try {
    $clientResponse = Invoke-RestMethod -Uri "$baseUrl/admin/clients" -Method POST -Headers $headers -Body $clientData
    $clientId = $clientResponse.client.id
    Write-Host "✓ Client created successfully - ID: $clientId" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create client: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Create a test case
Write-Host "`n4. Creating test case..." -ForegroundColor Yellow
$caseData = @{
    title = "Test Case for Notifications"
    description = "Case for testing WhatsApp notifications to lawyer"
    case_number = "TEST-$(Get-Random -Maximum 9999)"
    status = "active"
    priority = "medium"
    case_type = "civil"
    client_id = $clientId
    filing_date = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json -Depth 10

try {
    $caseResponse = Invoke-RestMethod -Uri "$baseUrl/admin/cases" -Method POST -Headers $headers -Body $caseData
    $caseId = $caseResponse.case.id
    Write-Host "✓ Case created successfully - ID: $caseId" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create case: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test lawyer assignment to case (will send WhatsApp notification)
Write-Host "`n5. Testing lawyer assignment to case..." -ForegroundColor Yellow
$assignData = @{
    lawyer_id = $lawyerId
    assigned_at = (Get-Date).ToString("yyyy-MM-dd H:mm:ss")
    assignment_notes = "Assignment for testing WhatsApp notifications"
} | ConvertTo-Json -Depth 10

try {
    $assignResponse = Invoke-RestMethod -Uri "$baseUrl/admin/cases/$caseId/assign-lawyer" -Method POST -Headers $headers -Body $assignData
    Write-Host "✓ Lawyer assigned to case - WhatsApp notification will be sent" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Failed to assign lawyer: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Test creating task for lawyer (will send WhatsApp notification)
Write-Host "`n6. Testing task creation for lawyer..." -ForegroundColor Yellow
$taskData = @{
    title = "Test Notification Task"
    description = "Task for testing WhatsApp notifications"
    assigned_to = $lawyerId
    case_id = $caseId
    priority = "high"
    status = "pending"
    due_date = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
} | ConvertTo-Json -Depth 10

try {
    $taskResponse = Invoke-RestMethod -Uri "$baseUrl/admin/tasks" -Method POST -Headers $headers -Body $taskData
    $taskId = $taskResponse.task.id
    Write-Host "✓ Task created for lawyer - WhatsApp notification will be sent" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Failed to create task: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Login as lawyer and upload document (will send WhatsApp notification to client)
Write-Host "`n7. Login as lawyer and upload document..." -ForegroundColor Yellow
$lawyerLoginData = @{
    identity_number = "2223334444"
    secret_code = "2222"
} | ConvertTo-Json -Depth 10

try {
    $lawyerLoginResponse = Invoke-RestMethod -Uri "$baseUrl/lawyer/login" -Method POST -ContentType "application/json" -Body $lawyerLoginData
    $lawyerToken = $lawyerLoginResponse.token
    Write-Host "✓ Lawyer logged in successfully" -ForegroundColor Green
    
    $lawyerHeaders = @{
        "Authorization" = "Bearer $lawyerToken"
        "Content-Type" = "application/json"
    }
    
    # Create test document
    $docData = @{
        title = "Test Notification Document"
        description = "Document for testing WhatsApp notifications"
        document_type = "contract"
        case_id = $caseId
        file_path = "/documents/test_doc.pdf"
        file_size = 1024
        mime_type = "application/pdf"
        is_confidential = $false
    } | ConvertTo-Json -Depth 10
    
    $docResponse = Invoke-RestMethod -Uri "$baseUrl/lawyer/documents" -Method POST -Headers $lawyerHeaders -Body $docData
    Write-Host "✓ Document uploaded - WhatsApp notification will be sent to client" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Failed to login lawyer or upload document: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Check sent WhatsApp messages
Write-Host "`n8. Checking sent WhatsApp messages..." -ForegroundColor Yellow
try {
    $messagesResponse = Invoke-RestMethod -Uri "$baseUrl/admin/whatsapp/messages" -Method GET -Headers $headers
    $messages = $messagesResponse.messages
    
    Write-Host "✓ Found $($messages.Count) WhatsApp messages" -ForegroundColor Green
    
    foreach ($message in $messages) {
        Write-Host "`nMessage #$($message.id):" -ForegroundColor Cyan
        Write-Host "  To: $($message.to_phone)" -ForegroundColor White
        Write-Host "  Type: $($message.event_type)" -ForegroundColor White
        Write-Host "  Status: $($message.status)" -ForegroundColor White
        Write-Host "  Content: $($message.message_content.Substring(0, [Math]::Min(100, $message.message_content.Length)))..." -ForegroundColor White
        Write-Host "  Date: $($message.created_at)" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Failed to check WhatsApp messages: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Test overdue tasks notifications
Write-Host "`n9. Testing overdue tasks notifications..." -ForegroundColor Yellow
try {
    # Run overdue tasks check
    $overdueResponse = Invoke-RestMethod -Uri "$baseUrl/admin/test-overdue-tasks" -Method POST -Headers $headers
    Write-Host "✓ Overdue tasks check executed" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Failed to test overdue tasks: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Lawyer Notifications Test Completed ===" -ForegroundColor Green
Write-Host "Check WhatsApp messages on the phone numbers used in the test" -ForegroundColor Yellow
