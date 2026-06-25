import { redirect } from 'next/navigation'

export default function ComboPage() {
  redirect('/interactions?tab=matrix')
}
