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
        <div className="card p-6 text-center flex flex-col items-center h-full">
          <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
            <Phone size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">Phone</h3>
          <p className="text-text-secondary text-sm mb-2">Mon-Sat from 10am to 8pm.</p>
          <div>
            <a href={`tel:${phone}`} className="font-medium text-primary hover:underline">{phone || 'Not available'}</a>
          </div>
        </div>

        <div className="card p-6 text-center flex flex-col items-center h-full">
          <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
            <Mail size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">Email</h3>
          <p className="text-text-secondary text-sm mb-2">Our friendly team is here to help.</p>
          <div>
            <a href={`mailto:${email}`} className="font-medium text-primary hover:underline">{email || 'Not available'}</a>
          </div>
        </div>

        <div className="card p-6 text-center flex flex-col items-center h-full">
          <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center mb-4">
            <MapPin size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-text-primary mb-2">Office</h3>
          <p className="text-text-secondary text-sm mb-2">Come say hello at our store HQ.</p>
          <div>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-medium text-primary hover:underline text-sm px-4"
            >
              Paapi Crackers Shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
