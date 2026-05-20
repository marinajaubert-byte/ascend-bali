import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseAdminClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { slug, ...formData } = body

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  // Fetch page config (validates the slug is active)
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('partner_name, notification_email, event_month')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (pageError || !page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  // Insert lead
  const { error: insertError } = await supabase.from('leads').insert({
    page_slug: slug,
    ...formData,
  })

  if (insertError) {
    console.error('Lead insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }

  // Send email notification (non-blocking — lead is already saved)
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@ascendglobal.com',
      to: page.notification_email,
      subject: `New brief — ${formData.name || 'Someone'}${formData.company ? `, ${formData.company}` : ''}`,
      html: buildEmailHtml(slug, page, formData),
    })
  } catch (emailError) {
    console.error('Resend email error:', emailError)
  }

  return NextResponse.json({ success: true })
}

function row(label: string, value: string | null | undefined) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;font-size:12px;color:#8A8480;width:150px;vertical-align:top">${label}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;font-size:14px;color:#1A1714">${value}</td>
    </tr>`
}

function block(label: string, value: string | string[] | null | undefined) {
  if (!value || (Array.isArray(value) && value.length === 0)) return ''
  const text = Array.isArray(value) ? value.join(', ') : value
  return `
    <div style="margin-bottom:18px">
      <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#B8965A;margin:0 0 5px">${label}</p>
      <p style="font-size:14px;color:#1A1714;line-height:1.6;margin:0">${text}</p>
    </div>`
}

function buildEmailHtml(
  slug: string,
  page: { partner_name: string; notification_email: string; event_month: string | null },
  d: Record<string, unknown>
): string {
  const str = (v: unknown) => (typeof v === 'string' ? v : null)
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : null)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,serif">
<div style="max-width:600px;margin:0 auto;padding:32px 24px">

  <div style="border-bottom:2px solid #B8965A;padding-bottom:16px;margin-bottom:28px">
    <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B8965A;margin:0 0 8px">Ascend Global</p>
    <h1 style="font-size:22px;font-weight:300;color:#1A1714;margin:0">New brief received</h1>
    <p style="font-size:12px;color:#8A8480;margin:6px 0 0">Link: <code style="background:#eee;padding:2px 6px;border-radius:3px;font-size:11px">/${slug}</code></p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
    ${row('Name', str(d.name))}
    ${row('Email', str(d.email) ? `<a href="mailto:${str(d.email)}" style="color:#B8965A">${str(d.email)}</a>` : null)}
    ${row('WhatsApp', str(d.whatsapp))}
    ${row('Company', str(d.company))}
    ${row('Bali visit', str(d.arrival) && str(d.departure) ? `${str(d.arrival)} → ${str(d.departure)}` : str(d.arrival) || str(d.departure))}
    ${row('Visa status', str(d.visa))}
    ${row('Been to Bali', str(d.bali_before))}
    ${row('Return plans', str(d.return_trip))}
    ${row('Meetings goal', str(d.meetings_goal))}
  </table>

  ${block('Business', str(d.business_description))}
  ${block('Looking for', arr(d.connections))}
  ${block('Ideal connection', str(d.ideal_connection))}
  ${block('Dream intro', str(d.dream_intro))}
  ${block('Services & products', str(d.services))}
  ${block('Seeking investment', str(d.seeking_investment))}
  ${block('Investment details', str(d.investment_details))}
  ${block('Support needed', arr(d.support))}
  ${block('Biggest challenge', str(d.challenge))}
  ${block('Indonesia goals', str(d.indonesia_goals))}
  ${block('Open notes', str(d.anything_else))}

  <div style="background:#fff;border:1px solid #e8d9b8;border-radius:6px;padding:14px 16px;margin-top:28px">
    <p style="font-size:12px;color:#8A8480;margin:0">
      View all leads in your
      <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/dashboard" style="color:#B8965A">Supabase dashboard</a>
      → Table Editor → leads
    </p>
  </div>

</div>
</body>
</html>`
}
