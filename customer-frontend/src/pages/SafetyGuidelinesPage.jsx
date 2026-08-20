import React from 'react';
import { AlertTriangle, CheckCircle, Flame, Package } from 'lucide-react';

const SafetyGuidelinesPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Flame size={22} className="text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary">Product Safety Guidelines</h1>
      </div>
      <p className="text-text-secondary mb-8">Celebrate safely. Please read carefully before handling any products.</p>

      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 mb-8">
        <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-orange-800 font-medium">
          Fireworks are regulated hazardous goods. Always supervise children and follow all local laws regarding their use.
        </p>
      </div>

      <div className="space-y-6">

        {/* Storage */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Storage</h2>
          </div>
          <ul className="space-y-2 text-text-secondary">
            {[
              'Store products in a cool, dry place away from any sparks, open flames, or direct severe sunlight.',
              'Keep them out of reach of young children and pets.',
              'Never keep products loose in your pockets.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preparation */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Preparation</h2>
          </div>
          <ul className="space-y-2 text-text-secondary">
            {[
              'Always keep a bucket of water, sand, or a fire extinguisher nearby before using products.',
              'Wear cotton, well-fitted clothes. Avoid synthetic/loose garments.',
              'Always wear footwear when stepping out to use products.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Best Practices */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Best Practices While Lighting</h2>
          </div>
          <div className="space-y-4 text-text-secondary">
            {[
              { title: 'Adult Supervision', desc: 'Children should only handle our products under strict adult supervision.' },
              { title: 'Open Spaces', desc: 'Only use products in open grounds. Never attempt to use products indoors, inside a vehicle, or near dry grass/leaves.' },
              { title: 'Distance', desc: 'Maintain at least an arm\'s length distance when lighting the fuse. Move away instantly once the fuse catches fire.' },
              { title: 'Never Relight', desc: 'If a product fails to go off (a dud), do not approach it immediately. Wait 15-20 minutes, then pour water over it. Never attempt to relight a dud.' },
              { title: 'Proper Supports', desc: 'For outdoor products, use a sturdy, thick-walled bottle or a proper launching tube placed on flat ground facing away from buildings and trees.' },
              { title: 'One at a Time', desc: 'Light only one product at a time. Do not attempt to string them together unless they belong to a pre-strung "wala" package.' },
              { title: 'Disposal', desc: 'Dispose of used products by sweeping them up and soaking them in a bucket of water before discarding them in the trash.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-lighter text-primary text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{item.title}</p>
                  <p className="text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SafetyGuidelinesPage;
