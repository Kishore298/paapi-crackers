import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-6">Terms & Conditions</h1>
      <div className="card p-8 prose prose-sm sm:prose-base max-w-none text-text-secondary leading-relaxed">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <h3>1. Agreement to Terms</h3>
        <p>By accessing or using our services, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
        
        <h3>2. Use License</h3>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only.</p>
        
        <h3>3. Online Orders</h3>
        <p>We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order.</p>

        <h3>4. Pricing and Availability</h3>
        <p>All prices are subject to change without notice. We reserve the right at any time to modify or discontinue the Service without notice at any time.</p>

        <h3>5. Governing Law</h3>
        <p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
      </div>
    </div>
  );
};

export default TermsPage;
