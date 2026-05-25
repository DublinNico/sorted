const _projectId   = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID;
const _publicAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!_projectId)    throw new Error("Missing env var: EXPO_PUBLIC_SUPABASE_PROJECT_ID");
if (!_publicAnonKey) throw new Error("Missing env var: EXPO_PUBLIC_SUPABASE_ANON_KEY");

export const projectId   = _projectId;
export const publicAnonKey = _publicAnonKey;
