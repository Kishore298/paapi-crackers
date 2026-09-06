require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Models
const Order = require('../models/Order');
const POSSale = require('../models/POSSale');
const Combo = require('../models/Combo');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Services
const stockService = require('../services/stockService');

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find an admin user to act as the 'canceller'
    const admin = await User.findOne({ role: { $in: ['admin', 'superAdmin'] } });
    const adminId = admin ? admin._id : null;
    
    // 1. Process Online Orders
    console.log('--- Processing Online Orders ---');
    const orders = await Order.find({ status: { $ne: 'Cancelled' } }).session(session);
    console.log(`Found ${orders.length} active orders to cancel.`);
    
    let cancelledOrdersCount = 0;
    
    for (const order of orders) {
      console.log(`Cancelling Order ${order.orderNumber}...`);
      
      // Reverse stock if previously deducted
      if (order.stockDeducted && !order.stockReversed) {
        const reversalItems = [];
        for (const item of order.items) {
          if (!item.isCombo && item.product) {
            reversalItems.push({ product: item.product, quantity: item.quantity });
          }
          if (item.isCombo && item.combo) {
            const combo = await Combo.findById(item.combo).session(session);
            if (combo) {
              for (const cp of combo.products) {
                reversalItems.push({
                  product: cp.product,
                  quantity: cp.quantity * item.quantity,
                });
              }
            }
          }
        }

        await stockService.reverseStockForCancellation(
          reversalItems,
          order._id,
          adminId,
          session
        );
        order.stockReversed = true;
      }

      // Reverse customer metrics
      if (order.customer) {
        await Customer.findByIdAndUpdate(
          order.customer,
          {
            $inc: { totalOrders: -1, totalSpending: -order.grandTotal },
          },
          { session }
        );
      }

      // Mark as cancelled
      order.status = 'Cancelled';
      order.cancellationReason = 'Bulk cancellation requested by admin';
      order.cancelledBy = 'admin';
      order.cancelledAt = new Date();
      
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: 'Cancelled',
        reason: 'Bulk cancellation requested by admin',
        changedBy: 'admin',
        changedAt: new Date()
      });

      await order.save({ session });
      cancelledOrdersCount++;
    }

    // 2. Process POS Bills
    console.log('\n--- Processing POS Bills ---');
    const posBills = await POSSale.find({ status: { $ne: 'Cancelled' } }).session(session);
    console.log(`Found ${posBills.length} active POS bills to cancel.`);
    
    let cancelledPOSCount = 0;
    
    for (const sale of posBills) {
      console.log(`Cancelling POS Bill ${sale.billNumber}...`);
      
      const reversalItems = [];
      for (const item of sale.items) {
        if (!item.isCombo && item.product) {
          reversalItems.push({ product: item.product, quantity: item.quantity });
        }
        if (item.isCombo && item.combo) {
          const combo = await Combo.findById(item.combo).session(session);
          if (combo) {
            for (const cp of combo.products) {
              reversalItems.push({
                product: cp.product,
                quantity: cp.quantity * item.quantity,
              });
            }
          }
        }
      }

      await stockService.reverseStockForCancellation(
        reversalItems,
        sale._id,
        adminId,
        session
      );

      // Reverse Customer metrics
      if (sale.customer) {
        await Customer.findByIdAndUpdate(
          sale.customer,
          {
            $inc: { totalOrders: -1, totalSpending: -sale.grandTotal },
          },
          { session }
        );
      }

      sale.status = 'Cancelled';
      sale.cancellationReason = 'Bulk cancellation requested by admin';
      sale.cancelledAt = new Date();
      sale.cancelledBy = adminId;

      await sale.save({ session });
      cancelledPOSCount++;
    }

    await session.commitTransaction();
    console.log(`\n✅ Transaction Committed Successfully!`);
    console.log(`Total Orders Cancelled: ${cancelledOrdersCount}`);
    console.log(`Total POS Bills Cancelled: ${cancelledPOSCount}`);
    
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ Transaction Aborted due to error:', err);
  } finally {
    session.endSession();
    mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

run();
