import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseClient } from '@/lib/supabase'
import IntakeForm from './IntakeForm'

export interface PageConfig {
  slug: string
  active: boolean
  partner_name: string
  hero_eyebrow: string
  hero_title: string
  hero_title_em: string
  hero_subtitle: string
  intro_quote: string
  event_month: string | null
  thank_you_message: string | null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: `Your Bali Visit — Ascend Global` }
}

export default async function PartnerPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseClient()

  const { data: page } = await supabase
    .from('pages')
    .select('slug, active, partner_name, hero_eyebrow, hero_title, hero_title_em, hero_subtitle, intro_quote, event_month, thank_you_message')
    .eq('slug', params.slug)
    .eq('active', true)
    .single()

  if (!page) notFound()

  return <IntakeForm page={page as PageConfig} />
}
