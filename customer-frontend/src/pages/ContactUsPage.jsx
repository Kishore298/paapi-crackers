import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const ContactUsPage = ({ settings }) => {
  const contact = settings?.website?.contactInfo || {};
  const business = settings?.business || {};

  const phone = contact.phone || business.phone;
  const email = contact.email || business.email;
  const address = contact.address || business.address;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Contact Us</h1>
        <p className="text-text-secondary">Have any questions? We'd love to hear from you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
            <Phone size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">Phone</h3>
          <p className="text-text-secondary text-sm mb-4">Mon-Sat from 10am to 8pm.</p>
          <a href={`tel:${phone}`} className="font-medium text-primary mt-auto hover:underline">{phone || 'Not available'}</a>
        </div>

        <div className="card p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
            <Mail size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">Email</h3>
          <p className="text-text-secondary text-sm mb-4">Our friendly team is here to help.</p>
          <a href={`mailto:${email}`} className="font-medium text-primary mt-auto hover:underline">{email || 'Not available'}</a>
        </div>

        <div className="card p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
            <MapPin size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">Office</h3>
          <p className="text-text-secondary text-sm mb-4">Come say hello at our store HQ.</p>
          <span className="font-medium text-primary mt-auto text-sm px-4">{address || 'Not available'}</span>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
