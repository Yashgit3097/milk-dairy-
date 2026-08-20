import * as entriesService from '../services/entries.service.js';
import MilkEntry from '../models/MilkEntry.js';


export async function getMonthlyCards(req, res, next) {
  try {
    const { id } = req.params; // customer ID
    
    // Check if the requester is the customer and trying to access someone else's data (strict ownership rule)
    if (req.customer && req.customer.id !== id) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden. You are not allowed to view another customer\'s profile.',
      });
    }

    const cards = await entriesService.getMonthlyCards(id);
    return res.status(200).json({
      success: true,
      data: cards,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCardByMonth(req, res, next) {
  try {
    const { id, month } = req.params;

    // Ownership check for customer-facing queries
    if (req.customer && req.customer.id !== id) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden. Access to another customer\'s profile is denied.',
      });
    }

    const card = await entriesService.getCardByMonth(id, month);
    return res.status(200).json({
      success: true,
      data: card,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function quickAdd(req, res, next) {
  try {
    const { customerId, ml, date } = req.body;

    if (!customerId || ml === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'CustomerId and quantity in ml are required.',
      });
    }

    const resolvedDate = date || new Date().toLocaleDateString('en-CA');
    const entry = await entriesService.addMilk(customerId, ml, resolvedDate);

    // Broadcast Socket.IO update
    const io = req.app.get('io');
    if (io) {
      const socketPayload = {
        customerId,
        date: resolvedDate,
        ml,
        monthTotals: {
          totalMl: entry.totalMl,
          totalAmount: entry.totalAmount,
        },
      };
      io.to('admin').emit('milk:added', socketPayload);
      io.to(`customer:${customerId}`).emit('milk:added', {
        date: resolvedDate,
        ml,
        monthTotals: {
          totalMl: entry.totalMl,
          totalAmount: entry.totalAmount,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: entry,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function undo(req, res, next) {
  try {
    const { customerId } = req.params;
    const { date } = req.query; // get date query if provided

    const resolvedDate = date || new Date().toLocaleDateString('en-CA');
    const entry = await entriesService.undoLastMilk(customerId, resolvedDate);

    // Broadcast Socket.IO removal update
    const io = req.app.get('io');
    if (io) {
      const socketPayload = {
        customerId,
        date: resolvedDate,
        monthTotals: {
          totalMl: entry.totalMl,
          totalAmount: entry.totalAmount,
        },
      };
      io.to('admin').emit('milk:removed', socketPayload);
      io.to(`customer:${customerId}`).emit('milk:removed', {
        date: resolvedDate,
        monthTotals: {
          totalMl: entry.totalMl,
          totalAmount: entry.totalAmount,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: entry,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCardsByMonthForAll(req, res, next) {
  try {
    const { month } = req.params;
    const entries = await MilkEntry.find({ month });
    return res.status(200).json({
      success: true,
      data: entries,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
