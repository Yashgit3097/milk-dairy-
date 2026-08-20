import Customer from '../models/Customer.js';
import generateActivationCode from '../utils/generateActivationCode.js';

export async function createCustomer(customerData) {
  const { name, mobile, area, pricePerLiter } = customerData;

  // Check unique mobile number constraint
  const existingMobile = await Customer.findOne({ mobile });
  if (existingMobile) {
    const error = new Error('A customer with this mobile number already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Generate unique activation code with collision check loop
  let activationCode;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    activationCode = generateActivationCode();
    const existingCode = await Customer.findOne({ activationCode });
    if (!existingCode) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    const error = new Error('Failed to generate a unique activation code. Please try again.');
    error.statusCode = 500;
    throw error;
  }

  // Find the last customer with a customerNo to calculate the next incremental number
  const lastCustomer = await Customer.findOne({ customerNo: { $exists: true } }).sort({ customerNo: -1 });
  const nextNo = lastCustomer && lastCustomer.customerNo ? lastCustomer.customerNo + 1 : 1;

  const customer = new Customer({
    name,
    mobile,
    area,
    activationCode,
    pricePerLiter: pricePerLiter !== undefined ? pricePerLiter : null,
    customerNo: nextNo,
  });

  return await customer.save();
}

export async function listCustomers(filters = {}) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.area && filters.area !== 'All Areas') {
    query.area = filters.area;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: { $regex: searchRegex } },
      { mobile: { $regex: searchRegex } },
    ];
  }

  return await Customer.find(query).sort({ name: 1 });
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }
  return customer;
}

export async function updateCustomer(id, updateData) {
  const { mobile } = updateData;

  // If changing mobile, check for duplication
  if (mobile) {
    const existingMobile = await Customer.findOne({ mobile, _id: { $ne: id } });
    if (existingMobile) {
      const error = new Error('A customer with this mobile number already exists.');
      error.statusCode = 400;
      throw error;
    }
  }

  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  return customer;
}

export async function softDeleteCustomer(id) {
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: { status: 'inactive' } },
    { new: true }
  );

  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  return customer;
}
