export interface BlueprintNode {
  id: string;
  name: string;
  type: 'subject' | 'topic' | 'subTopic';
  value: string; // The actual string to filter on
  allocationType: 'percentage' | 'count';
  allocationValue: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'All';
  children: BlueprintNode[];
}

export interface ExamBlueprint {
  id?: string;
  user_id?: string;
  name: string;
  totalQuestions: number;
  nodes: BlueprintNode[];
  created_at?: string;
  updated_at?: string;
}
