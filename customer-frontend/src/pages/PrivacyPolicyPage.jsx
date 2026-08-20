import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
      <p className="text-text-secondary mb-8">How we collect, use, and protect your information.</p>
      <div className="card p-8 space-y-6 text-text-secondary leading-relaxed">

        <p>Paapi Crackers ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Paapi Crackers when you use our website.</p>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">1. Information We Collect</h3>
          <p className="mb-2">We collect information that you directly provide to us, such as:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Personal Data:</strong> Name, phone number, email address, and password when you register or place an order.</li>
            <li><strong>Shipping Data:</strong> Delivery addresses, pin codes, and recipient names.</li>
            <li><strong>Order Data:</strong> Details about the products you have ordered from us.</li>
          </ul>
          <p className="mt-2">Please note that we do not store debit/credit card or net banking details. Payments are securely processed via offline transfers (e.g., Google Pay) with verification.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">2. How We Use Your Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>To process your orders, arrange shipping, and provide invoices/receipts.</li>
            <li>To communicate with you regarding your order status via SMS, Email, or WhatsApp.</li>
            <li>To provide customer support and troubleshoot order issues.</li>
            <li>To send you promotional offers and updates (only if you have opted in).</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">3. WhatsApp Communication</h3>
          <p>By sharing your phone number with us, you consent to receive transactional notifications (such as order confirmations, status updates, and payment links) via WhatsApp. You can opt out of promotional messages at any time.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">4. Sharing Your Information</h3>
          <p className="mb-2">We only share your information with trusted third parties to facilitate our services, such as:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Delivery Partners:</strong> Forwarding your name, number, and address to our assigned transport services for seamless delivery.</li>
            <li><strong>Payment Processors:</strong> To facilitate secure online transactions.</li>
          </ul>
          <p className="mt-2">We do not sell, trade, or rent your personal identification information to others.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">5. Data Security</h3>
          <p>We implement industry-standard data collection, storage, and processing practices, including security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">6. Contacting Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="mt-2"><strong>Paapi Crackers</strong><br />
          Email: <a href="mailto:paapicrackers@gmail.com" className="text-primary hover:underline">paapicrackers@gmail.com</a><br />
          Phone: <a href="tel:+916383668791" className="text-primary hover:underline">+91 63836 68791</a></p>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
