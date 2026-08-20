const baseURL = 'http://127.0.0.1:5000/api';
const todayDate = new Date().toLocaleDateString('en-CA');
const todayDayKey = String(Number(todayDate.slice(8, 10)));

async function runTests() {
  console.log('--- RUNNING PHASE 3 API VERIFICATION TESTS ---');

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

  // 2. Fetch Customer List to get Customer ID
  let customerId;
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'GET',
      headers: authHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success && body.data.length > 0) {
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

  // 3. Test Idempotency (First Quick Add Tap)
  try {
    console.log(`Sending quickAdd: 500ml for customer ${customerId} on ${todayDate}`);
    const res = await fetch(`${baseURL}/entries/quick-add`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ customerId, ml: 500, date: todayDate })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      const savedDays = body.data.days;
      const dayQty = savedDays[todayDayKey];
      console.log(`PASS: First quick-add succeeded! Qty for day ${todayDayKey}: ${dayQty}ml`);
      if (dayQty !== 500) {
        console.error(`FAIL: Expected day qty to be 500ml, got ${dayQty}ml`);
      }
    } else {
      console.error('FAIL: quickAdd request failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: First quick-add request error:', error.message);
  }

  // 4. Test Idempotency (Second Tap - Overwrite Day)
  try {
    console.log(`Sending quickAdd: 1000ml (overwrite) for customer ${customerId} on ${todayDate}`);
    const res = await fetch(`${baseURL}/entries/quick-add`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ customerId, ml: 1000, date: todayDate })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      const savedDays = body.data.days;
      const dayQty = savedDays[todayDayKey];
      console.log(`PASS: Second quick-add succeeded! Qty for day ${todayDayKey}: ${dayQty}ml`);
      if (dayQty === 1000) {
        console.log('PASS: Day quantity successfully overwritten to 1000ml. Idempotency verified!');
      } else {
        console.error(`FAIL: Expected day qty to be overwritten to 1000ml, got ${dayQty}ml`);
      }
    } else {
      console.error('FAIL: Overwrite quickAdd request failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Second quick-add request error:', error.message);
  }

  // 5. Test Undo Action
  try {
    console.log(`Sending undo for customer ${customerId} on ${todayDate}`);
    const res = await fetch(`${baseURL}/entries/${customerId}/undo?date=${todayDate}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      const savedDays = body.data.days;
      const dayQty = savedDays[todayDayKey];
      console.log(`PASS: Undo operation succeeded! Qty for day ${todayDayKey}:`, dayQty !== undefined ? `${dayQty}ml` : 'undefined/deleted');
      if (dayQty === undefined || dayQty === 0) {
        console.log('PASS: Undo action successfully cleared today\'s delivery record.');
      } else {
        console.error(`FAIL: Expected day qty to be cleared (undefined/0), got ${dayQty}ml`);
      }
    } else {
      console.error('FAIL: Undo request failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Undo request error:', error.message);
  }
}

runTests();
