const baseURL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- RUNNING PHASE 8 SECURITY & VALIDATION TESTS ---');

  const printRes = async (res) => {
    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  };

  // 1. Verify Zod Input Validation Error on Admin Login
  try {
    console.log('Testing Admin Login with invalid email format...');
    const res = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad-email-format', password: '123' })
    });
    
    const body = await printRes(res);
    if (res.status === 400 && !body.success && body.error.includes('valid email')) {
      console.log('PASS: Email Zod validation triggered correctly.', body.error);
    } else {
      console.error('FAIL: Expected 400 with email validation message, got', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Admin login validation request error:', error.message);
  }

  // 2. Verify Zod Input Validation Error on Customer Activation
  try {
    console.log('Testing Customer Activation with invalid mobile format...');
    const res = await fetch(`${baseURL}/customer/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '12345', activationCode: 'MILK-1234' })
    });

    const body = await printRes(res);
    if (res.status === 400 && !body.success && body.error.includes('10-digit number')) {
      console.log('PASS: Mobile Zod validation triggered correctly.', body.error);
    } else {
      console.error('FAIL: Expected 400 with mobile validation message, got', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Customer activation validation request error:', error.message);
  }

  // 3. Verify Zod Input Validation Error on Quick Add Entry
  try {
    console.log('Testing Quick Add Entry with invalid customer ID format...');
    // Log in to get token first
    const loginRes = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@milkdiary.com', password: 'AdminSecure@2026' })
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data.token;

    const res = await fetch(`${baseURL}/entries/quick-add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customerId: 'short-id', ml: 500 })
    });

    const body = await printRes(res);
    if (res.status === 400 && !body.success && body.error.includes('customer ID format')) {
      console.log('PASS: Customer ID Zod validation triggered correctly.', body.error);
    } else {
      console.error('FAIL: Expected 400 with ID format validation message, got', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Quick add entry validation request error:', error.message);
  }

  // 4. Verify Rate Limiter on Customer Activation
  try {
    console.log('Testing Rate Limiter lockout on Customer Activation (making 6 rapid requests)...');
    
    // We send 6 requests rapidly from this client
    let lastStatus;
    let lastBody;
    
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${baseURL}/customer/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: '9876543210', activationCode: 'MILK-GEY-QB4S' })
      });
      lastStatus = res.status;
      lastBody = await printRes(res);
      if (lastStatus === 429) {
        break; // Stop immediately once we get locked out
      }
    }

    if (lastStatus === 429 && !lastBody.success) {
      console.log('PASS: Rate Limiter triggered correctly! Got blocked with 429 status code.', lastBody.error);
    } else {
      console.error('FAIL: Expected 429 Too Many Requests, got status', lastStatus, lastBody);
    }
  } catch (error) {
    console.error('FAIL: Rate limiter request error:', error.message);
  }
}

runTests();
