const baseURL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- RUNNING PHASE 5 API VERIFICATION TESTS ---');

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
  let mobile = '9876543210';
  try {
    const res = await fetch(`${baseURL}/customers`, {
      method: 'GET',
      headers: adminHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success && body.data.length > 0) {
      // Find our customer (Verification Customer)
      // Since it was soft-deleted, let's reactivate it first to verify activation!
      const testCustomer = body.data.find(c => c.mobile === mobile);
      if (testCustomer) {
        activationCode = testCustomer.activationCode;
        console.log(`PASS: Found test customer. Code: ${activationCode}, Mobile: ${mobile}`);
        
        // Reactivate if it was marked inactive
        if (testCustomer.status === 'inactive') {
          console.log('Reactivating customer first...');
          const reactivateRes = await fetch(`${baseURL}/customers/${testCustomer._id}`, {
            method: 'PUT',
            headers: adminHeaders,
            body: JSON.stringify({ status: 'active' })
          });
          const reactivateBody = await printRes(reactivateRes);
          if (reactivateRes.status === 200 && reactivateBody.success) {
            console.log('PASS: Customer reactivated successfully.');
          } else {
            console.error('FAIL: Reactivation failed:', reactivateBody);
          }
        }
      } else {
        console.error('FAIL: Test customer with mobile 9876543210 not found.');
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

  // 3. Test Customer Activation
  let customerToken;
  try {
    console.log(`Activating customer with code ${activationCode} and mobile ${mobile}`);
    const res = await fetch(`${baseURL}/customer/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activationCode, mobile })
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      customerToken = body.data.token;
      console.log('PASS: Customer activated successfully! Received token.');
    } else {
      console.error('FAIL: Customer activation failed:', res.status, body);
      return;
    }
  } catch (error) {
    console.error('FAIL: Customer activation request error:', error.message);
    return;
  }

  const customerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${customerToken}`
  };

  // 4. Test Customer Overview (me/overview)
  try {
    const res = await fetch(`${baseURL}/customer/me/overview`, {
      method: 'GET',
      headers: customerHeaders
    });
    const body = await printRes(res);
    if (res.status === 200 && body.success) {
      console.log('PASS: Fetched customer me/overview successfully!');
      console.log('Customer Details:', body.data.customer);
      console.log('Month Card Month:', body.data.entry.month);
      console.log('Days with deliveries:', Object.keys(body.data.entry.days));
    } else {
      console.error('FAIL: Fetching me/overview failed:', res.status, body);
    }
  } catch (error) {
    console.error('FAIL: Fetching me/overview request error:', error.message);
  }
}

runTests();
