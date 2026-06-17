import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import api from '../services/api';
import { normalizeText, taskMatches, buildProjectIndex } from '../utils/search';

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
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ProjectsModal from '../components/ProjectsModal';
import TaskTypesModal from '../components/TaskTypesModal';
import WorkspaceModal from '../components/WorkspaceModal';
import DailySummaryModal from '../components/DailySummaryModal';
import NotificationsModal from '../components/NotificationsModal';
import StagesModal from '../components/StagesModal';

import { Spinner, Offcanvas, Button } from 'react-bootstrap';
import Calendar from 'react-bootstrap-icons/dist/icons/calendar';
import Stars from 'react-bootstrap-icons/dist/icons/stars';
import ChevronRight from 'react-bootstrap-icons/dist/icons/chevron-right';
import DateFilterModal from '../components/DateFilterModal';
import { isWithinInterval, startOfDay, endOfDay, isSameDay, parseISO, format } from 'date-fns';

// Heavy / non-initial: split into async chunks so the first dashboard paint
// doesn't parse recharts (ReportsView) or the AI panel on the main thread.
const ReportsView = lazy(() => import('../components/ReportsView'));
const AiChatPanel = lazy(() => import('../components/AiChatPanel'));

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [taskColumns, setTaskColumns] = useState({});
  const [stages, setStages] = useState([]);
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
  const [aiMounted, setAiMounted] = useState(false); // defer AiChatPanel chunk until first open
  useEffect(() => { if (showAiChat) setAiMounted(true); }, [showAiChat]);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showStagesModal, setShowStagesModal] = useState(false);

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
  const [activeMobileTab, setActiveMobileTab] = useState(null);

  const { isActive: tutorialActive, steps: tutorialSteps, currentStep: tutorialCurrentStep, currentStepId: tutorialStepId, handleNext: tutorialNext, handleSkip: tutorialSkip } = useTutorial({
    isDesktop,
    currentUser,
    setCurrentUser,
  });
  const navigate = useNavigate();
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    } else if (type === 'TASK_REORDERED') {
      const positionMap = new Map((payload.items || []).map(i => [i.id, i.position]));
      setTaskColumns(prev => {
        const newColumns = { ...prev };
        for (const status in newColumns) {
          newColumns[status] = [...newColumns[status]].sort((a, b) => {
            const pa = positionMap.has(a.id) ? positionMap.get(a.id) : (a.position ?? 0);
            const pb = positionMap.has(b.id) ? positionMap.get(b.id) : (b.position ?? 0);
            return pa - pb;
          });
        }
        return newColumns;
      });
    } else {
      // PROJECT_*, MEMBER_* → full refetch
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
  const stageById = useMemo(() => {
    const m = {};
    stages.forEach(s => { m[s.id] = s; });
    return m;
  }, [stages]);
  const firstStageId = stages[0]?.id ?? null;

  // Build empty stage-keyed columns ({ [stageId]: [] }) preserving stage order.
  const emptyColumnsForStages = (stageList) => {
    const cols = {};
    stageList.forEach(s => { cols[String(s.id)] = []; });
    return cols;
  };

  // Bucket a flat task list into stage-keyed columns; tasks without a known
  // stage fall into the first stage so nothing disappears.
  const bucketTasksByStage = (taskList, stageList) => {
    const cols = emptyColumnsForStages(stageList);
    const fallback = stageList[0] ? String(stageList[0].id) : null;
    taskList.forEach(task => {
      const key = task.stageId != null && cols[String(task.stageId)] ? String(task.stageId) : fallback;
      if (key != null && cols[key]) cols[key].push(task);
    });
    return cols;
  };

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

  const projectIndex = useMemo(() => buildProjectIndex(projects), [projects]);
  const normalizedSearch = normalizeText(searchQuery);
  const isSearching = normalizedSearch.length > 0;

  const filteredTasks = useMemo(() => {
    // Global search dominates: with a query, ignore the project pills and date
    // filter and search the whole workspace instead.
    if (normalizedSearch) {
      return allTasks.filter(task => taskMatches(task, normalizedSearch, projectIndex));
    }

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
  }, [allTasks, selectedProjectIds, dateRange, normalizedSearch, projectIndex]);

  const handleLogout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('refreshToken'); navigate('/'); };

  const handleCloseDailySummary = () => {
    localStorage.setItem('lastSummaryDate', format(new Date(), 'yyyy-MM-dd'));
    setShowDailySummary(false);
  };


  const fetchData = async (signal, wsId) => {
    setLoading(true);
    const workspaceId = wsId ?? activeWorkspaceId;
    const wsParams = workspaceId ? { workspaceId } : {};
    try {
      const [userResponse, tasksResponse, projectsResponse, stagesResponse] = await Promise.all([
        api.get('/api/user/me', { signal }),
        api.get('/api/tasks', { signal, params: wsParams }),
        api.get('/api/projects', { signal, params: wsParams }),
        api.get('/api/stages', { signal, params: wsParams }),
      ]);

      const user = userResponse.data;
      if (user && user.language && user.language !== i18n.language) {
        localStorage.setItem('language', user.language);
        i18n.changeLanguage(user.language);
      }

      if (user) setCurrentUser(user);

      const fetchedStages = Array.isArray(stagesResponse.data) ? stagesResponse.data : [];
      setStages(fetchedStages);
      const tasksData = Array.isArray(tasksResponse.data) ? tasksResponse.data : [];
      setTaskColumns(bucketTasksByStage(tasksData, fetchedStages));
      // Keep the mobile tab valid for the current stage set.
      setActiveMobileTab(prev =>
        prev != null && fetchedStages.some(s => String(s.id) === String(prev))
          ? prev
          : (fetchedStages[0] ? String(fetchedStages[0].id) : null)
      );
      setProjects(projectsResponse.data || []);

      // Auto-open Daily Summary once per day, only for users who completed onboarding
      const lastSummaryDate = localStorage.getItem('lastSummaryDate');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (lastSummaryDate !== todayStr && user?.onboardingCompleted) {
        setShowDailySummary(true);
      }

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

  const handleOpenCreateModal = useCallback(() => { setTaskToEdit(null); setShowTaskFormModal(true); }, []);
  // Stable so React.memo'd TaskCard/KanbanColumn don't re-render every drag frame.
  const handleOpenEditModal = useCallback((task) => { setTaskToEdit(task); setShowTaskFormModal(true); }, []);
  const handleCloseTaskFormModal = () => { setTaskToEdit(null); setShowTaskFormModal(false); };

  const resolveStageKey = (task, columns) => {
    if (task.stageId != null && columns[String(task.stageId)]) return String(task.stageId);
    return firstStageId != null && columns[String(firstStageId)] ? String(firstStageId) : null;
  };

  const handleTaskCreated = (newTask) => {
    setTaskColumns(prev => {
      // Avoid duplicates if WS event arrives after local update or vice-versa
      const alreadyExists = Object.values(prev).some(col => col.some(t => t.id === newTask.id));
      if (alreadyExists) return prev;

      const key = resolveStageKey(newTask, prev);
      if (key == null) return prev;
      const column = prev[key] || [];
      const goToBottom = newTask.priority === 'LOW' && key === String(firstStageId);
      const updated = goToBottom ? [...column, newTask] : [newTask, ...column];
      return { ...prev, [key]: updated };
    });
  };

  const handleTaskUpdated = (updatedTask) => {
    setTaskColumns(prev => {
      const newColumns = { ...prev };
      const key = resolveStageKey(updatedTask, newColumns);
      if (key == null) return prev;

      // Find where the task currently is
      let oldKey = null;
      for (const s in newColumns) {
        if (newColumns[s].some(t => t.id === updatedTask.id)) {
          oldKey = s;
          break;
        }
      }

      if (oldKey && oldKey !== key) {
        // Move to different column
        newColumns[oldKey] = newColumns[oldKey].filter(t => t.id !== updatedTask.id);
        newColumns[key] = [updatedTask, ...(newColumns[key] || [])];
      } else if (oldKey) {
        // Update in same column
        newColumns[oldKey] = newColumns[oldKey].map(t => t.id === updatedTask.id ? updatedTask : t);
      } else {
        // Task not found in any column? Add it (could happen if it was filtered out before)
        newColumns[key] = [updatedTask, ...(newColumns[key] || [])];
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
  // Mirror of taskColumns kept in sync so drag handlers always read the freshest
  // ordering (onDragOver fires many times per second, before React re-renders).
  const columnsRef = useRef(taskColumns);
  useEffect(() => { columnsRef.current = taskColumns; }, [taskColumns]);
  const applyColumns = (next) => { columnsRef.current = next; setTaskColumns(next); };

  const dragSourceContainer = useRef(null);
  const dragStartSnapshot = useRef(null);

  const findContainerIn = (columns, taskId) => {
    if (!taskId) return null;
    for (const status in columns) {
      if (columns[status].some(task => task.id === taskId)) return status;
    }
    return null;
  };

  // Parse compound swimlane droppable IDs like "12::project_1" → "12" (stageId)
  const parseContainerId = (id) => {
    if (typeof id === 'string' && id.includes('::')) return id.split('::')[0];
    return id;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = allTasks.find(t => t.id === active.id);
    setActiveTask(task);
    dragSourceContainer.current = findContainerIn(columnsRef.current, active.id);
    dragStartSnapshot.current = columnsRef.current;
  };

  // Move the dragged card between columns mid-drag so the destination column
  // reflows and previews the drop (the "make room" animation).
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const prev = columnsRef.current;
    const activeContainer = findContainerIn(prev, activeId);
    const overTaskContainer = findContainerIn(prev, overId);
    const overContainer = overTaskContainer || parseContainerId(String(overId));
    if (!activeContainer || !overContainer || !prev[activeContainer] || !prev[overContainer]) return;
    // Same column: the sortable strategy handles the reflow; commit at drop.
    if (activeContainer === overContainer) return;

    const activeItems = prev[activeContainer];
    const overItems = prev[overContainer];
    const activeIndex = activeItems.findIndex(t => t.id === activeId);
    if (activeIndex === -1) return;
    const overIndex = overItems.findIndex(t => t.id === overId);

    let newIndex;
    if (overTaskContainer) {
      const isBelowOverItem =
        over.rect &&
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
      newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length;
    } else {
      newIndex = overItems.length;
    }

    const destStage = stageById[overContainer];
    const movedTask = {
      ...activeItems[activeIndex],
      stageId: Number(overContainer),
      stage: destStage || activeItems[activeIndex].stage,
      status: destStage ? destStage.name : activeItems[activeIndex].status,
    };
    applyColumns({
      ...prev,
      [activeContainer]: activeItems.filter(t => t.id !== activeId),
      [overContainer]: [
        ...overItems.slice(0, newIndex),
        movedTask,
        ...overItems.slice(newIndex),
      ],
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const sourceContainer = dragSourceContainer.current;
    dragSourceContainer.current = null;
    setActiveTask(null);

    // Dropped outside any droppable → revert to the pre-drag snapshot.
    if (!over) {
      if (dragStartSnapshot.current) applyColumns(dragStartSnapshot.current);
      dragStartSnapshot.current = null;
      return;
    }
    dragStartSnapshot.current = null;

    const prev = columnsRef.current;
    const finalContainer = findContainerIn(prev, active.id);
    if (!finalContainer || !prev[finalContainer]) return;
    const overContainer = findContainerIn(prev, over.id) || parseContainerId(String(over.id));

    // Settle the exact index within the final column relative to the drop target.
    let columns = prev;
    if (overContainer === finalContainer) {
      const items = prev[finalContainer];
      const activeIndex = items.findIndex(t => t.id === active.id);
      const overIndex = items.findIndex(t => t.id === over.id);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        columns = { ...prev, [finalContainer]: arrayMove(items, activeIndex, overIndex) };
        applyColumns(columns);
      }
    }

    const reordered = columns[finalContainer];
    const reorderPayload = reordered.map((task, index) => ({ id: task.id, position: index * 10 }));
    const params = activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {};

    if (finalContainer === sourceContainer) {
      // Pure reorder within the original column.
      api.put('/api/tasks/reorder', reorderPayload, { params }).catch(() => fetchData());
    } else {
      // Moved to another column → persist new stage, then persist the drop order.
      api.put(`/api/tasks/${active.id}`, { stageId: Number(finalContainer) }, { params })
        .then(() => {
          toast.success(t('kanban.taskMoved'));
          api.put('/api/tasks/reorder', reorderPayload, { params }).catch(() => {});
        })
        .catch(() => { fetchData(); toast.error(t('kanban.taskMoveError')); });
    }
  };

  const handleDragCancel = () => {
    if (dragStartSnapshot.current) applyColumns(dragStartSnapshot.current);
    dragStartSnapshot.current = null;
    dragSourceContainer.current = null;
    setActiveTask(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Snappier autoscroll while dragging — defaults are too gentle and feel laggy.
  const dndAutoScroll = { threshold: { x: 0.15, y: 0.18 }, acceleration: 30, interval: 5 };

  // Smooth settle when a card is dropped; keep the original slot hidden until
  // the overlay finishes animating back into place.
  const dropAnimation = {
    duration: 240,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0' } },
    }),
  };

  const handleProjectToggle = (projectId) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const swimLaneProjects = selectedProjectIds.length > 0
    ? projects.filter(p => selectedProjectIds.includes(p.id))
    : projects;

  const renderDashboardContent = () => {
    if (loading) {
      return <div className="w-100 text-center mt-5"><Spinner animation="border" style={{ color: 'var(--accent)' }} /></div>;
    }

    const columnsByStage = bucketTasksByStage(filteredTasks, stages);

    if (isMobile) {
      const mobileTabs = stages.map(stage => ({
        stage,
        tasks: columnsByStage[String(stage.id)] || [],
        label: stage.name,
      }));
      const activeTab = mobileTabs.find(tab => String(tab.stage.id) === String(activeMobileTab)) || mobileTabs[0];
      if (!activeTab) return null;

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
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
          }}>
            {mobileTabs.map(tab => {
              const isActive = String(activeMobileTab) === String(tab.stage.id);
              return (
                <button
                  key={tab.stage.id}
                  className="press-effect"
                  onClick={() => setActiveMobileTab(String(tab.stage.id))}
                  style={{
                    flex: '1 0 auto',
                    whiteSpace: 'nowrap',
                    padding: '0.5rem 0.6rem',
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
                    backgroundColor: tab.stage.color,
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
              key={activeTab.stage.id}
              title={activeTab.label}
              status={String(activeTab.stage.id)}
              color={activeTab.stage.color}
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
      return (
        <Suspense fallback={<div className="w-100 text-center mt-5"><Spinner animation="border" style={{ color: 'var(--accent)' }} /></div>}>
          <ReportsView tasks={allTasks} projects={projects} stages={stages} />
        </Suspense>
      );
    }
    if (monitorView === 'modern') {
      return (
        <KanbanSwimlane
          filteredTasks={filteredTasks}
          swimLaneProjects={swimLaneProjects}
          projects={projects}
          stages={stages}
          onEdit={handleOpenEditModal}
          isPersonalWorkspace={isPersonal}
        />
      );
    }

    return (
      <div style={{ height: '100%', overflowX: 'auto' }}>
        <div
          data-tutorial-id="tutorial-kanban-board"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))`,
            gap: '1rem',
            height: '100%',
            minWidth: stages.length > 0 ? stages.length * 296 : '100%',
          }}
        >
          {stages.map(stage => (
            <KanbanColumn
              key={stage.id}
              title={stage.name}
              status={String(stage.id)}
              color={stage.color}
              tasks={columnsByStage[String(stage.id)] || []}
              projects={projects}
              onEdit={handleOpenEditModal}
              isPersonalWorkspace={isPersonal}
            />
          ))}
        </div>
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchTasks={allTasks}
        projects={projects}
        onSearchSelectTask={handleOpenEditModal}
        onSearchSelectProject={(id) => { setMonitorView(v => v === 'reports' ? 'classic' : v); setSelectedProjectIds([id]); }}
      />
      <div className="d-flex flex-grow-1" style={{ overflow: 'hidden', minHeight: 0 }}>
        {!isMobile && (
          <Sidebar
            isMobile={isMobile}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onProjectsClick={() => setShowProjectsModal(true)}
            onTaskTypesClick={() => setShowTaskTypesModal(true)}
            onStagesClick={() => setShowStagesModal(true)}
            onReportsClick={() => handleMonitorViewChange('reports')}
            onDailySummaryClick={() => setShowDailySummary(true)}
            onNotificationsClick={() => setShowNotificationsModal(true)}
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
            
            {monitorView !== 'reports' && <div title={isSearching ? t('search.filtersDisabled') : undefined} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              width: isMobile ? '100%' : 'auto',
              overflowX: 'auto',
              paddingBottom: '2px',
              opacity: isSearching ? 0.4 : 1,
              pointerEvents: isSearching ? 'none' : 'auto',
              transition: 'opacity var(--transition)'
            }}>
              {projects.map(project => {
                const isSelected = selectedProjectIds.includes(project.id);
                const anyFilterActive = selectedProjectIds.length > 0;

                return (
                  <button
                    key={project.id}
                    className="press-effect"
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
                className="press-effect"
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

          <DndContext sensors={sensors} collisionDetection={closestCorners} autoScroll={dndAutoScroll} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <h2 className="visually-hidden">{t('dashboard.title')}</h2>
              {renderDashboardContent()}
            </div>
            <DragOverlay dropAnimation={dropAnimation}>{activeTask ? <TaskCard task={activeTask} projects={projects} onEdit={() => { }} isPersonalWorkspace={isPersonal} isOverlay /> : null}</DragOverlay>
          </DndContext>
        </main>

        {/* Desktop: AI chat panel docked to the right — squeezes the board when open */}
        {isDesktop && isPersonal && (
          <div className="ai-panel-dock" style={{ width: showAiChat ? 380 : 0 }}>
            <div className="ai-panel-dock__inner" style={{ width: 380 }} inert={!showAiChat}>
              {aiMounted && (
                <Suspense fallback={null}>
                  <AiChatPanel
                    isOpen={showAiChat}
                    isMobile={false}
                    onTasksCreated={fetchData}
                  />
                </Suspense>
              )}
            </div>
          </div>
        )}

        {/* Desktop: collapse handle — rides the panel's left edge as it slides */}
        {isDesktop && isPersonal && (
          <button
            type="button"
            className="ai-edge-launcher ai-edge-launcher--close"
            style={{
              right: showAiChat ? 380 : 0,
              opacity: showAiChat ? 1 : 0,
              pointerEvents: showAiChat ? 'auto' : 'none',
            }}
            aria-hidden={!showAiChat}
            tabIndex={showAiChat ? 0 : -1}
            onClick={() => setShowAiChat(false)}
            aria-label={t('aiChat.close')}
            title={t('aiChat.close')}
          >
            <ChevronRight size={20} />
          </button>
        )}
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
            onStagesClick={() => { setShowStagesModal(true); setShowMobileSidebar(false); }}
            onReportsClick={() => { handleMonitorViewChange('reports'); setShowMobileSidebar(false); }}
            onDailySummaryClick={() => { setShowDailySummary(true); setShowMobileSidebar(false); }}
            onNotificationsClick={() => { setShowNotificationsModal(true); setShowMobileSidebar(false); }}
            isPersonalWorkspace={isPersonal}
            monitorView={monitorView}
            onMonitorViewChange={(view) => { handleMonitorViewChange(view); setShowMobileSidebar(false); }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <TaskFormModal show={showTaskFormModal} handleClose={handleCloseTaskFormModal} onTaskCreated={handleTaskCreated} onTaskUpdated={handleTaskUpdated} taskToEdit={taskToEdit} onDelete={handleDeleteFromModal} projects={projects} stages={stages} workspaceId={activeWorkspaceId} isPersonal={isPersonal} workspaceMembers={workspaceMembers} currentUser={currentUser} defaultProjectId={selectedProjectIds.length === 1 ? selectedProjectIds[0] : null} />
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
      <StagesModal show={showStagesModal} handleClose={() => setShowStagesModal(false)} onStagesChange={fetchData} stages={stages} workspaceId={activeWorkspaceId} />
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
      {/* AI launcher — tab docked to the right edge, vertically centered */}
      {isPersonal && !showAiChat && (
        <button
          type="button"
          className="ai-edge-launcher"
          onClick={() => setShowAiChat(true)}
          aria-label={t('sidebar.aiAssistant')}
          title={t('sidebar.aiAssistant')}
          data-tutorial-id="tutorial-sidebar-ai"
        >
          <span className="ai-edge-launcher__icon">
            <Stars size={20} />
          </span>
          <span className="ai-edge-launcher__label">IA</span>
        </button>
      )}

      {/* Mobile: AI chat as a slide-in drawer (no room to squeeze) */}
      {isMobile && isPersonal && showAiChat && (
        <div className="ai-panel-overlay" onClick={() => setShowAiChat(false)}>
          <div className="ai-panel-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ai-edge-launcher ai-edge-launcher--close ai-edge-launcher--drawer"
              onClick={() => setShowAiChat(false)}
              aria-label={t('aiChat.close')}
              title={t('aiChat.close')}
            >
              <ChevronRight size={20} />
            </button>
            <Suspense fallback={null}>
              <AiChatPanel
                isOpen={showAiChat}
                isMobile
                onTasksCreated={fetchData}
              />
            </Suspense>
          </div>
        </div>
      )}

      <DailySummaryModal
        show={showDailySummary}
        onClose={handleCloseDailySummary}
        tasks={allTasks}
        currentUser={currentUser}
        projects={projects}
        stages={stages}
      />

      <NotificationsModal
        show={showNotificationsModal}
        handleClose={() => setShowNotificationsModal(false)}
        workspaceId={activeWorkspaceId}
        projects={projects}
      />

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
