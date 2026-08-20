const baseURL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- RUNNING PHASE 1 INTEGRATION TESTS (NATIVE FETCH) ---');
  
  // Helper to print responses
  const printRes = async (res) => {
    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  };

  // 1. Test Incorrect Login
  try {
    const res = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@milkdiary.com', password: 'wrongpassword' })
    });
    const body = await printRes(res);
    if (res.status === 401) {
      console.log('PASS: Failed login with wrong password as expected:', body.error);
    } else {
      console.error('FAIL: Expected 401 on bad login, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Login request error:', error.message);
  }

  // 2. Test Correct Login
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
      console.log('PASS: Logged in successfully! Received token.');
    } else {
      console.error('FAIL: Expected 200 on correct login, got status', res.status, body);
      return;
    }
  } catch (error) {
    console.error('FAIL: Login request error:', error.message);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Test Create Customer
  let customerId;
  const customerPayload = {
    name: 'Verification Customer',
    mobile: '9876543210',
    area: 'Test Area C',
    pricePerLiter: 65
  };
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(customerPayload)
    });
    const body = await printRes(res);
    if (res.status === 201 && body.success) {
      customerId = body.data._id;
      console.log('PASS: Customer created successfully! Name:', body.data.name, 'Code:', body.data.activationCode);
    } else {
      console.error('FAIL: Expected 201 customer creation, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Customer creation request error:', error.message);
  }

  // 4. Test Create Duplicate Mobile Customer
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(customerPayload)
    });
    const body = await printRes(res);
    if (res.status === 400 && !body.success) {
      console.log('PASS: Blocked duplicate mobile number creation as expected:', body.error);
    } else {
      console.error('FAIL: Expected 400 on duplicate mobile creation, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Duplicate mobile creation check error:', error.message);
  }

  // 5. Test List Customers
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'GET',
      headers: authHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      console.log('PASS: Listed customers successfully! Total count:', body.data.length);
    } else {
      console.error('FAIL: Expected 200 listing, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Customer list request error:', error.message);
  }

  // 6. Test Soft Delete Customer
  try {
    const res = await fetch(`${baseURL}/customers/${customerId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      console.log('PASS: Customer soft-deleted successfully! Status:', body.data.status);
    } else {
      console.error('FAIL: Expected 200 customer deletion, got status', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Soft deletion request error:', error.message);
  }
}

runTests();
