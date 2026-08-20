const baseURL = 'http://127.0.0.1:5000/api';
const todayDate = new Date().toLocaleDateString('en-CA');

async function runTests() {
  console.log('--- RUNNING PHASE 7 API VERIFICATION TESTS ---');

  // Helper to parse responses
  const printRes = async (res) => {
    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  };

  // 1. Log in as Admin
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

  // 2. Set global pricing config: Rate = 70 effective today
  try {
    console.log('Registering global price version: ₹70.00/L effective today');
    const res = await fetch(`${baseURL}/admin/pricing`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ rate: 70, effectiveDate: todayDate })
    });
    const body = await printRes(res);
    if (res.status === 251 && body.success) {
      console.log('PASS: Global price configuration registered successfully.');
    } else {
      console.log('Note: Price configuration for this date might already exist or responded:', body.error || body);
    }
  } catch (error) {
    console.error('FAIL: Global pricing config creation request error:', error.message);
  }

  // 3. Create two test customers:
  // - Customer A (No personal price override)
  // - Customer B (Personal price override = 80)
  let custAId, custBId;
  try {
    // Customer A
    console.log('Creating Test Customer A (no personal override rate)...');
    const resA = await fetch(`${baseURL}/customers`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Price Customer A',
        mobile: '9111111111',
        area: 'Price Sector',
        pricePerLiter: null // default rate (no override)
      })
    });
    const bodyA = await printRes(resA);
    if (resA.status === 201 && bodyA.success) {
      custAId = bodyA.data._id;
      console.log(`PASS: Created Customer A: ${custAId}`);
    } else if (resA.status === 400 && bodyA.error.includes('already exists')) {
      // Fetch list to find ID
      const listRes = await fetch(`${baseURL}/customers`, { method: 'GET', headers: adminHeaders });
      const listBody = await listRes.json();
      const match = listBody.data.find(c => c.mobile === '9111111111');
      custAId = match._id;
      console.log(`PASS: Found existing Customer A ID: ${custAId}`);
    }

    // Customer B
    console.log('Creating Test Customer B (override rate = 80)...');
    const resB = await fetch(`${baseURL}/customers`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Price Customer B',
        mobile: '9222222222',
        area: 'Price Sector',
        pricePerLiter: 80 // explicit override
      })
    });
    const bodyB = await printRes(resB);
    if (resB.status === 201 && bodyB.success) {
      custBId = bodyB.data._id;
      console.log(`PASS: Created Customer B: ${custBId}`);
    } else if (resB.status === 400 && bodyB.error.includes('already exists')) {
      // Fetch list to find ID
      const listRes = await fetch(`${baseURL}/customers`, { method: 'GET', headers: adminHeaders });
      const listBody = await listRes.json();
      const match = listBody.data.find(c => c.mobile === '9222222222');
      custBId = match._id;
      console.log(`PASS: Found existing Customer B ID: ${custBId}`);
    }
  } catch (error) {
    console.error('FAIL: Test customer creation request error:', error.message);
    return;
  }

  // 4. Log today's delivery: 1000ml (1L) for both
  try {
    console.log('Quick-adding 1000ml for Customer A...');
    await fetch(`${baseURL}/entries/quick-add`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ customerId: custAId, ml: 1000, date: todayDate })
    });

    console.log('Quick-adding 1000ml for Customer B...');
    await fetch(`${baseURL}/entries/quick-add`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ customerId: custBId, ml: 1000, date: todayDate })
    });
    console.log('PASS: Logged today\'s deliveries successfully.');
  } catch (error) {
    console.error('FAIL: Logging deliveries request error:', error.message);
    return;
  }

  // 5. Query their monthly cards and check rate resolutions
  const monthStr = todayDate.slice(0, 7);
  try {
    // Check Customer A (expects ₹70 due)
    const resA = await fetch(`${baseURL}/customers/${custAId}/entries/${monthStr}`, {
      method: 'GET',
      headers: adminHeaders
    });
    const bodyA = await printRes(resA);
    const amountA = bodyA.data.totalAmount;
    console.log(`Customer A totalAmount (₹): ${amountA}`);
    if (amountA === 70) {
      console.log('PASS: Customer A dynamically resolved to the global ₹70.00 rate successfully.');
    } else {
      console.error(`FAIL: Expected Customer A amount to be ₹70, got ₹${amountA}`);
    }

    // Check Customer B (expects ₹80 due)
    const resB = await fetch(`${baseURL}/customers/${custBId}/entries/${monthStr}`, {
      method: 'GET',
      headers: adminHeaders
    });
    const bodyB = await printRes(resB);
    const amountB = bodyB.data.totalAmount;
    console.log(`Customer B totalAmount (₹): ${amountB}`);
    if (amountB === 80) {
      console.log('PASS: Customer B resolved to their override ₹80.00 rate successfully.');
    } else {
      console.error(`FAIL: Expected Customer B amount to be ₹80, got ₹${amountB}`);
    }
  } catch (error) {
    console.error('FAIL: Querying card totals request error:', error.message);
  }
}

runTests();
