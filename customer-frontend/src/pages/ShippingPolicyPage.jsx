import React from 'react';

const ShippingPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-6">Shipping & Delivery Policy</h1>
      <div className="card p-8 prose prose-sm sm:prose-base max-w-none text-text-secondary leading-relaxed">
        <h3>1. Delivery Areas</h3>
        <p>We currently deliver only to select pincodes within Tamil Nadu and neighboring states. Delivery availability will be confirmed during the checkout process when you enter your shipping pincode.</p>

        <h3>2. Processing Time</h3>
        <p>All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders (especially during festival seasons), shipments may be delayed by a few days.</p>

        <h3>3. Delivery Charges</h3>
        <p>Delivery charges for your order will be calculated and displayed at checkout. We offer free delivery on orders exceeding our minimum threshold amount.</p>

        <h3>4. Shipment Confirmation</h3>
        <p>You will receive a Shipment Confirmation email/SMS once your order has shipped containing your tracking number(s).</p>
        
        <h3>5. Damages</h3>
        <p>Paapi Crackers is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.</p>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
