import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, rectIntersection, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import api from '../services/api';

import { useMediaQuery } from '../hooks/useMediaQuery';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ProjectsModal from '../components/ProjectsModal';
import TaskTypesModal from '../components/TaskTypesModal';

import { Spinner, Offcanvas, Button } from 'react-bootstrap';
import { Calendar } from 'react-bootstrap-icons';
import DateFilterModal from '../components/DateFilterModal';
import AiChatModal from '../components/AiChatModal';
import { isWithinInterval, startOfDay, endOfDay, isSameDay, parseISO, format } from 'date-fns';

export default function DashboardPage() {
  const [taskColumns, setTaskColumns] = useState({ PLANNED: [], DOING: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [activeTask, setActiveTask] = useState(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTaskFormModal, setShowTaskFormModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showTaskTypesModal, setShowTaskTypesModal] = useState(false);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [showAiChat, setShowAiChat] = useState(false);

  const isMobile = useMediaQuery('(max-width: 992px)');
  const navigate = useNavigate();
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const allTasks = useMemo(() => Object.values(taskColumns).flat(), [taskColumns]);

  useEffect(() => {
    const savedDateRange = localStorage.getItem('dashboardDateRange');
    if (savedDateRange) {
      const parsed = JSON.parse(savedDateRange);
      setDateRange([parsed[0] ? new Date(parsed[0]) : null, parsed[1] ? new Date(parsed[1]) : null]);
    }
  }, []);

  const handleDateFilterApply = (range) => {
    setDateRange(range);
    localStorage.setItem('dashboardDateRange', JSON.stringify(range));
  };

  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    if (selectedProjectIds.length > 0) {
      tasks = tasks.filter(task => selectedProjectIds.includes(task.projectId));
    }

    if (dateRange[0]) {
      tasks = tasks.filter(task => {
        const taskDate = parseISO(task.createdAt);
        if (dateRange[1]) {
          return isWithinInterval(taskDate, {
            start: startOfDay(dateRange[0]),
            end: endOfDay(dateRange[1])
          });
        } else {
          return isSameDay(taskDate, dateRange[0]);
        }
      });
    }

    return tasks;
  }, [allTasks, selectedProjectIds, dateRange]);

  const handleLogout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('refreshToken'); navigate('/'); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userResponse, tasksResponse, projectsResponse] = await Promise.all([
        api.get('/api/user/me'),
        api.get('/api/tasks'),
        api.get('/api/projects'),
      ]);
      setCurrentUser(userResponse.data);
      const newColumns = { PLANNED: [], DOING: [], DONE: [] };
      tasksResponse.data.forEach(task => {
        if (newColumns[task.status]) newColumns[task.status].push(task);
      });
      setTaskColumns(newColumns);
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key !== 'Enter') return;
      if (showTaskFormModal || showDeleteModal || showProjectsModal || showTaskTypesModal || showLogoutConfirm || showAiChat) return;
      const activeElement = document.activeElement;
      const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
      if (isTyping) return;
      handleOpenCreateModal();
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => { document.removeEventListener('keydown', handleKeyPress); };
  }, [showTaskFormModal, showDeleteModal, showProjectsModal, showTaskTypesModal, showLogoutConfirm, showAiChat]);

  const handleOpenCreateModal = () => { setTaskToEdit(null); setShowTaskFormModal(true); };
  const handleOpenEditModal = (task) => { setTaskToEdit(task); setShowTaskFormModal(true); };
  const handleCloseTaskFormModal = () => { setTaskToEdit(null); setShowTaskFormModal(false); };
  const handleTaskCreated = (newTask) => { setTaskColumns(prev => ({ ...prev, [newTask.status]: [newTask, ...prev[newTask.status]] })); };
  const handleTaskUpdated = (updatedTask) => {
    setTaskColumns(prev => {
      const newColumns = { ...prev };
      Object.keys(newColumns).forEach(status => { newColumns[status] = newColumns[status].filter(t => t.id !== updatedTask.id); });
      if (newColumns[updatedTask.status]) newColumns[updatedTask.status].unshift(updatedTask);
      return newColumns;
    });
  };
  const handleOpenDeleteModal = (taskId) => { setTaskToDelete(taskId); setShowDeleteModal(true); };
  const handleCloseDeleteModal = () => { setTaskToDelete(null); setShowDeleteModal(false); };
  const handleDeleteFromModal = (taskId) => { handleCloseTaskFormModal(); setTimeout(() => handleOpenDeleteModal(taskId), 250); };
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/api/tasks/${taskToDelete}`);
      setTaskColumns(prev => {
        const newColumns = { ...prev };
        Object.keys(newColumns).forEach(status => { newColumns[status] = newColumns[status].filter(t => t.id !== taskToDelete); });
        return newColumns;
      });
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      toast.error('Não foi possível deletar a tarefa.');
    }
  };
  const findContainer = (taskId) => {
    if (!taskId) return null;
    for (const status in taskColumns) { if (taskColumns[status].some(task => task.id === taskId)) return status; }
    return null;
  };
  const handleDragStart = (event) => { const { active } = event; const task = allTasks.find(t => t.id === active.id); setActiveTask(task); };
  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sourceContainer = findContainer(active.id);
    const destContainer = findContainer(over.id) || over.id;
    if (!sourceContainer || !destContainer || !taskColumns[sourceContainer] || !taskColumns[destContainer]) return;
    if (sourceContainer === destContainer) {
      setTaskColumns(prev => {
        const columnTasks = prev[sourceContainer];
        const oldIndex = columnTasks.findIndex(t => t.id === active.id);
        const newIndex = columnTasks.findIndex(t => t.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return { ...prev, [sourceContainer]: arrayMove(columnTasks, oldIndex, newIndex) };
      });
    } else {
      let movedTask;
      const sourceTasks = [...taskColumns[sourceContainer]];
      const activeIndex = sourceTasks.findIndex(t => t.id === active.id);
      if (activeIndex > -1) { [movedTask] = sourceTasks.splice(activeIndex, 1); } else return;
      const updatedTask = { ...movedTask, status: destContainer };
      api.put(`/api/tasks/${active.id}`, { status: destContainer })
        .then(() => toast.success('Tarefa movida!'))
        .catch(() => { fetchData(); toast.error('Não foi possível mover a tarefa.'); });
      setTaskColumns(prev => {
        const destTasks = [...prev[destContainer]];
        const overIndex = destTasks.findIndex(t => t.id === over.id);
        if (overIndex !== -1) { destTasks.splice(overIndex, 0, updatedTask); } else { destTasks.push(updatedTask); }
        return { ...prev, [sourceContainer]: sourceTasks, [destContainer]: destTasks };
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleProjectToggle = (projectId) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const renderDashboardContent = () => {
    const filteredPlanned = filteredTasks.filter(t => t.status === 'PLANNED');
    const filteredDoing = filteredTasks.filter(t => t.status === 'DOING');
    const filteredDone = filteredTasks.filter(t => t.status === 'DONE');

    if (loading) {
      return <div className="w-100 text-center mt-5"><Spinner animation="border" style={{ color: 'var(--accent)' }} /></div>;
    }
    if (isMobile) {
      return (
        <div className="d-flex flex-column gap-3 h-100">
          <KanbanColumn title="Planejado" status="PLANNED" tasks={filteredPlanned} projects={projects} onEdit={handleOpenEditModal} isMobile />
          <KanbanColumn title="Em progresso" status="DOING" tasks={filteredDoing} projects={projects} onEdit={handleOpenEditModal} isMobile />
          <KanbanColumn title="Feito" status="DONE" tasks={filteredDone} projects={projects} onEdit={handleOpenEditModal} isMobile />
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', height: '100%' }}>
        <KanbanColumn title="Planejado" status="PLANNED" tasks={filteredPlanned} projects={projects} onEdit={handleOpenEditModal} />
        <KanbanColumn title="Em progresso" status="DOING" tasks={filteredDoing} projects={projects} onEdit={handleOpenEditModal} />
        <KanbanColumn title="Feito" status="DONE" tasks={filteredDone} projects={projects} onEdit={handleOpenEditModal} />
      </div>
    );
  };

  const isDateFilterActive = dateRange[0] !== null;

  return (
    <div className="vh-100 vw-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
      <AppHeader
        isMobile={isMobile}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onToggleMobileSidebar={() => setShowMobileSidebar(true)}
        onNewTaskClick={handleOpenCreateModal}
        currentUser={currentUser}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />
      <div className="d-flex flex-grow-1" style={{ overflow: 'hidden', minHeight: 0 }}>
        {!isMobile && (
          <Sidebar
            isMobile={isMobile}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onProjectsClick={() => setShowProjectsModal(true)}
            onTaskTypesClick={() => setShowTaskTypesModal(true)}
            onAiClick={() => setShowAiChat(true)}
          />
        )}
        <main className="flex-grow-1 d-flex flex-column" style={{
          overflow: isMobile ? 'auto' : 'hidden',
          padding: isMobile ? '0.75rem' : '1.25rem'
        }}>
          <header style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: '0.5rem',
            marginBottom: isMobile ? '1rem' : '0.75rem',
            flexShrink: 0
          }}>
            <h1 className="d-none d-lg-block" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.3px'
            }}>
              Monitor de Tarefas
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              width: isMobile ? '100%' : 'auto',
              overflowX: 'auto',
              paddingBottom: '2px'
            }}>
              {projects.map(project => {
                const isSelected = selectedProjectIds.includes(project.id);
                const anyFilterActive = selectedProjectIds.length > 0;

                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectToggle(project.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: isMobile ? '0.25rem 0.7rem' : '0.35rem 0.95rem',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: 500,
                      color: anyFilterActive && !isSelected ? 'var(--text-muted)' : 'var(--text-secondary)',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: anyFilterActive && !isSelected ? 0.5 : 1,
                      transition: 'all var(--transition)',
                      textDecoration: anyFilterActive && !isSelected ? 'line-through' : 'none',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: project.color,
                      flexShrink: 0
                    }} />
                    {project.name}
                  </button>
                );
              })}

              {(selectedProjectIds.length > 0 || dateRange[0]) && (
                <button
                  onClick={() => { setSelectedProjectIds([]); setDateRange([null, null]); localStorage.removeItem("dashboardDateRange"); }}
                  style={{
                    padding: isMobile ? "0.25rem 0.6rem" : "0.35rem 0.75rem",
                    fontSize: isMobile ? "0.8rem" : "0.85rem",
                    fontWeight: 600,
                    color: "var(--danger)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--danger)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    outline: "none",
                    fontFamily: "inherit",
                    marginLeft: "0.5rem"
                  }}
                >
                  Limpar Filtros
                </button>
              )}

              <button
                onClick={() => setShowDateFilterModal(true)}
                title="Filtrar por data"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: isMobile ? '0.25rem 0.6rem' : '0.35rem 0.75rem',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: 500,
                  color: isDateFilterActive ? 'var(--accent)' : 'var(--text-muted)',
                  backgroundColor: isDateFilterActive ? 'var(--accent-subtle)' : 'transparent',
                  border: `1px solid ${isDateFilterActive ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              >
                <Calendar size={isMobile ? 12 : 14} />
                {dateRange[0] && (
                  <span>
                    {dateRange[1]
                      ? `${format(dateRange[0], 'dd/MM')} - ${format(dateRange[1], 'dd/MM')}`
                      : format(dateRange[0], 'dd/MM/yyyy')
                    }
                  </span>
                )}
              </button>
              {(selectedProjectIds.length > 0 || dateRange[0]) && (
                <button
                  onClick={() => { setSelectedProjectIds([]); setDateRange([null, null]); localStorage.removeItem("dashboardDateRange"); }}
                  style={{
                    padding: isMobile ? "0.25rem 0.6rem" : "0.35rem 0.75rem",
                    fontSize: isMobile ? "0.8rem" : "0.85rem",
                    fontWeight: 600,
                    color: "var(--danger)",
                    backgroundColor: "transparent",
                    border: "1px solid var(--danger)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    outline: "none",
                    fontFamily: "inherit",
                    marginLeft: "0.5rem"
                  }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </header>

          <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ flex: 1, minHeight: 0 }}>
              {renderDashboardContent()}
            </div>
            <DragOverlay>{activeTask ? <TaskCard task={activeTask} projects={projects} onEdit={() => { }} /> : null}</DragOverlay>
          </DndContext>
        </main>
      </div>

      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '240px' }}
      >
        <Offcanvas.Header closeButton closeVariant="white" />
        <Offcanvas.Body className="p-0">
          <Sidebar
            isMobile={isMobile}
            isCollapsed={false}
            onToggleCollapse={() => setShowMobileSidebar(false)}
            onProjectsClick={() => { setShowProjectsModal(true); setShowMobileSidebar(false); }}
            onTaskTypesClick={() => { setShowTaskTypesModal(true); setShowMobileSidebar(false); }}
            onAiClick={() => { setShowAiChat(true); setShowMobileSidebar(false); }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <TaskFormModal show={showTaskFormModal} handleClose={handleCloseTaskFormModal} onTaskCreated={handleTaskCreated} onTaskUpdated={handleTaskUpdated} taskToEdit={taskToEdit} onDelete={handleDeleteFromModal} />
      <ConfirmationModal
        show={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleConfirm={handleConfirmDelete}
        title="Confirmar Exclusao"
        body="Voce tem certeza que deseja excluir esta tarefa? Esta acao nao pode ser desfeita."
        confirmButtonText="Confirmar Exclusao"
      />
      <ConfirmationModal
        show={showLogoutConfirm}
        handleClose={() => setShowLogoutConfirm(false)}
        handleConfirm={handleLogout}
        title="Confirmar Saida"
        body="Voce tem certeza que deseja sair da sua conta?"
        confirmButtonText="Sair"
        confirmButtonVariant="primary"
      />
      <ProjectsModal show={showProjectsModal} handleClose={() => setShowProjectsModal(false)} onProjectsChange={fetchData} />
      <TaskTypesModal show={showTaskTypesModal} handleClose={() => setShowTaskTypesModal(false)} onTaskTypesChange={fetchData} />
      <DateFilterModal
        show={showDateFilterModal}
        handleClose={() => setShowDateFilterModal(false)}
        onApplyFilter={handleDateFilterApply}
        initialDateRange={dateRange}
      />
      {showAiChat && (
        <AiChatModal
          show={showAiChat}
          onClose={() => setShowAiChat(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
