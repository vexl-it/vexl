'use client'

import {EventEditor} from '@/src/components/cms/EventEditor'
import {useParams} from 'next/navigation'

export default function EditEventPage() {
  const {id} = useParams<{id: string}>()
  return <EventEditor id={id} />
}
