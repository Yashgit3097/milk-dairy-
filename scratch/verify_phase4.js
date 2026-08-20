const baseURL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- RUNNING PHASE 4 API VERIFICATION TESTS ---');

  // Helper to parse responses
  const printRes = async (res) => {
    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  };

  // 1. Log in to get Admin Token
  let token;
  try {
    const res = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@milkdiary.com', password: 'AdminSecure@2026' })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      token = body.data.token;
      console.log('PASS: Authenticated admin successfully.');
    } else {
      console.error('FAIL: Admin authentication failed:', res.status, body);
      return;
    }
  } catch (error) {
    console.error('FAIL: Authentication request error:', error.message);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Query Dashboard Overview
  try {
    const res = await fetch(`${baseURL}/admin/dashboard`, {
      method: 'GET',
      headers: authHeaders
    });
    const body = await printRes(res);
    
    if (res.status === 200 && body.success) {
      console.log('PASS: Fetched dashboard overview successfully!');
      
      const { todayStats, monthStats, areaBreakdown, recentActivity } = body.data;
      
      console.log('Today Stats:', todayStats);
      console.log('Month Stats:', monthStats);
      console.log('Area Breakdown:', areaBreakdown);
      console.log('Recent Activity count:', recentActivity.length);

      if (todayStats && monthStats && areaBreakdown && recentActivity) {
        console.log('PASS: Overview response contains all required aggregation blocks.');
      } else {
        console.error('FAIL: Missing required aggregation metrics blocks in response.');
      }
    } else {
      console.error('FAIL: Expected 200 dashboard query, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Dashboard overview query request error:', error.message);
  }
}

runTests();
