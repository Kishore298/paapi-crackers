import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Terms &amp; Conditions</h1>
      <p className="text-text-secondary mb-8">Please read these terms carefully before using our website.</p>
      <div className="card p-8 space-y-6 text-text-secondary leading-relaxed">

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">1. Acceptance of Terms</h3>
          <p>By accessing and placing an order with Paapi Crackers, you confirm that you are in agreement with and bound by the terms and conditions outlined below. These terms apply to the entire website and any email, WhatsApp, or other type of communication between you and Paapi Crackers.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">2. Legal Age Requirement</h3>
          <p>You must be at least 18 years of age to purchase from our website. By placing an order, you certify that you are legally permitted to purchase, receive, and possess our products in your respective city and state.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">3. Products and Pricing</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>All prices are listed in Indian Rupees (INR) and are subject to change without prior notice.</li>
            <li>We strive to display our products as accurately as possible; however, packaging, wrapper designs, and sizes may occasionally vary from the images shown.</li>
            <li>All items are subject to availability. If a purchased item is out of stock, we reserve the right to either refund the amount or substitute it with an item of equal or greater value after obtaining your consent.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">4. Payment Terms</h3>
          <p>We offer 100% secure payment options. Orders will only be processed upon successful verification of payment (for prepaid orders). In the case of Cash on Delivery (COD), standard conditions and limits defined during checkout will apply.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">5. Transport and Liability</h3>
          <p>Our products are strictly regulated goods. We dispatch materials through licensed, third-party logistics/transport agencies. Once the consignment is handed over to the transport agency, Paapi Crackers is not directly liable for transport delays or damages, though we will assist in resolving any issues with the transporter to the best of our ability.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">6. Jurisdiction</h3>
          <p>Any disputes arising out of these terms and conditions shall be subject to the exclusive jurisdiction of the courts in Sivakasi, Tamil Nadu.</p>
        </section>

      </div>
    </div>
  );
};

export default TermsPage;
