import PriceConfig from '../models/PriceConfig.js';

export async function listPriceConfigs(req, res, next) {
  try {
    const configs = await PriceConfig.find().sort({ effectiveDate: -1 });
    return res.status(200).json({
      success: true,
      data: configs,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPriceConfig(req, res, next) {
  try {
    const { rate, effectiveDate } = req.body;

    if (rate === undefined || rate === null || rate < 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Price rate is required and must be a non-negative number.',
      });
    }

    const resolvedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();

    const config = await PriceConfig.create({
      rate,
      effectiveDate: resolvedEffectiveDate,
    });

    return res.status(251).json({
      success: true,
      data: config,
      error: null,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'A pricing configuration already exists for this effective date.',
      });
    }
    next(error);
  }
}
