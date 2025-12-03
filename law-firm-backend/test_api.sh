#!/bin/bash

# Law Firm API Simple Test Script
# Simple testing for all endpoints

BASE_URL="http://127.0.0.1:8000"
TEST_EMAIL="test@lawfirm.com"
TEST_PASSWORD="password123"

echo "🚀 Starting Law Firm API Tests..."
echo "Server: $BASE_URL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
SUCCESS_COUNT=0
TOTAL_COUNT=0

# Function to run test
run_test() {
    local test_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    echo -e "${CYAN}Testing: $test_name${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$url" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $TOKEN")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ $test_name - Status: $http_code${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    else
        echo -e "${RED}❌ $test_name - Expected: $expected_status, Got: $http_code${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Test 1: Register new user
echo -e "\n${CYAN}🔐 Authentication Tests${NC}"

register_data='{
    "name": "اختبار المحامي",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "password_confirmation": "'$TEST_PASSWORD'",
    "role": "lawyer",
    "phone": "966501234567"
}'

response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$register_data")

echo "✅ Register attempt completed"

# Test 2: Login and get token
login_data='{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
}'

response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$login_data")

TOKEN=$(echo "$response" | jq -r '.data.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Login successful - Token obtained${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo -e "${RED}❌ Login failed - No token received${NC}"
    echo "Response: $response"
    exit 1
fi

TOTAL_COUNT=$((TOTAL_COUNT + 1))

# Test 3: Get current user info
run_test "Get User Info" "$BASE_URL/api/v1/auth/me" "GET" "" 200

# Test 4: Cases tests
echo -e "\n${CYAN}⚖️ Cases Tests${NC}"

case_data='{
    "title": "قضية اختبار - نزاع تجاري",
    "description": "قضية اختبار لتجربة النظام",
    "type": "commercial",
    "priority": "high",
    "client_id": "1",
    "primary_lawyer_id": "1",
    "start_date": "2025-09-21",
    "expected_end_date": "2025-12-21",
    "court_name": "المحكمة التجارية",
    "opposing_party": "الطرف المقابل"
}'

run_test "Create Case" "$BASE_URL/api/v1/cases" "POST" "$case_data" 201
run_test "Get Cases" "$BASE_URL/api/v1/cases" "GET" "" 200
run_test "Get Cases Statistics" "$BASE_URL/api/v1/cases/statistics" "GET" "" 200

# Test 5: Tasks tests
echo -e "\n${CYAN}📋 Tasks Tests${NC}"

task_data='{
    "title": "مهمة اختبار - مراجعة وثائق",
    "description": "مهمة اختبار لتجربة النظام",
    "case_id": "1",
    "assigned_to": "1",
    "priority": "high",
    "due_date": "2025-09-25T10:00:00",
    "estimated_hours": "4.5",
    "tags": ["اختبار", "مراجعة"]
}'

run_test "Create Task" "$BASE_URL/api/v1/tasks" "POST" "$task_data" 201
run_test "Get Tasks" "$BASE_URL/api/v1/tasks" "GET" "" 200
run_test "Get My Tasks" "$BASE_URL/api/v1/tasks/my-tasks" "GET" "" 200
run_test "Get Tasks Statistics" "$BASE_URL/api/v1/tasks/statistics" "GET" "" 200

# Test 6: Comments tests
echo -e "\n${CYAN}💬 Comments Tests${NC}"

comment_data='{
    "content": "تعليق اختبار على القضية",
    "case_id": "1"
}'

run_test "Create Comment" "$BASE_URL/api/v1/comments" "POST" "$comment_data" 201
run_test "Get Comments" "$BASE_URL/api/v1/comments?case_id=1" "GET" "" 200

# Test 7: Other endpoints
echo -e "\n${CYAN}📊 Other Tests${NC}"

run_test "Get Users" "$BASE_URL/api/v1/users" "GET" "" 200
run_test "Get Documents" "$BASE_URL/api/v1/documents" "GET" "" 200
run_test "Get Documents Statistics" "$BASE_URL/api/v1/documents/statistics" "GET" "" 200
run_test "Get Activities" "$BASE_URL/api/v1/activities" "GET" "" 200
run_test "Get Notifications" "$BASE_URL/api/v1/notifications" "GET" "" 200

# Test 8: Logout
echo -e "\n${CYAN}🚪 Logout Test${NC}"
run_test "Logout" "$BASE_URL/api/v1/auth/logout" "POST" "" 200

# Final results
echo -e "\n${YELLOW}📊 Test Results:${NC}"
echo "=================================="
echo "Total Tests: $TOTAL_COUNT"
echo -e "Successful: ${GREEN}$SUCCESS_COUNT${NC}"
echo -e "Failed: ${RED}$((TOTAL_COUNT - SUCCESS_COUNT))${NC}"

success_rate=$(echo "scale=2; $SUCCESS_COUNT * 100 / $TOTAL_COUNT" | bc -l)
echo -e "Success Rate: ${YELLOW}${success_rate}%${NC}"

if (( $(echo "$success_rate == 100" | bc -l) )); then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
elif (( $(echo "$success_rate >= 80" | bc -l) )); then
    echo -e "\n${YELLOW}⚠️ Most tests passed, check failed ones${NC}"
else
    echo -e "\n${RED}❌ System has issues, check failed tests${NC}"
fi

echo -e "\n${GREEN}✅ Testing completed${NC}"
