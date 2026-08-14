const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const { sendPushNotification } = require('../config/firebase');
const Customer = require('../models/Customer');

/**
 * Notification Service
 * Channels: Socket.IO (real-time), Firebase FCM (push), MongoDB (history)
 */

const sendInApp = (recipientType, recipientId, notification) => {
  try {
    const io = getIO();
    if (recipientType === 'admin') {
      io.to('admin-room').emit('notification', notification);
    } else if (recipientId) {
      io.to(`customer-${recipientId}`).emit('notification', notification);
    }
  } catch (error) {
    console.error('Socket notification error:', error.message);
  }
};

const sendPush = async (recipientId, title, body, data = {}) => {
  try {
    const customer = await Customer.findById(recipientId);
    if (customer && customer.fcmToken) {
      await sendPushNotification(customer.fcmToken, title, body, data);
    }
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

const saveToHistory = async (notificationData) => {
  try {
    return await Notification.create(notificationData);
  } catch (error) {
    console.error('Save notification error:', error.message);
  }
};

/**
 * Send notification through all channels
 */
const sendAll = async ({ recipientType, recipientId, type, title, message, data = {} }) => {
  const notification = {
    recipientType,
    recipientId,
    type,
    title,
    message,
    data,
  };

  // Save to DB
  const saved = await saveToHistory(notification);

  // Send real-time via Socket.IO
  sendInApp(recipientType, recipientId, {
    ...notification,
    _id: saved?._id,
    createdAt: saved?.createdAt || new Date(),
  });

  // Send push notification for customers
  if (recipientType === 'customer' && recipientId) {
    await sendPush(recipientId, title, message, data);
  }

  return saved;
};

/**
 * Notify admin about new order
 */
const notifyNewOrder = async (order) => {
  await sendAll({
    recipientType: 'admin',
    type: 'new_order',
    title: 'New Order Received',
    message: `Order #${order.orderNumber} - ₹${order.grandTotal} from ${order.customerDetails.name}`,
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });
};

/**
 * Notify customer about order confirmation
 */
const notifyOrderConfirmation = async (order) => {
  await sendAll({
    recipientType: 'customer',
    recipientId: order.customer,
    type: 'order_confirmation',
    title: 'Order Confirmed!',
    message: `Your order #${order.orderNumber} has been placed successfully. Total: ₹${order.grandTotal}`,
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });
};

/**
 * Notify customer about dispatch
 */
const notifyOrderDispatched = async (order) => {
  await sendAll({
    recipientType: 'customer',
    recipientId: order.customer,
    type: 'order_dispatched',
    title: 'Order Dispatched!',
    message: `Your order #${order.orderNumber} has been dispatched.`,
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });
};

/**
 * Notify customer about cancellation
 */
const notifyOrderCancelled = async (order, reason) => {
  await sendAll({
    recipientType: 'customer',
    recipientId: order.customer,
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}`,
    data: { orderId: order._id, orderNumber: order.orderNumber, reason },
  });
};

/**
 * Notify customer about payment update
 */
const notifyPaymentUpdate = async (order) => {
  await sendAll({
    recipientType: 'customer',
    recipientId: order.customer,
    type: 'payment_update',
    title: 'Payment Updated',
    message: `Payment for order #${order.orderNumber} has been marked as ${order.paymentStatus}.`,
    data: { orderId: order._id, orderNumber: order.orderNumber },
  });
};

module.exports = {
  sendAll,
  sendInApp,
  sendPush,
  saveToHistory,
  notifyNewOrder,
  notifyOrderConfirmation,
  notifyOrderDispatched,
  notifyOrderCancelled,
  notifyPaymentUpdate,
};
