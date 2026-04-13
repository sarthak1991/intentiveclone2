'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

interface Tier {
  id: 'free' | 'weekly' | 'monthly'
  name: string
  price: number
  priceInr: number
  sessions: number
  period: string
  features: string[]
  popular?: boolean
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceInr: 0,
    sessions: 2,
    period: 'forever',
    features: [
      '2 focus sessions per month',
      'Basic room access',
      'Task tracking',
      'Community accountability'
    ]
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 3,
    priceInr: 249,
    sessions: 8,
    period: 'per week',
    popular: true,
    features: [
      '8 focus sessions per week',
      'Priority room access',
      'Task tracking & gamification',
      'Captain eligibility (4+ sessions)',
      'Email reminders',
      'No-show protection'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9,
    priceInr: 749,
    sessions: 30,
    period: 'per month',
    features: [
      '30 focus sessions per month',
      'Priority room access',
      'Task tracking & gamification',
      'Captain eligibility',
      'Email reminders',
      'No-show protection',
      'Priority support'
    ]
  }
]

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<'free' | 'weekly' | 'monthly'>('free')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (tierId: 'free' | 'weekly' | 'monthly') => {
    setIsLoading(true)
    try {
      // For free tier, just update user subscription
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
        // For paid tiers, show Razorpay (dummy for now)
        alert(`Payment integration coming soon!\\n\\nWeekly: ₹249/week\\nMonthly: ₹749/month\\n\\nFor now, enjoy unlimited free sessions during testing!`)
        // Grant unlimited sessions during testing
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
            💜 All plans include: 45-minute focus rooms, task tracking, and community support
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${
                tier.popular
                  ? 'border-2 border-purple-500 shadow-xl scale-105'
                  : 'border border-gray-200'
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {tier.price === 0 ? 'Free' : `₹${tier.priceInr}`}
                  </span>
                  <span className="text-gray-600 ml-2">{tier.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {tier.sessions} focus sessions {tier.period}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isLoading}
                  className={
                    tier.popular
                      ? 'w-full bg-purple-600 hover:bg-purple-700'
                      : 'w-full'
                  }
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {isLoading ? 'Processing...' : tier.price === 0 ? 'Get Started' : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
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
