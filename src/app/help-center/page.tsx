"use client";

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "Do I need an account to browse vehicles?",
        a: "No. You can explore vehicles without creating an account. An account is only required when you want to save vehicles, message sellers, or book appointments."
      },
      {
        q: "How does Carly learn my preferences?",
        a: "Carly observes what you view, save, and compare. Over time, it surfaces vehicles that match your behavior patterns — not just stated preferences."
      },
      {
        q: "Is Carly free to use?",
        a: "Yes. Carly is free for buyers. There are no hidden fees, subscription costs, or charges for messaging or booking appointments."
      }
    ]
  },
  {
    category: "Buying Process",
    questions: [
      {
        q: "How do I message a seller?",
        a: "Click 'Message Seller' on any vehicle listing. Your contact information stays private unless you choose to share it. All communication happens through Carly's secure messaging system."
      },
      {
        q: "Can I book an appointment through Carly?",
        a: "Yes. Once you've messaged a seller, you can book appointments directly through Carly. Choose a time that works for you, and confirm without phone calls."
      },
      {
        q: "What if I change my mind about an appointment?",
        a: "You can reschedule or cancel appointments through your account. No awkward phone calls required."
      }
    ]
  },
  {
    category: "Trust & Safety",
    questions: [
      {
        q: "What does Carly Verified mean?",
        a: "Carly Verified means the seller's identity has been validated, the vehicle information has been cross-checked, and the seller has a history of transparent behavior. It's a trust signal, not a mechanical guarantee."
      },
      {
        q: "How does Carly protect my privacy?",
        a: "Your contact information is never shared unless you choose to share it. Messaging is secure. Browsing is private. You control all communication."
      },
      {
        q: "What if I encounter a suspicious listing?",
        a: "Report it immediately through the listing page or contact us directly. We review all reports and take action when necessary."
      }
    ]
  },
  {
    category: "Account & Settings",
    questions: [
      {
        q: "How do I delete my account?",
        a: "Go to Settings > Account > Delete Account. Your data will be permanently removed within 30 days."
      },
      {
        q: "Can I change my notification preferences?",
        a: "Yes. Go to Settings > Notifications to customize what you receive and how often."
      },
      {
        q: "What happens to my saved vehicles if I log out?",
        a: "They remain in your account. Log back in anytime to access them."
      }
    ]
  }
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Help Center
          </h1>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-12 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Find answers to common questions about using Carly.
          </p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base"
            />
          </div>
        </div>
      </section>

      <section className="px-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const itemId = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems.includes(itemId);
                  
                  return (
                    <div
                      key={itemIndex}
                      className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-200"
                      >
                        <span className="text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent pr-4">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 pt-0">
                          <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-6">
            Still have questions?
          </p>
          <a
            href="/contact-carly"
            className="text-lg bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent hover:opacity-70 transition-colors duration-200 underline"
          >
            Contact Carly
          </a>
        </div>
      </section>
    </div>
  );
}
