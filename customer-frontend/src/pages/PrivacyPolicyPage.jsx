import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-6">Privacy Policy</h1>
      <div className="card p-8 prose prose-sm sm:prose-base max-w-none text-text-secondary leading-relaxed">
        <h3>1. Information We Collect</h3>
        <p>We collect information from you when you register on our site, place an order, subscribe to our newsletter, respond to a survey or fill out a form. When ordering or registering on our site, as appropriate, you may be asked to enter your: name, e-mail address, mailing address, or phone number.</p>

        <h3>2. How We Use Your Information</h3>
        <p>Any of the information we collect from you may be used in one of the following ways:</p>
        <ul>
          <li>To personalize your experience</li>
          <li>To improve our website</li>
          <li>To improve customer service</li>
          <li>To process transactions</li>
          <li>To send periodic emails or SMS notifications regarding your order</li>
        </ul>

        <h3>3. Data Security</h3>
        <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>

        <h3>4. Third Party Disclosure</h3>
        <p>We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
