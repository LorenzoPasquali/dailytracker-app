import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DndContext, DragOverlay, rectIntersection, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import api from '../services/api';

import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTheme } from '../hooks/useTheme';
import { useTutorial } from '../hooks/useTutorial';
import { useWorkspace } from '../hooks/useWorkspace';
import { useWorkspaceSocket } from '../hooks/useWorkspaceSocket';
import TutorialOverlay from '../components/TutorialOverlay';
import AppHeader from '../components/AppHeader';
import Sidebar from '../components/Sidebar';
import KanbanColumn from '../components/KanbanColumn';
import KanbanSwimlane from '../components/KanbanSwimlane';
import ReportsView from '../components/ReportsView';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ProjectsModal from '../components/ProjectsModal';
import TaskTypesModal from '../components/TaskTypesModal';
import WorkspaceModal from '../components/WorkspaceModal';

import { Spinner, Offcanvas, Button } from 'react-bootstrap';
import Calendar from 'react-bootstrap-icons/dist/icons/calendar';
import DateFilterModal from '../components/DateFilterModal';
import AiChatModal from '../components/AiChatModal';
import { isWithinInterval, startOfDay, endOfDay, isSameDay, parseISO, format } from 'date-fns';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
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

  const [monitorView, setMonitorView] = useState(() => localStorage.getItem('monitorView') || 'classic');

  const handleMonitorViewChange = (view) => {
    setMonitorView(view);
    localStorage.setItem('monitorView', view);
  };

  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 992px)');
  const isDesktop = !isMobile;

  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspace,
    isPersonal,
    loading: workspaceLoading,
    refetchWorkspaces,
  } = useWorkspace();

  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceModalMode, setWorkspaceModalMode] = useState('create');
  const [workspaceToManage, setWorkspaceToManage] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('DOING');

  const { isActive: tutorialActive, steps: tutorialSteps, currentStep: tutorialCurrentStep, currentStepId: tutorialStepId, handleNext: tutorialNext, handleSkip: tutorialSkip } = useTutorial({
    isDesktop,
    currentUser,
    setCurrentUser,
  });
  const navigate = useNavigate();
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  // WS events from other workspace members
  const handleWsEvent = (event) => {
    const { type, payload } = event;

    if (type === 'TASK_CREATED') {
      handleTaskCreated(payload);
    } else if (type === 'TASK_UPDATED') {
      handleTaskUpdated(payload);
    } else if (type === 'TASK_DELETED') {
      setTaskColumns(prev => {
        const cols = { ...prev };
        Object.keys(cols).forEach(s => { cols[s] = cols[s].filter(t => t.id !== payload.id); });
        return cols;
      });
      toast.info('Uma tarefa foi removida.');
    } else {
      // TASK_REORDERED, PROJECT_*, MEMBER_* → full refetch
      fetchData(undefined, activeWorkspaceId);
    }
  };

  useWorkspaceSocket({
    workspaceId: activeWorkspaceId,
    isPersonal,
    onEvent: handleWsEvent,
  });

  // Workspace change handler: reset filters + refetch
  const handleWorkspaceChange = (id) => {
    setActiveWorkspace(id);
    setSelectedProjectIds([]);
    setDateRange([null, null]);
    localStorage.removeItem('dashboardDateRange');
  };
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

  const handleLanguageChange = async (lang) => {
    try {
      await api.put('/api/user/language', { language: lang }, { _silent: true });
    } catch (error) {
      console.error("Erro ao salvar idioma no perfil:", error);
    }
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

  const fetchData = async (signal, wsId) => {
    setLoading(true);
    const workspaceId = wsId ?? activeWorkspaceId;
    const wsParams = workspaceId ? { workspaceId } : {};
    try {
      const [userResponse, tasksResponse, projectsResponse] = await Promise.all([
        api.get('/api/user/me', { signal }),
        api.get('/api/tasks', { signal, params: wsParams }),
        api.get('/api/projects', { signal, params: wsParams }),
      ]);
      
      const user = userResponse.data;
      if (user && user.language && user.language !== i18n.language) {
        localStorage.setItem('language', user.language);
        i18n.changeLanguage(user.language);
      }
      
      if (user) setCurrentUser(user);
      
      const newColumns = { PLANNED: [], DOING: [], DONE: [] };
      if (tasksResponse.data && Array.isArray(tasksResponse.data)) {
        tasksResponse.data.forEach(task => {
          if (newColumns[task.status]) newColumns[task.status].push(task);
        });
      }
      setTaskColumns(newColumns);
      setProjects(projectsResponse.data || []);

      // Fetch workspace members for shared workspaces
      if (workspaceId && !isPersonal) {
        try {
          const membersResponse = await api.get(`/api/workspaces/${workspaceId}/members`, { signal });
          setWorkspaceMembers(membersResponse.data || []);
        } catch { /* ignore */ }
      } else {
        setWorkspaceMembers([]);
      }
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error("Erro ao buscar dados:", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceLoading || !activeWorkspaceId) return;
    const controller = new AbortController();
    fetchData(controller.signal, activeWorkspaceId);
    return () => controller.abort();
  }, [activeWorkspaceId, workspaceLoading]);

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

  const handleTaskCreated = (newTask) => {
    setTaskColumns(prev => {
      // Avoid duplicates if WS event arrives after local update or vice-versa
      const alreadyExists = Object.values(prev).some(col => col.some(t => t.id === newTask.id));
      if (alreadyExists) return prev;

      const status = newTask.status || 'PLANNED';
      const column = prev[status] || [];
      const goToBottom = newTask.priority === 'LOW' && status === 'PLANNED';
      const updated = goToBottom ? [...column, newTask] : [newTask, ...column];
      return { ...prev, [status]: updated };
    });
  };

  const handleTaskUpdated = (updatedTask) => {
    setTaskColumns(prev => {
      const newColumns = { ...prev };
      const status = updatedTask.status || 'PLANNED';
      
      // Find where the task currently is
      let oldStatus = null;
      for (const s in newColumns) {
        if (newColumns[s].some(t => t.id === updatedTask.id)) {
          oldStatus = s;
          break;
        }
      }

      if (oldStatus && oldStatus !== status) {
        // Move to different column
        newColumns[oldStatus] = newColumns[oldStatus].filter(t => t.id !== updatedTask.id);
        newColumns[status] = [updatedTask, ...(newColumns[status] || [])];
      } else if (oldStatus) {
        // Update in same column
        newColumns[oldStatus] = newColumns[oldStatus].map(t => t.id === updatedTask.id ? updatedTask : t);
      } else {
        // Task not found in any column? Add it (could happen if it was filtered out before)
        newColumns[status] = [updatedTask, ...(newColumns[status] || [])];
      }
      return newColumns;
    });
  };
  const handleOpenDeleteModal = (taskId) => { setTaskToDelete(taskId); setShowDeleteModal(true); };
  const handleCloseDeleteModal = () => { setTaskToDelete(null); setShowDeleteModal(false); };
  const handleDeleteFromModal = (taskId) => { handleCloseTaskFormModal(); setTimeout(() => handleOpenDeleteModal(taskId), 250); };
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/api/tasks/${taskToDelete}`, { params: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {} });
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
  // Parse compound swimlane droppable IDs like "PLANNED::project_1" → "PLANNED"
  const parseContainerId = (id) => {
    if (typeof id === 'string' && id.includes('::')) return id.split('::')[0];
    return id;
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sourceContainer = findContainer(active.id);
    const rawDest = findContainer(over.id) || over.id;
    const destContainer = parseContainerId(String(rawDest));
    if (!sourceContainer || !destContainer || !taskColumns[sourceContainer] || !taskColumns[destContainer]) return;
    if (sourceContainer === destContainer) {
      setTaskColumns(prev => {
        const columnTasks = prev[sourceContainer];
        const oldIndex = columnTasks.findIndex(t => t.id === active.id);
        const newIndex = columnTasks.findIndex(t => t.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        const payload = reordered.map((task, index) => ({ id: task.id, position: index * 10 }));
        api.put('/api/tasks/reorder', payload, { params: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {} }).catch(() => fetchData());
        return { ...prev, [sourceContainer]: reordered };
      });
    } else {
      let movedTask;
      const sourceTasks = [...taskColumns[sourceContainer]];
      const activeIndex = sourceTasks.findIndex(t => t.id === active.id);
      if (activeIndex > -1) { [movedTask] = sourceTasks.splice(activeIndex, 1); } else return;
      const updatedTask = { ...movedTask, status: destContainer };
      api.put(`/api/tasks/${active.id}`, { status: destContainer }, { params: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {} })
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

  const mobileTabDotColors = { PLANNED: 'var(--text-muted)', DOING: '#f59e0b', DONE: 'var(--accent)' };

  const swimLaneProjects = selectedProjectIds.length > 0
    ? projects.filter(p => selectedProjectIds.includes(p.id))
    : projects;

  const renderDashboardContent = () => {
    const filteredPlanned = filteredTasks.filter(t => t.status === 'PLANNED');
    const filteredDoing = filteredTasks.filter(t => t.status === 'DOING');
    const filteredDone = filteredTasks.filter(t => t.status === 'DONE');

    if (loading) {
      return <div className="w-100 text-center mt-5"><Spinner animation="border" style={{ color: 'var(--accent)' }} /></div>;
    }
    if (isMobile) {
      const mobileTabs = [
        { status: 'PLANNED', tasks: filteredPlanned, label: t('kanban.planned') },
        { status: 'DOING',   tasks: filteredDoing,   label: t('kanban.doing') },
        { status: 'DONE',    tasks: filteredDone,    label: t('kanban.done') },
      ];
      const activeTab = mobileTabs.find(tab => tab.status === activeMobileTab) || mobileTabs[0];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            padding: '0.25rem',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '0.75rem',
            flexShrink: 0,
            border: '1px solid var(--border-subtle)'
          }}>
            {mobileTabs.map(tab => {
              const isActive = activeMobileTab === tab.status;
              return (
                <button
                  key={tab.status}
                  onClick={() => setActiveMobileTab(tab.status)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    outline: 'none'
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: mobileTabDotColors[tab.status],
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.5
                  }} />
                  {tab.label}
                  <span style={{
                    fontSize: '0.7rem',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '100px',
                    fontWeight: 600,
                    minWidth: '20px',
                    textAlign: 'center',
                    lineHeight: 1.4
                  }}>
                    {tab.tasks.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active column fills remaining height */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <KanbanColumn
              key={activeTab.status}
              title={activeTab.label}
              status={activeTab.status}
              tasks={activeTab.tasks}
              projects={projects}
              onEdit={handleOpenEditModal}
              isMobile
              isPersonalWorkspace={isPersonal}
            />
          </div>
        </div>
      );
    }
    if (monitorView === 'reports') {
      return <ReportsView tasks={allTasks} projects={projects} />;
    }
    if (monitorView === 'modern') {
      return (
        <KanbanSwimlane
          filteredTasks={filteredTasks}
          swimLaneProjects={swimLaneProjects}
          projects={projects}
          onEdit={handleOpenEditModal}
          isPersonalWorkspace={isPersonal}
        />
      );
    }

    return (
      <div data-tutorial-id="tutorial-kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', height: '100%' }}>
        <KanbanColumn title={t('kanban.planned')} status="PLANNED" tasks={filteredPlanned} projects={projects} onEdit={handleOpenEditModal} isPersonalWorkspace={isPersonal} />
        <KanbanColumn title={t('kanban.doing')} status="DOING" tasks={filteredDoing} projects={projects} onEdit={handleOpenEditModal} isPersonalWorkspace={isPersonal} />
        <KanbanColumn title={t('kanban.done')} status="DONE" tasks={filteredDone} projects={projects} onEdit={handleOpenEditModal} isPersonalWorkspace={isPersonal} />
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
        onUserNameChange={(name) => setCurrentUser(u => ({ ...u, name }))}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeChange={setTheme}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onWorkspaceManage={(ws) => { setWorkspaceToManage(ws); setWorkspaceModalMode('manage'); setShowWorkspaceModal(true); }}
        onCreateWorkspace={() => { setWorkspaceModalMode('create'); setWorkspaceToManage(null); setShowWorkspaceModal(true); }}
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
            onReportsClick={() => handleMonitorViewChange('reports')}
            monitorView={monitorView}
            onMonitorViewChange={handleMonitorViewChange}
            forceOpenRegistrations={tutorialActive && (tutorialStepId === 'projects')}
            isPersonalWorkspace={isPersonal}
          />
        )}
        <main className="flex-grow-1 d-flex flex-column" style={{
          overflow: 'hidden',
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
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.3px',
              display: isMobile ? 'none' : 'block'
            }}>
              {monitorView === 'reports' ? t('sidebar.reports') : t('dashboard.title')}
            </h1>
            {/* SEO and Accessibility H1 for Mobile */}
            {isMobile && <h1 className="visually-hidden">{monitorView === 'reports' ? t('sidebar.reports') : t('dashboard.title')}</h1>}
            
            {monitorView !== 'reports' && <div style={{
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

              <button
                onClick={() => setShowDateFilterModal(true)}
                title={t('dashboard.filterByDate')}
                aria-label={t('dashboard.filterByDate')}
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
            </div>}
          </header>

          <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <h2 className="visually-hidden">{t('dashboard.title')}</h2>
              {renderDashboardContent()}
            </div>
            <DragOverlay>{activeTask ? <TaskCard task={activeTask} projects={projects} onEdit={() => { }} isPersonalWorkspace={isPersonal} /> : null}</DragOverlay>
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
            onReportsClick={() => { handleMonitorViewChange('reports'); setShowMobileSidebar(false); }}
            isPersonalWorkspace={isPersonal}
            monitorView={monitorView}
            onMonitorViewChange={(view) => { handleMonitorViewChange(view); setShowMobileSidebar(false); }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <TaskFormModal show={showTaskFormModal} handleClose={handleCloseTaskFormModal} onTaskCreated={handleTaskCreated} onTaskUpdated={handleTaskUpdated} taskToEdit={taskToEdit} onDelete={handleDeleteFromModal} projects={projects} workspaceId={activeWorkspaceId} isPersonal={isPersonal} workspaceMembers={workspaceMembers} currentUser={currentUser} />
      <ConfirmationModal
        show={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleConfirm={handleConfirmDelete}
        title={t('confirmModal.deleteTaskTitle')}
        body={t('confirmModal.deleteTaskBody')}
        confirmButtonText={t('confirmModal.deleteTaskConfirm')}
      />
      <ConfirmationModal
        show={showLogoutConfirm}
        handleClose={() => setShowLogoutConfirm(false)}
        handleConfirm={handleLogout}
        title={t('confirmModal.logoutTitle')}
        body={t('confirmModal.logoutBody')}
        confirmButtonText={t('confirmModal.logoutConfirm')}
        confirmButtonVariant="primary"
      />
      <ProjectsModal show={showProjectsModal} handleClose={() => setShowProjectsModal(false)} onProjectsChange={fetchData} projects={projects} workspaceId={activeWorkspaceId} />
      <TaskTypesModal show={showTaskTypesModal} handleClose={() => setShowTaskTypesModal(false)} onTaskTypesChange={fetchData} projects={projects} workspaceId={activeWorkspaceId} />
      <WorkspaceModal
        show={showWorkspaceModal}
        onHide={() => setShowWorkspaceModal(false)}
        mode={workspaceModalMode}
        workspace={workspaceToManage}
        currentUserId={currentUser?.id}
        onWorkspaceCreated={(ws) => { refetchWorkspaces(); handleWorkspaceChange(ws.id); }}
        onWorkspaceUpdated={() => refetchWorkspaces()}
        onWorkspaceDeleted={() => { refetchWorkspaces(); handleWorkspaceChange(workspaces.find(w => w.isPersonal)?.id); }}
        onMemberRemoved={() => { refetchWorkspaces(); handleWorkspaceChange(workspaces.find(w => w.isPersonal)?.id); }}
      />
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
          onTasksCreated={fetchData}
        />
      )}

      {tutorialActive && (
        <TutorialOverlay
          steps={tutorialSteps}
          currentStep={tutorialCurrentStep}
          onNext={tutorialNext}
          onSkip={tutorialSkip}
        />
      )}
    </div>
  );
}
