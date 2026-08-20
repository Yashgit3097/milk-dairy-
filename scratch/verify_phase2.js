const baseURL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- RUNNING PHASE 2 API VERIFICATION TESTS ---');

  // 1. Log in to get Admin Token
  let token;
  try {
    const res = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@milkdiary.com', password: 'AdminSecure@2026' })
    });
    const body = await res.json();
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

  // 2. Fetch Customer List to get Customer ID
  let customerId;
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'GET',
      headers: authHeaders
    });
    const body = await res.json();
    if (res.status === 200 && body.success && body.data.length > 0) {
      // Find the Verification Customer (active or inactive, since we soft deleted it earlier it might be inactive)
      const testCustomer = body.data.find(c => c.mobile === '9876543210');
      if (testCustomer) {
        customerId = testCustomer._id;
        console.log(`PASS: Found test customer ID: ${customerId}`);
      } else {
        console.error('FAIL: Test customer with mobile 9876543210 not found in list.');
        return;
      }
    } else {
      console.error('FAIL: Listing customers failed:', res.status, body);
      return;
    }
  } catch (error) {
    console.error('FAIL: Customer list request error:', error.message);
    return;
  }

  // 3. Test Fetch Monthly Cards List
  try {
    const res = await fetch(`${baseURL}/customers/${customerId}/entries`, {
      method: 'GET',
      headers: authHeaders
    });
    const body = await res.json();
    if (res.status === 200 && body.success) {
      console.log(`PASS: Monthly cards fetched successfully! Count: ${body.data.length}`);
      if (body.data.length > 0) {
        console.log('Card Months:', body.data.map(c => c.month));
      }
    } else {
      console.error('FAIL: Expected 200 monthly cards list, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Fetch monthly cards request error:', error.message);
  }

  // 4. Test Fetch specific Month Card (July 2026)
  try {
    const res = await fetch(`${baseURL}/customers/${customerId}/entries/2026-07`, {
      method: 'GET',
      headers: authHeaders
    });
    const body = await res.json();
    if (res.status === 200 && body.success) {
      console.log(`PASS: Fetch single card "2026-07" succeeded! Total Liters: ${body.data.totalMl / 1000}L, Total ₹: ${body.data.totalAmount}`);
    } else {
      console.error('FAIL: Expected 200 single month card, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Fetch single month card request error:', error.message);
  }
}

runTests();
