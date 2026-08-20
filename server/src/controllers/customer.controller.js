import * as customerService from '../services/customer.service.js';
import jwt from 'jsonwebtoken';
import MilkEntry from '../models/MilkEntry.js';
import Customer from '../models/Customer.js';

export async function create(req, res, next) {
  try {
    const customer = await customerService.createCustomer(req.body);
    return res.status(201).json({
      success: true,
      data: customer,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const { status, area, search } = req.query;
    const customers = await customerService.listCustomers({ status, area, search });
    return res.status(200).json({
      success: true,
      data: customers,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    return res.status(200).json({
      success: true,
      data: customer,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await customerService.updateCustomer(id, req.body);
    return res.status(200).json({
      success: true,
      data: customer,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await customerService.softDeleteCustomer(id);
    return res.status(200).json({
      success: true,
      data: {
        id: customer._id,
        status: customer.status,
        message: 'Customer soft-deleted successfully (marked inactive).',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function activateCustomer(req, res, next) {
  try {
    const { activationCode, mobile } = req.body;

    if (!activationCode || !mobile) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Activation code and mobile number are required.',
      });
    }

    const customer = await Customer.findOne({
      activationCode: activationCode.toUpperCase().trim(),
      mobile: mobile.trim(),
      status: 'active',
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid activation code or mobile number.',
      });
    }

    // Activate the customer account
    customer.isActivated = true;
    await customer.save();

    // Sign an unlimited lifetime JWT token (never expires)
    const token = jwt.sign(
      { id: customer._id, role: 'customer' },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        customer: {
          id: customer._id,
          name: customer.name,
          mobile: customer.mobile,
          area: customer.area,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMeOverview(req, res, next) {
  try {
    const customer = req.customer; // loaded by authCustomer middleware
    const currentMonth = new Date().toLocaleDateString('en-CA').slice(0, 7);

    let card = await MilkEntry.findOne({ customerId: customer._id, month: currentMonth });
    if (!card) {
      // Return empty monthly grid placeholder
      card = {
        customerId: customer._id,
        month: currentMonth,
        days: {},
        totalMl: 0,
        totalAmount: 0,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          mobile: customer.mobile,
          area: customer.area,
          pricePerLiter: customer.pricePerLiter || 60,
          customerNo: customer.customerNo,
        },
        entry: card,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
