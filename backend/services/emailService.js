const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not configured. Skipping email to:', to);
      return null;
    }

    const mail = getTransporter();
    const info = await mail.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Paapi Crackers'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    return null;
  }
};

const sendOrderConfirmationEmail = async (order) => {
  if (!order.customerDetails?.email) return;

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td>${item.productSnapshot.name}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.total}</td></tr>`
    )
    .join('');

  await sendEmail({
    to: order.customerDetails.email,
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <h2>Order Confirmed!</h2>
      <p>Hi ${order.customerDetails.name},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${itemsHtml}
      </table>
      <p><strong>Grand Total: ₹${order.grandTotal}</strong></p>
      <p>Thank you for shopping with us!</p>
    `,
  });
};

const sendOrderCancellationEmail = async (order, reason) => {
  if (!order.customerDetails?.email) return;

  await sendEmail({
    to: order.customerDetails.email,
    subject: `Order Cancelled - #${order.orderNumber}`,
    html: `
      <h2>Order Cancelled</h2>
      <p>Hi ${order.customerDetails.name},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have any questions, please contact us.</p>
    `,
  });
};

const sendOrderDispatchedEmail = async (order) => {
  if (!order.customerDetails?.email) return;

  await sendEmail({
    to: order.customerDetails.email,
    subject: `Order Dispatched - #${order.orderNumber}`,
    html: `
      <h2>Order Dispatched!</h2>
      <p>Hi ${order.customerDetails.name},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been dispatched.</p>
      <p>Thank you for shopping with us!</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderDispatchedEmail,
};
