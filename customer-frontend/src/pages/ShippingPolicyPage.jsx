import React from 'react';

const ShippingPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Shipping &amp; Delivery Policy</h1>
      <p className="text-text-secondary mb-8">Information on how we get your festive items delivered safely.</p>
      <div className="card p-8 space-y-6 text-text-secondary leading-relaxed">

        <p>Due to the nature of our products, standard courier services (like DTDC, BlueDart, Postal Service) cannot be used for delivery. All products are dispatched strictly through registered Transport Services (Parcel Services).</p>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">1. Dispatch Process</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>All confirmed orders are processed and packed within 2-3 business days.</li>
            <li>Once packed, the parcel is dropped at the nearest partnered Transport office in Sivakasi.</li>
            <li>We will inform you via email, SMS, or WhatsApp with the order status once dispatched.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">2. Collection from Destination</h3>
          <p className="mb-2">Because door-delivery is rarely supported, customers must collect their parcels from the corresponding transport office branch in their city.</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>When the parcel arrives at your city, the transport agency will usually call your registered mobile number.</li>
            <li>You will need to present an ID proof and the pending transport freight charges (if not pre-paid) to collect the boxes.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">3. Delivery Timelines</h3>
          <p className="mb-2">Delivery speed depends heavily on your geographic location relative to Sivakasi, Tamil Nadu.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-text-primary">Region</th>
                  <th className="text-left px-4 py-2 font-semibold text-text-primary">Estimated Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-2">Tamil Nadu</td><td className="px-4 py-2">2 – 4 Days</td></tr>
                <tr><td className="px-4 py-2">South India (Karnataka, Kerala, AP, Telangana)</td><td className="px-4 py-2">4 – 6 Days</td></tr>
                <tr><td className="px-4 py-2">Other States</td><td className="px-4 py-2">7 – 12 Days</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm italic">Note: During the peak Diwali season, timelines may be extended due to heavy rush at transport hubs.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold text-text-primary mb-2">4. Shipping Charges</h3>
          <p>Unless explicitly mentioned as "Free Shipping" during checkout, transport freight charges (loading/unloading and transport fee) are usually paid by the customer either directly during checkout, or as a "To-Pay" amount given directly to the transporter at the time of parcel collection.</p>
        </section>

      </div>
    </div>
  );
};

export default ShippingPolicyPage;
