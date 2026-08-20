import React from 'react';

const CancellationPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Refund &amp; Cancellation Policy</h1>
      <p className="text-text-secondary mb-8">Please review our rules regarding order cancellations.</p>
      <div className="card p-8 space-y-6 text-text-secondary leading-relaxed">

        <p>Due to the regulated nature of our festive products, all sales are considered final once the parcel is handed over to the transport agency.</p>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">1. Order Cancellations</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Before Dispatch:</strong> You can cancel your order and receive a full refund if the order has not yet been dispatched from our Sivakasi warehouse. Please contact us immediately at <a href="tel:+916383668791" className="text-primary hover:underline">+91 63836 68791</a> to request a cancellation.</li>
            <li><strong>After Dispatch:</strong> Once your parcel is shipped, we cannot process any cancellations.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">2. Damaged or Defective Items</h3>
          <p>We take extreme care in packing our items using thick corrugated boxes. However, if you receive a product that is visibly damaged due to transport mishandling, please take a photograph or video immediately upon opening the box and share it with us on WhatsApp. Claims must be made within <strong>24 hours</strong> of collecting the parcel. Approvals for partial refunds or replacements are at the sole discretion of Paapi Crackers management.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">3. Refund Process</h3>
          <p>Approved refunds for pre-paid, cancelled orders will be processed back to the original mode of payment (Netbanking, UPI, Credit/Debit card). Depending on the bank aggregator, the credited amount will reflect in your account within 5-7 business days.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">4. Returns</h3>
          <p>Combustible items cannot be returned through regular courier services due to strict Indian Logistics regulations. Therefore, we do not accept physical returns of products once collected by the customer.</p>
        </section>

      </div>
    </div>
  );
};

export default CancellationPolicyPage;
