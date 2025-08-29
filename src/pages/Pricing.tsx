import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../hooks/useCredits';

// Professional SVG Icons
const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CrownIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8l3-3 3 3-3 3-3-3zM12 15l-3 3-3-3 3-3 3 3z" />
  </svg>
);

const StarIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SparklesIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const MessageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SupportIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
  </svg>
);

const ContactIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Pricing: React.FC = () => {
  const { currentUser: user, userData } = useAuth();
  const { credits } = useCredits();

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      credits: 3,
      features: [
        '3 AI Messages',
        'Basic Support',
        'Standard Response Time',
        'Community Access'
      ],
      popular: false,
      color: 'border-border-primary',
      bgColor: 'bg-bg-glass',
      buttonColor: 'bg-bg-glass-light hover:bg-bg-glass text-text-secondary hover:text-text-primary border border-border-secondary'
    },
    {
      name: 'Basic',
      price: '₹800',
      credits: 100,
      features: [
        '100 AI Messages',
        'Priority Support',
        'Faster Response Time',
        'Advanced Features',
        'Email Support'
      ],
      popular: true,
      color: 'border-accent-primary',
      bgColor: 'bg-bg-glass',
      buttonColor: 'bg-gradient-accent hover:shadow-accent-hover text-text-primary'
    },
    {
      name: 'Pro',
      price: '₹1799',
      credits: 500,
      features: [
        '500 AI Messages',
        '24/7 Priority Support',
        'Instant Response Time',
        'All Advanced Features',
        'Phone Support',
        'Custom Integrations',
        'API Access'
      ],
      popular: false,
      color: 'border-purple-500',
      bgColor: 'bg-bg-glass',
      buttonColor: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-text-primary'
    }
  ];

  const handleUpgrade = (planName: string) => {
    if (!user) {
      alert('Please sign in to upgrade your plan');
      return;
    }
    
    // Here you would integrate with payment gateway
    alert(`Upgrade to ${planName} plan - Payment integration needed`);
  };

  return (
    <div className="w-full">
      {/* Credits Display */}
      {user && (
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-3 px-6 py-3 glass-light rounded-xl border border-border-secondary">
            <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
            <span className="text-accent-primary font-semibold text-lg">Current Credits: {credits}</span>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative card-modern transition-all duration-300 hover:scale-105 group flex flex-col h-full ${
              plan.popular ? 'ring-2 ring-accent-primary shadow-accent' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-accent text-text-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-accent">
                  <CrownIcon className="w-3 h-3" />
                  <span>Most Popular</span>
                </span>
              </div>
            )}

            <div className="text-center mb-8 pt-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {plan.name === 'Pro' && <StarIcon className="w-6 h-6 text-purple-400" />}
                <h3 className="text-2xl font-bold text-text-primary">{plan.name}</h3>
              </div>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-text-primary">{plan.price}</span>
                {plan.price !== '₹0' && <span className="text-text-secondary">/month</span>}
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-lg text-text-secondary mb-6">
                <MessageIcon className="w-5 h-5" />
                <span>{plan.credits} AI Messages</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center space-x-3">
                  <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.name)}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 mt-auto ${plan.buttonColor}`}
            >
              {user ? 'Upgrade Plan' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Everything you need to know about our pricing and plans
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="card-modern">
            <h3 className="text-lg font-semibold text-text-primary mb-3">How do credits work?</h3>
            <p className="text-text-secondary leading-relaxed">
              Each AI message you send consumes 1 credit. Credits are replenished monthly based on your plan.
            </p>
          </div>
          
          <div className="card-modern">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Can I change plans anytime?</h3>
            <p className="text-text-secondary leading-relaxed">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          
          <div className="card-modern">
            <h3 className="text-lg font-semibold text-text-primary mb-3">What happens if I run out of credits?</h3>
            <p className="text-text-secondary leading-relaxed">
              You can upgrade to a higher plan or wait until your next billing cycle for credit renewal.
            </p>
          </div>
          
          <div className="card-modern">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Is there a free trial?</h3>
            <p className="text-text-secondary leading-relaxed">
              Yes! The Free plan gives you 3 credits to try out our AI features before upgrading.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <div className="card-modern max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <SupportIcon className="w-6 h-6 text-accent-primary" />
            <h3 className="text-2xl font-bold text-text-primary">Need Help?</h3>
          </div>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Our support team is here to help you choose the right plan and answer any questions
          </p>
          <div className="flex justify-center">
            <button className="btn-modern bg-gradient-accent hover:shadow-accent-hover text-lg px-8 py-3 flex items-center justify-center">
              <ContactIcon className="w-5 h-5 mr-2" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
