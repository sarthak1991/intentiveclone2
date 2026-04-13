'use client'

import { useState } from 'react'

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (tierId: string) => {
    setIsLoading(true)
    try {
      if (tierId === 'free') {
        const response = await fetch('/api/subscription/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'free' })
        })

        if (response.ok) {
          alert('Subscribed to Free tier! You now have 2 sessions per month.')
          window.location.reload()
        }
      } else {
        alert(`Payment integration coming soon!\n\nWeekly: ₹249/week\nMonthly: ₹749/month\n\nFor now, enjoy unlimited free sessions during testing!`)
        const response = await fetch('/api/subscription/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: tierId, grantUnlimited: true })
        })
        if (response.ok) {
          alert('Testing mode: Unlimited sessions granted!')
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Focus Plan
          </h1>
          <p className="text-xl text-gray-600">
            Invest in your focus with ADHD-friendly accountability
          </p>
          <p className="text-sm text-gray-500 mt-2">
            All plans include: 45-minute focus rooms, task tracking, and community support
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Free</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold">Free</span>
              <span className="text-gray-600 ml-2">forever</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">2 focus sessions forever</p>
            <ul className="space-y-3 mt-6 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">2 focus sessions per month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Basic room access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Task tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Community accountability</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('free')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Get Started'}
            </button>
          </div>

          {/* Weekly Tier */}
          <div className="border-2 border-purple-500 rounded-lg bg-white p-6 shadow-xl">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold">Weekly</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold">₹249</span>
              <span className="text-gray-600 ml-2">per week</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">8 focus sessions per week</p>
            <ul className="space-y-3 mt-6 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">8 focus sessions per week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Priority room access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Task tracking & gamification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Captain eligibility (4+ sessions)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Email reminders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">No-show protection</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('weekly')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Subscribe'}
            </button>
          </div>

          {/* Monthly Tier */}
          <div className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Monthly</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold">₹749</span>
              <span className="text-gray-600 ml-2">per month</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">30 focus sessions per month</p>
            <ul className="space-y-3 mt-6 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">30 focus sessions per month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Priority room access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Task tracking & gamification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Captain eligibility</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Email reminders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">No-show protection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Priority support</span>
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-lg mb-2">What happens if I run out of sessions?</h3>
              <p className="text-gray-600">
                You'll see a gentle prompt to upgrade when you try to join a room with no sessions remaining.
                Your streak and progress are saved.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes! Weekly and monthly plans renew automatically but you can cancel anytime from your profile.
                You'll have access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">How do the session limits work?</h3>
              <p className="text-gray-600">
                Each registered room attendance counts as one session. Free tier gives you 2 per month,
                which resets on the 1st of each month. Paid tiers offer much more flexibility.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept UPI, credit/debit cards, netbanking, and Paytm wallet via Razorpay.
                All payments are processed securely through Indian payment gateways.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
