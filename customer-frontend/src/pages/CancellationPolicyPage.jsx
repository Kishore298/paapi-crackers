import React from 'react';

const CancellationPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-6">Cancellation & Refund Policy</h1>
      <div className="card p-8 prose prose-sm sm:prose-base max-w-none text-text-secondary leading-relaxed">
        <h3>1. Order Cancellation</h3>
        <p>You can cancel your order at any time before it is dispatched from our warehouse. Once the order status is updated to 'Dispatched', cancellation is no longer possible.</p>
        
        <h3>2. How to Cancel</h3>
        <p>To cancel an order, please contact our customer support team immediately with your Order ID. You can find our contact details on the Contact Us page.</p>
        
        <h3>3. Refunds</h3>
        <p>If your order is successfully cancelled before dispatch, any payments made will be fully refunded to your original method of payment within 5-7 business days.</p>
        
        <h3>4. Returns</h3>
        <p>Due to the explosive and hazardous nature of fireworks, we do not accept returns once the products have been successfully delivered to you. Please review your order carefully before placing it.</p>
        
        <h3>5. Defective Products</h3>
        <p>If you receive defective products, please contact us within 24 hours of delivery with photographic evidence. We will review the case and offer a replacement or refund at our sole discretion.</p>
      </div>
    </div>
  );
};

export default CancellationPolicyPage;
