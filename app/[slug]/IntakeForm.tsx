'use client'

import { useState } from 'react'
import type { PageConfig } from './page'

export default function IntakeForm({ page }: { page: PageConfig }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string) || ''

    const payload = {
      slug: page.slug,
      name,
      email: fd.get('email'),
      whatsapp: fd.get('whatsapp'),
      company: fd.get('company'),
      websites: fd.get('websites'),
      business_description: fd.get('business_description'),
      markets: fd.getAll('markets'),
      other_markets: fd.get('other_markets'),
      arrival: fd.get('arrival'),
      departure: fd.get('departure'),
      bali_before: fd.get('bali_before'),
      visa: fd.get('visa'),
      connections: fd.getAll('connections'),
      ideal_connection: fd.get('ideal_connection'),
      existing_contacts: fd.get('existing_contacts'),
      dream_intro: fd.get('dream_intro'),
      services: fd.get('services'),
      seeking_investment: fd.get('seeking_investment'),
      investment_details: fd.get('investment_details'),
      client_value: fd.get('client_value'),
      support: fd.getAll('support'),
      challenge: fd.get('challenge'),
      meetings_goal: fd.get('meetings_goal'),
      indonesia_goals: fd.get('indonesia_goals'),
      return_trip: fd.get('return_trip'),
      speaking: fd.get('speaking'),
      anything_else: fd.get('anything_else'),
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Submission failed')
      }

      setSubmittedName(name.split(' ')[0])
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError('Something went wrong. Please try again or contact us directly.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const thankYou =
    page.thank_you_message ||
    `Marina has your brief and will be in touch within 24 hours with a tailored plan for your Bali visit${page.event_month ? ` in ${page.event_month}` : ''}.`

  if (submitted) {
    return (
      <>
        <div className="hero">
          <p className="hero-eyebrow">{page.hero_eyebrow}</p>
          <h1>
            {page.hero_title}
            <br />
            <em>{page.hero_title_em}</em>
          </h1>
        </div>
        <div className="container">
          <div className="thankyou">
            <div className="gold-line" />
            <h2>Thank you{submittedName ? `, ${submittedName}` : ''}.</h2>
            <p>{thankYou}</p>
            <div className="gold-line" />
          </div>
        </div>
        <div className="footer">
          <strong>Ascend Global</strong> &nbsp;·&nbsp; Marina &nbsp;·&nbsp; Bali
        </div>
      </>
    )
  }

  return (
    <>
      <div className="hero">
        <p className="hero-eyebrow">{page.hero_eyebrow}</p>
        <h1>
          {page.hero_title}
          <br />
          <em>{page.hero_title_em}</em>
        </h1>
        <div className="gold-line" />
        <p className="hero-sub">{page.hero_subtitle}</p>
      </div>

      <div className="container">
        <p className="intro-text">&ldquo;{page.intro_quote}&rdquo;</p>

        <form onSubmit={handleSubmit}>

          {/* 01 — About You */}
          <div className="section">
            <div className="section-header">
              <span className="section-num">01</span>
              <span className="section-title">About you &amp; your business</span>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Full name</label>
                <input type="text" name="name" placeholder="Your name" required />
              </div>
              <div className="field">
                <label>WhatsApp number</label>
                <input type="text" name="whatsapp" placeholder="+65..." />
              </div>
            </div>
            <div className="field">
              <label>Email address</label>
              <input type="email" name="email" placeholder="your@email.com" />
            </div>
            <div className="field">
              <label>Company name</label>
              <input type="text" name="company" placeholder="e.g. SMC Solutions" />
            </div>
            <div className="field">
              <label>
                Your website(s)
                <span className="hint">Share all relevant links including regional sites</span>
              </label>
              <textarea name="websites" placeholder="e.g. smcse.com, smcseconsulting.com" />
            </div>
            <div className="field">
              <label>
                Describe what your business does and who it serves
                <span className="hint">Be specific — this is how Marina introduces you to the right people</span>
              </label>
              <textarea name="business_description" placeholder="e.g. We provide digital transformation solutions including web development, IT consultancy, technical marketing and data modelling for businesses globally..." />
            </div>
            <div className="field">
              <label>Where are you currently operating? Select all that apply.</label>
              <div className="choices">
                {[
                  { value: 'usa', label: 'United States' },
                  { value: 'singapore', label: 'Singapore' },
                  { value: 'pakistan', label: 'Pakistan' },
                  { value: 'indonesia', label: 'Indonesia (expanding)' },
                  { value: 'other', label: 'Other markets — I will list below' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="checkbox" name="markets" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Any other markets? List them here <em>(optional)</em></label>
              <input type="text" name="other_markets" placeholder="e.g. UAE, Australia, UK..." />
            </div>
          </div>

          {/* 02 — Your Bali Visit */}
          <div className="section">
            <div className="section-header">
              <span className="section-num">02</span>
              <span className="section-title">Your Bali visit</span>
            </div>
            <div className="info-box">
              <strong>New to Bali&apos;s business scene?</strong> Ascend Global gives you direct access to the founder, investor and entrepreneur communities that most visitors never find — even after multiple trips.
            </div>
            <div className="field-row">
              <div className="field">
                <label>Arriving in Bali</label>
                <input type="text" name="arrival" placeholder="e.g. May 12, 2026" />
              </div>
              <div className="field">
                <label>Leaving Bali</label>
                <input type="text" name="departure" placeholder="e.g. May 18, 2026" />
              </div>
            </div>
            <div className="field">
              <label>Have you visited Bali before?</label>
              <div className="choices">
                {[
                  { value: 'yes', label: 'Yes, I know Bali well' },
                  { value: 'few', label: "A couple of times but I don't know the business scene" },
                  { value: 'no', label: 'First time — I need guidance on everything' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="radio" name="bali_before" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>
                Do you have a valid visa for conducting business in Indonesia?
                <span className="hint">Running meetings, investor conversations or business activities requires the right visa. Marina can advise.</span>
              </label>
              <div className="choices">
                {[
                  { value: 'yes', label: 'Yes, I have the right visa sorted' },
                  { value: 'tourist', label: "Coming on a tourist visa — not sure if that covers business activities" },
                  { value: 'no', label: 'No — I need advice on this' },
                  { value: 'unsure', label: 'Not sure — would appreciate guidance' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="radio" name="visa" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 03 — Who You Want to Meet */}
          <div className="section">
            <div className="section-header">
              <span className="section-num">03</span>
              <span className="section-title">Who you want to meet</span>
            </div>
            <div className="field">
              <label>What type of connections are you looking for in Bali? Select all that apply.</label>
              <div className="choices">
                {[
                  { value: 'investors', label: 'Investors — angel, VC or real estate investors open to tech opportunities' },
                  { value: 'clients', label: 'Clients — businesses that need digital transformation services' },
                  { value: 'partners', label: 'Strategic partners and collaborators' },
                  { value: 'distributors', label: 'Local distributors or resellers for our products' },
                  { value: 'founders', label: 'Founders and entrepreneurs to exchange ideas with' },
                  { value: 'government', label: 'Government or regulatory contacts for Indonesia market entry' },
                  { value: 'tech', label: 'Tech and AI community in Bali' },
                  { value: 'expats', label: 'Expat business community in Bali' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="checkbox" name="connections" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>
                Describe your ideal connection or introduction in Bali
                <span className="hint">Industry, business size, decision-making level — the more specific, the better Marina can curate for you</span>
              </label>
              <textarea name="ideal_connection" placeholder="e.g. CEOs or CTOs of mid-size businesses in hospitality, retail or logistics who are looking to modernise their digital infrastructure..." />
            </div>
            <div className="field">
              <label>Do you have any existing contacts in Bali you would like us to help you reconnect with or build on?</label>
              <textarea name="existing_contacts" placeholder="Optional — names, companies or industries" />
            </div>
            <div className="field">
              <label>What is one introduction that would make this entire trip worthwhile?</label>
              <input type="text" name="dream_intro" placeholder="e.g. A Series A investor who understands SaaS, or a hotel group looking for a tech partner..." />
            </div>
          </div>

          {/* 04 — Your Offer & Products */}
          <div className="section">
            <div className="section-header">
              <span className="section-num">04</span>
              <span className="section-title">Your offer &amp; products</span>
            </div>
            <div className="field">
              <label>
                What are your core services or products?
                <span className="hint">List them so Marina knows exactly what to position when making introductions</span>
              </label>
              <textarea name="services" placeholder="e.g. Web development, store development, IT consultancy, technical marketing, data modelling, hosting platform..." />
            </div>
            <div className="field">
              <label>Do you have a product or platform you are actively seeking investment for?</label>
              <div className="choices">
                {[
                  { value: 'yes', label: 'Yes — I will describe it below' },
                  { value: 'no', label: 'No, not at this stage' },
                  { value: 'maybe', label: 'Open to conversations if the right investor comes along' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="radio" name="seeking_investment" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>
                If yes, describe the product and what you are looking for from investors
                <span className="hint">Stage, amount, what the investment will be used for</span>
              </label>
              <textarea name="investment_details" placeholder="e.g. Our hosting platform is at pre-seed stage. We are looking for USD $500K to accelerate product development and sales..." />
            </div>
            <div className="field">
              <label>
                What is one client or partnership worth to your business?
                <span className="hint">This helps Marina understand the ROI of connecting you with the right people</span>
              </label>
              <input type="text" name="client_value" placeholder="e.g. A single enterprise client is worth $50K per year in retainer..." />
            </div>
          </div>

          {/* 05 — Support You Need */}
          <div className="section">
            <div className="section-header">
              <span className="section-num">05</span>
              <span className="section-title">How Ascend Global can help</span>
            </div>
            <div className="field">
              <label>What support do you need during your Bali visit? Select all that apply.</label>
              <div className="choices">
                {[
                  { value: 'introductions', label: "Curated investor and partner introductions from Marina's network" },
                  { value: 'dinner', label: 'Private dinner or event to meet multiple connections in one room' },
                  { value: 'community', label: "Access to Bali's founder and entrepreneur communities" },
                  { value: 'promo', label: 'Promotion of your business across Bali entrepreneur networks' },
                  { value: 'market_entry', label: 'Indonesia market entry guidance and local business connections' },
                  { value: 'venue', label: 'Venue and restaurant recommendations for client meetings' },
                  { value: 'visa', label: 'Visa and legal guidance for business activities in Indonesia' },
                  { value: 'accommodation', label: 'Accommodation recommendations' },
                  { value: 'concierge', label: 'Full concierge support — I want someone on the ground handling logistics' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="checkbox" name="support" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>What is the biggest challenge you are facing in making this Bali visit productive?</label>
              <textarea name="challenge" placeholder="e.g. I don't know the right people, I have a short window of time, I am not sure which communities to tap into..." />
            </div>
            <div className="field">
              <label>How many meetings or introductions would make this trip a success?</label>
              <div className="choices">
                {[
                  { value: '1-3', label: '1 to 3 high quality meetings' },
                  { value: '5-10', label: '5 to 10 targeted introductions' },
                  { value: 'event', label: 'One well-curated event where I meet multiple people at once' },
                  { value: 'all', label: 'As many as possible — I want to maximise every day' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="radio" name="meetings_goal" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 06 — Goals & Vision */}
          <div className="section">
            <div className="section-header">
              <span className="section-num">06</span>
              <span className="section-title">Your goals in Indonesia</span>
            </div>
            <div className="field">
              <label>What does success in the Indonesian market look like for you in the next 12 months?</label>
              <textarea name="indonesia_goals" placeholder="e.g. 3 to 5 enterprise clients in hospitality or retail, a local partner who can help us sell and deliver, one investor for our platform..." />
            </div>
            <div className="field">
              <label>Are you planning to return to Bali or Indonesia after this visit?</label>
              <div className="choices">
                {[
                  { value: 'yes', label: 'Yes — I plan to come back regularly' },
                  { value: 'maybe', label: 'Possibly — depends on how this visit goes' },
                  { value: 'no', label: 'This is a one-off exploratory visit for now' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="radio" name="return_trip" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Would you be interested in being featured or speaking at a Bali founder event to raise your profile in this market?</label>
              <div className="choices">
                {[
                  { value: 'yes', label: 'Yes — I would love that' },
                  { value: 'maybe', label: 'Open to it if the audience is right' },
                  { value: 'no', label: 'No — I prefer to keep a lower profile' },
                ].map(({ value, label }) => (
                  <label key={value} className="choice">
                    <input type="radio" name="speaking" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Anything else you want Marina to know before she starts building your Bali plan?</label>
              <textarea name="anything_else" placeholder="Open space — share freely..." />
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="submit-wrap">
            <p className="submit-note">
              &ldquo;The right room in Bali<br />can open an entire market.&rdquo;
            </p>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit my brief →'}
            </button>
          </div>
        </form>
      </div>

      <div className="footer">
        <strong>Ascend Global</strong> &nbsp;·&nbsp; Marina &nbsp;·&nbsp; Bali
      </div>
    </>
  )
}
