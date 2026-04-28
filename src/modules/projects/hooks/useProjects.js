import { useProjectsContext } from '../context/ProjectsContext';

/**
 * Public hook for consuming the shared projects state.
 * Components stay decoupled from the context implementation.
 */
export function useProjects() {
  return useProjectsContext();
}
