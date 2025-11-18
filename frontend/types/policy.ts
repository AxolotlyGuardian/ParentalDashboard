export interface Policy {
  policy_id: number;
  title_id: number;
  title: string;
  poster_path?: string;
  is_allowed: boolean;
  providers?: string[];
  deep_links?: Record<string, string>;
}
