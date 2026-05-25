export type EventType =
  | 'contract'
  | 'judicial'
  | 'political'
  | 'police_operation'
  | 'investigation'
  | 'scandal'
  | 'trial'
  | 'corruption'
  | 'context'
  | 'money_transfer'

export type EntityStatus =
  | 'investigated'
  | 'accused'
  | 'convicted'
  | 'acquitted'
  | 'witness'
  | 'judge'
  | 'prosecutor'
  | 'lawyer'
  | 'unknown'

export type RelationType =
  | 'coordinates'
  | 'employs'
  | 'controls'
  | 'influences'
  | 'pays'
  | 'transfers'
  | 'awards_contract'
  | 'investigates'
  | 'imputes'
  | 'processes'
  | 'advises'
  | 'produces_documents'

export type SourceType =
  | 'judicial_order'
  | 'police_report'
  | 'press'
  | 'fact_check'
  | 'reference'
  | 'official'

export interface EventExcerpt {
  source: string
  page?: number
  text: string
}

export interface Event {
  id: string
  date: string
  date_precision: 'day' | 'month' | 'year'
  title: string
  description: string
  cases: string[]
  type: EventType
  impact: 1 | 2 | 3 | 4 | 5
  entities: string[]
  relations: string[]
  sources: string[]
  excerpts?: EventExcerpt[]
  verified: boolean | 'partial'
  pending?: boolean
  notes?: string
}

export interface Entity {
  id: string
  type: 'person' | 'company' | 'institution' | 'account'
  name: string
  aliases: string[]
  role: string
  cases: string[]
  status?: EntityStatus
  tags: string[]
  notes?: string
  registration?: string
  jurisdiction?: string
  photo?: string
  wikipedia?: string
}

export interface Relation {
  id: string
  from: string
  to: string
  type: RelationType
  label: string
  description: string
  cases: string[]
  sources: string[]
  verified: boolean | 'partial'
  amount?: { value: number; currency: string; approximate: boolean }
  period?: { from: string; to: string | null }
}

export interface Source {
  id: string
  type: SourceType
  subtype?: string
  title: string
  publisher?: string
  issuer?: string
  author?: string
  date: string
  cases: string[]
  availability: 'public' | 'partial' | 'restricted'
  availability_note?: string
  url?: string
  notes?: string
  pages?: number
}

export interface Case {
  id: string
  name: string
  court: string
  judge: string
  investigators: string[]
  status: string
  opened: string
  color: string
  charges: string[]
}
