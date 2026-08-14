import React from 'react';

const AboutUsPage = ({ settings }) => {
  const business = settings?.business || {};

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-6">About {business.name || 'Us'}</h1>
      <div className="card p-8 prose prose-sm sm:prose-base max-w-none text-text-secondary leading-relaxed">
        <p className="mb-4">
          Welcome to {business.name || 'Paapi Crackers'}, your number one source for all quality crackers and fireworks. We're dedicated to providing you the very best of celebration supplies, with an emphasis on quality, safety, and customer satisfaction.
        </p>
        <p className="mb-4">
          Founded with a passion for bringing joy to celebrations, {business.name || 'Paapi Crackers'} has come a long way. When we first started out, our passion for delivering safe and spectacular fireworks drove us to start our own business.
        </p>
        <p className="mb-4">
          We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions or comments, please don't hesitate to contact us.
        </p>
        <p className="mt-8 font-medium text-text-primary">
          Sincerely,<br/>The {business.name || 'Paapi Crackers'} Team
        </p>
      </div>
    </div>
  );
};

export default AboutUsPage;
