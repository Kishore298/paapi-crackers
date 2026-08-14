const Order = require('../models/Order');
const POSSale = require('../models/POSSale');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const lowStockThreshold = settings.inventory?.lowStockThreshold || 10;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = { createdAt: { $gte: today, $lt: tomorrow } };

    // Parallel queries for dashboard stats
    const [
      totalOrders,
      newOrders,
      todayOrders,
      allOrders,
      todayOrdersList,
      lowStockCount,
      outOfStockCount,
      posSales,
      todayPOSSales,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments(todayFilter),
      Order.find().select('grandTotal gstAmount paymentStatus source').lean(),
      Order.find(todayFilter).select('grandTotal gstAmount').lean(),
      Product.countDocuments({ active: true, stock: { $gt: 0, $lte: lowStockThreshold } }),
      Product.countDocuments({ active: true, stock: 0 }),
      POSSale.find().select('grandTotal gstAmount').lean(),
      POSSale.find(todayFilter).select('grandTotal gstAmount').lean(),
    ]);

    // Calculate GST-exclusive figures
    const totalSales = allOrders.reduce((sum, o) => sum + (o.grandTotal - (o.gstAmount || 0)), 0);
    const todaySales = todayOrdersList.reduce((sum, o) => sum + (o.grandTotal - (o.gstAmount || 0)), 0);
    const onlineOrders = allOrders.filter((o) => o.source === 'online').length;
    const posSalesTotal = posSales.reduce((sum, s) => sum + (s.grandTotal - (s.gstAmount || 0)), 0);
    const pendingPayments = allOrders.filter((o) => o.paymentStatus === 'Pending').length;
    const onlineCollections = allOrders
      .filter((o) => o.paymentStatus === 'Completed')
      .reduce((sum, o) => sum + o.grandTotal, 0);
    const posCollections = posSales.reduce((sum, s) => sum + s.grandTotal, 0);

    const todayTotalSales = todaySales +
      todayPOSSales.reduce((sum, s) => sum + (s.grandTotal - (s.gstAmount || 0)), 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        newOrders,
        todayOrders,
        totalSales: Math.round(totalSales * 100) / 100,
        todaySales: Math.round(todayTotalSales * 100) / 100,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        onlineOrders,
        posSalesCount: posSales.length,
        posSalesTotal: Math.round(posSalesTotal * 100) / 100,
        pendingPayments,
        onlineCollections: Math.round(onlineCollections * 100) / 100,
        posCollections: Math.round(posCollections * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/charts
exports.getChartData = async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Sales over time
    const salesByDate = await Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: { $subtract: ['$grandTotal', { $ifNull: ['$gstAmount', 0] }] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const posByDate = await POSSale.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: { $subtract: ['$grandTotal', { $ifNull: ['$gstAmount', 0] }] } },
          saleCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Product performance
    const productPerformance = await Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productSnapshot.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    // Payment collection
    const paymentBreakdown = await Order.aggregate([
      { $match: { paymentStatus: 'Completed', createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        salesByDate,
        posByDate,
        productPerformance,
        paymentBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
