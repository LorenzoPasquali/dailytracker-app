// Global search helpers — isolated so the matching logic can be swapped to a
// backend source later without touching the UI.

// Lowercase + strip diacritics → case- and accent-insensitive matching.
export const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

// Map projectId → project for O(1) lookups while matching tasks.
export const buildProjectIndex = (projects = []) => {
  const index = new Map();
  projects.forEach((project) => index.set(project.id, project));
  return index;
};

// A task matches when the normalized query is contained in any of its
// searchable fields: title, project name, task type name, or assignee name.
export const taskMatches = (task, normalizedQuery, projectIndex) => {
  if (!normalizedQuery) return true;
  const project = task.projectId != null ? projectIndex.get(task.projectId) : null;
  const taskType =
    project && task.taskTypeId != null
      ? (project.taskTypes || []).find((tt) => tt.id === task.taskTypeId)
      : null;

  const fields = [task.title, project?.name, taskType?.name, task.assigneeName];
  return fields.some((field) => field && normalizeText(field).includes(normalizedQuery));
};

// A project matches when the normalized query is contained in its name.
export const projectMatches = (project, normalizedQuery) =>
  !!normalizedQuery && normalizeText(project.name).includes(normalizedQuery);
