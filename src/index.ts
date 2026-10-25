export const PROJECT = 'agent-chat';

export interface ProjectInfo {
  readonly name: string;
  readonly status: 'scaffold';
}

// Scaffold entry point: the first product change replaces it with the
// service composition root.
export function projectInfo(): ProjectInfo {
  return { name: PROJECT, status: 'scaffold' };
}
