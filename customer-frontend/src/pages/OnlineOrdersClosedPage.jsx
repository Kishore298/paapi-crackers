import React from 'react';

const OnlineOrdersClosedPage = ({ settings }) => {
  const closedPageSettings = settings?.closedPage || {};
  const business = settings?.business || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full card overflow-hidden text-center">
        <div className="bg-discount p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {closedPageSettings.title || 'Online Orders Closed'}
          </h1>
        </div>
        <div className="p-8">
          <p className="text-text-secondary text-lg mb-8 whitespace-pre-wrap">
            {closedPageSettings.message || "We are currently not accepting online orders. Please visit our store or contact us directly."}
          </p>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-border inline-block text-left mb-6">
            <h3 className="font-bold text-text-primary mb-3">Contact Information</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              {business.phone && (
                <li><span className="font-medium text-text-primary">Phone:</span> {business.phone}</li>
              )}
              {business.email && (
                <li><span className="font-medium text-text-primary">Email:</span> {business.email}</li>
              )}
              {business.address && (
                <li><span className="font-medium text-text-primary">Address:</span> {business.address}</li>
              )}
            </ul>
          </div>
          
          <p className="text-sm text-text-secondary">
            Thank you for choosing {business.name || 'Paapi Crackers'}!
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnlineOrdersClosedPage;
