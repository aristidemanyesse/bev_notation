export type Role = "ADMIN" | "AGENT"

export interface RoleEntity {
  id: string
  code: Role
  label: string
  created_at: string
}

export interface Agent {
  id: string
  matricule: string
  first_name: string
  last_name: string
  username: string
  role_id: string
  is_active: boolean
  created_at: string
  role?: {
    code: Role
    label: string
  }
}

export interface Form {
  id: string
  title: string
  period: string
  is_active: boolean
  created_by: string
  created_at: string
}

export interface Question {
  id: string
  label: string
  description: string | null
  weight: number
  is_active: boolean
  category_id: string
  created_at: string
}

export interface QuestionCategory {
  id: string
  code: string
  label: string
  created_at: string
}

export interface Evaluation {
  id: string
  form_id: string
  evaluator_id: string
  evaluated_id: string
  submitted_at: string | null
}

export interface Answer {
  id: string
  evaluation_id: string
  question_id: string
  score: number
  comment: string | null
}

export interface AgentDashboardSummary {
  agent_id: string
  form_id: string
  evaluations_received: number
  evaluations_done: number
  global_score: number
  total_reviews: number
}

export interface AgentCategoryScore {
  agent_id: string
  form_id: string
  category_id: string
  category_code: string
  category_label: string
  avg_score: number
  total_answers: number
}

export interface AdminCampaignStats {
  form_id: string
  title: string
  period: string
  total_agents: number
  total_expected_evaluations: number
  total_submitted_evaluations: number
  completion_rate: number
}

export interface AdminCampaignAgentStats {
  form_id: string
  period: string
  agent_id: string
  matricule: string
  first_name: string
  last_name: string
  evaluations_received: number
  evaluations_done: number
  global_score: number
}
