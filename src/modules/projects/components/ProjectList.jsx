import ProjectCard from './ProjectCard';

/**
 * Props:
 *   projects  — array of project objects
 *   onSelect  — (project) navigate to project detail
 *   onEdit    — (project) open edit modal
 *   onDelete  — (projectId) delete project
 */
export default function ProjectList({ projects = [], onSelect, onEdit, onDelete }) {
  if (projects.length === 0) {
    return (
      <div style={{
        padding:         '48px 24px',
        textAlign:       'center',
        color:           '#98a2b3',
        fontSize:        '14px',
        border:          '1px dashed #eaecf0',
        borderRadius:    '12px',
        backgroundColor: '#fff',
      }}>
        No hay proyectos disponibles.
      </div>
    );
  }

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap:                 '16px',
    }}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
