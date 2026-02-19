export interface LoginResponse {
  access: string
  refresh: string
}


export interface Role {
  id: string
  code: string
  label: string
  created_at: string
}

export interface Agent {
  id: string
  matricule: string
  first_name: string
  last_name: string
  username: string
  email: string
  is_active: boolean
  created_at: string
  role?: Role
}

export interface Form {
  id: string
  title: string
  period: string
  is_active: boolean 
  created_by: string
  created_at: string
  updated_at: string
  questions : FormQuestion[]
}


export interface QuestionCategory {
  id: string
  code: string
  label: string
  created_at: string
}


export interface Question {
  id: string
  label: string
  description: string | null
  weight: number
  is_active: boolean
  category: QuestionCategory | null
  created_at: string
}

export interface FormQuestion {
  id: string
  question: Question
  position: number
}

export interface Evaluation {
  id: string
  form: Form
  evaluator: Agent
  evaluated: Agent
  submitted_at: string | null
}

export interface Answer {
  id: string
  evaluation: Evaluation
  question: Question
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
  form: Form
  total_agents: number
  total_expected_evaluations: number
  total_submitted_evaluations: number
  completion_rate: number
}

export interface AdminCampaignAgentStats {
  form: Form
  agent: Agent
  evaluations_received: number
  evaluations_done: number
  global_score: number
}


export type DashboardSummary = {
  total_assigned: number;
  total_completed: number;
  total_pending: number;
  total_given: number;
  total_to_given: number;
  weighted_score: number;
  completion_rate : number;
};


// ////////////////////////////////////////////////////////////////////////////////////

export type EvaluationNotee = {
  evaluation: Evaluation;
  completion_pct: number | null;
  weighted_avg_score: number | null;
};
