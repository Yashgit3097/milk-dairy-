import * as dashboardService from '../services/dashboard.service.js';

export async function getOverview(req, res, next) {
  try {
    const data = await dashboardService.getOverviewData();
    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
