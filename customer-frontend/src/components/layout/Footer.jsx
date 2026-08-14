import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = ({ settings }) => {
  const business = settings?.business || {};
  const contact = settings?.website?.contactInfo || {};

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-text-primary mb-2">{business.name || 'Paapi Crackers'}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your one-stop shop for premium quality crackers and fireworks.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Shop' },
                { to: '/about', label: 'About Us' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/my-orders', label: 'My Orders' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3">Policies</h4>
            <ul className="space-y-2">
              {[
                { to: '/terms', label: 'Terms & Conditions' },
                { to: '/privacy-policy', label: 'Privacy Policy' },
                { to: '/shipping-policy', label: 'Shipping Policy' },
                { to: '/cancellation-policy', label: 'Cancellation Policy' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3">Contact Us</h4>
            <ul className="space-y-3">
              {(contact.phone || business.phone) && (
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone size={14} className="text-primary flex-shrink-0" />
                  {contact.phone || business.phone}
                </li>
              )}
              {(contact.email || business.email) && (
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail size={14} className="text-primary flex-shrink-0" />
                  {contact.email || business.email}
                </li>
              )}
              {(contact.address || business.address) && (
                <li className="flex items-start gap-2 text-sm text-text-secondary">
                  <MapPin size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  {contact.address || business.address}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-sm text-text-secondary">
            © {new Date().getFullYear()} {business.name || 'Paapi Crackers'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
