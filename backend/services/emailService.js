const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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

const getEmailTemplate = (content) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #7c3aed; padding: 24px; text-align: center;">
        <img src="cid:paapi-logo" alt="Paapi Crackers Logo" style="height: 60px; object-fit: contain; margin-bottom: 0;" />
      </div>
      <div style="padding: 30px; color: #374151; line-height: 1.6; font-size: 15px;">
        ${content}
      </div>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-weight: bold;">Paapi Crackers</p>
        <p style="margin: 5px 0 0;">Sparkling deals for your celebrations!</p>
        <p style="margin: 15px 0 0;">&copy; ${new Date().getFullYear()} Paapi Crackers. All rights reserved.</p>
      </div>
    </div>
  `;
};

const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not configured. Skipping email to:', to);
      return null;
    }

    const mail = getTransporter();
    
    // Wrap the HTML content in our branded template
    const finalHtml = getEmailTemplate(html);
    
    // Add logo to attachments for inline CID usage
    const logoPath = path.join(__dirname, '../public/paapi-logo.png');
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'paapi-logo.png',
        path: logoPath,
        cid: 'paapi-logo' // same cid value as in the html img src
      });
    }

    const info = await mail.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Paapi Crackers'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: finalHtml,
      text,
      attachments,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    return null;
  }
};

const sendOrderConfirmationEmail = async (order, pdfBuffer = null) => {
  if (!order.customerDetails?.email) return;

  const itemsHtml = order.items
    .map((item) => {
      const mrp = Number(item.productSnapshot?.mrp || item.price).toFixed(2);
      let disc = '-';
      if (item.productSnapshot?.mrp && item.productSnapshot?.discountPrice) {
        const d = Number(item.productSnapshot.mrp) - Number(item.productSnapshot.discountPrice);
        if (d > 0) disc = d.toFixed(2);
      } else if (item.discount > 0) {
        disc = item.discount.toFixed(2);
      }
      return `<tr><td>${item.productSnapshot.name}</td><td>${item.quantity}</td><td>₹${mrp}</td><td>₹${disc}</td><td>₹${item.price}</td><td>₹${item.total}</td></tr>`;
    })
    .join('');

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Order-${order.orderNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  await sendEmail({
    to: order.customerDetails.email,
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <h2 style="color: #7c3aed; margin-top: 0;">Order Confirmed! 🎉</h2>
      <p>Hi <strong>${order.customerDetails.name}</strong>,</p>
      <p>Thank you for shopping with us! Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
              <th style="padding: 8px 0; color: #4b5563;">Product</th>
              <th style="padding: 8px 0; color: #4b5563;">Qty</th>
              <th style="padding: 8px 0; color: #4b5563;">MRP</th>
              <th style="padding: 8px 0; color: #4b5563;">Disc</th>
              <th style="padding: 8px 0; color: #4b5563;">Rate</th>
              <th style="padding: 8px 0; color: #4b5563; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml.replace(/<td>/g, '<td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">').replace(/<tr>/g, '<tr>').replace(/<td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">₹/g, '<td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">₹')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="padding-top: 15px; text-align: right; font-weight: bold; color: #111827;">Grand Total:</td>
              <td style="padding-top: 15px; text-align: right; font-weight: bold; color: #7c3aed; font-size: 18px;">₹${order.grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style="margin-bottom: 0;">We've attached an official copy of your order details to this email.</p>
    `,
    attachments,
  });
};

const sendOrderCancellationEmail = async (order, reason) => {
  if (!order.customerDetails?.email) return;

  await sendEmail({
    to: order.customerDetails.email,
    subject: `Order Cancelled - #${order.orderNumber}`,
    html: `
      <h2 style="color: #dc2626; margin-top: 0;">Order Cancelled</h2>
      <p>Hi <strong>${order.customerDetails.name}</strong>,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p style="margin-bottom: 0;">If you have any questions or feel this was a mistake, please contact our support team.</p>
    `,
  });
};

const sendOrderDispatchedEmail = async (order) => {
  if (!order.customerDetails?.email) return;

  await sendEmail({
    to: order.customerDetails.email,
    subject: `Order Dispatched - #${order.orderNumber}`,
    html: `
      <h2 style="color: #7c3aed; margin-top: 0;">Order Dispatched! 🚚</h2>
      <p>Hi <strong>${order.customerDetails.name}</strong>,</p>
      <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been carefully packed and dispatched from our warehouse.</p>
      <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; text-align: center; margin: 25px 0;">
        <h3 style="margin: 0 0 10px 0; color: #374151;">Track Your Delivery</h3>
        <p style="margin: 0; color: #6b7280;">Our delivery partner will reach out to you soon with delivery specifics.</p>
      </div>
      <p style="margin-bottom: 0;">Get ready for a sparkling celebration!</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderDispatchedEmail,
};
