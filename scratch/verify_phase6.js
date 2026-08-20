const baseURL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- RUNNING PHASE 6 API VERIFICATION TESTS ---');

  // Helper to parse responses
  const printRes = async (res) => {
    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  };

  // 1. Log in as Admin to fetch customer activation code
  let adminToken;
  try {
    const res = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@milkdiary.com', password: 'AdminSecure@2026' })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      adminToken = body.data.token;
      console.log('PASS: Authenticated admin successfully.');
    } else {
      console.error('FAIL: Admin authentication failed:', res.status, body);
      return;
    }
  } catch (error) {
    console.error('FAIL: Authentication request error:', error.message);
    return;
  }

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // 2. Fetch Customer List to get activationCode and mobile
  let activationCode;
  let customerId;
  let mobile = '9876543210';
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'GET',
      headers: adminHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success && body.data.length > 0) {
      const testCustomer = body.data.find(c => c.mobile === mobile);
      if (testCustomer) {
        activationCode = testCustomer.activationCode;
        customerId = testCustomer._id;
        console.log(`PASS: Found test customer. Code: ${activationCode}, ID: ${customerId}`);
      } else {
        console.error('FAIL: Test customer not found.');
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

  // 3. Authenticate Customer to get Customer Token
  let customerToken;
  try {
    const res = await fetch(`${baseURL}/customer/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activationCode, mobile })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      customerToken = body.data.token;
      console.log('PASS: Authenticated customer successfully.');
    } else {
      console.error('FAIL: Customer authentication failed:', res.status, body);
      return;
    }
  } catch (error) {
    console.error('FAIL: Customer authentication request error:', error.message);
    return;
  }

  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${customerToken}`
  };

  // 4. Test Subscribe to Push Notification
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint-token-for-test-purposes',
    keys: {
      auth: 's5d3f2h6j8k9l0a1b2c3d4==',
      p256dh: 'BLXFvgI0XKZzMpD0ZVOYw_DRnUF4zTKUUPy5dWv9nhxcoHswp2WYzTgRj6jeqO9NyrUXabPr8aVtRBfEgOXygvQ'
    }
  };

  try {
    console.log('Submitting push subscription...');
    const res = await fetch(`${baseURL}/customer/push/subscribe`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify({ subscription: mockSubscription })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      console.log('PASS: Push subscription recorded on server successfully.');
    } else {
      console.error('FAIL: Push subscription failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Push subscription request error:', error.message);
  }

  // 5. Trigger delivery add (which triggers push sending)
  try {
    console.log('Triggering quickAdd to invoke Web Push trigger event...');
    const res = await fetch(`${baseURL}/entries/quick-add`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ customerId, ml: 500, date: '2026-08-25' })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      console.log('PASS: Quick-add completed. Look at server console logs to check push dispatching.');
    } else {
      console.error('FAIL: Quick-add request failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Quick-add request error:', error.message);
  }

  // 6. Test Unsubscribe from Push Notification
  try {
    console.log('Submitting unsubscribe request...');
    const res = await fetch(`${baseURL}/customer/push/unsubscribe`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify({ endpoint: mockSubscription.endpoint })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      console.log('PASS: Push unsubscribe completed successfully.');
    } else {
      console.error('FAIL: Push unsubscribe failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Push unsubscribe request error:', error.message);
  }
}

runTests();
