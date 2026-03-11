import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const TUTORIAL_STEPS = [
  { id: 'welcome',    target: null,                              actionTarget: null },
  { id: 'sidebar',    target: 'tutorial-sidebar',                actionTarget: null },
  { id: 'workspace',  target: 'tutorial-workspace-switcher',     actionTarget: null },
  { id: 'projects',   target: 'tutorial-sidebar-projects',       actionTarget: 'tutorial-sidebar-projects' },
  { id: 'new-task',   target: 'tutorial-new-task-btn',           actionTarget: 'tutorial-new-task-btn' },
  { id: 'kanban',     target: 'tutorial-kanban-board',           actionTarget: null },
  { id: 'drag-drop',  target: 'tutorial-kanban-board',           actionTarget: null },
  { id: 'done',       target: null,                              actionTarget: null },
];

export function useTutorial({ isDesktop, currentUser, setCurrentUser }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isDesktop && currentUser && currentUser.onboardingCompleted === false) {
      setIsActive(true);
    }
  }, [currentUser, isDesktop]);

  const complete = useCallback(async () => {
    setIsActive(false);
    setCurrentUser(prev => ({ ...prev, onboardingCompleted: true }));
    try {
      await api.put('/api/user/onboarding-complete', {}, { _silent: true });
    } catch (err) {
      console.error('Error completing tutorial:', err);
    }
  }, [setCurrentUser]);

  const handleNext = useCallback(() => {
    if (currentStep >= TUTORIAL_STEPS.length - 1) {
      complete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, complete]);

  const handleSkip = useCallback(() => {
    complete();
  }, [complete]);

  // Capture-phase click listener for action-triggered step advances
  useEffect(() => {
    if (!isActive) return;
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.actionTarget) return;

    const handler = (e) => {
      const el = e.target.closest('[data-tutorial-id]');
      if (el?.dataset.tutorialId === step.actionTarget) {
        setTimeout(() => {
          setCurrentStep(prev => {
            if (prev >= TUTORIAL_STEPS.length - 1) {
              complete();
              return prev;
            }
            return prev + 1;
          });
        }, 0);
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isActive, currentStep, complete]);

  // ESC to skip
  useEffect(() => {
    if (!isActive) return;
    const handler = (e) => {
      if (e.key === 'Escape') handleSkip();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isActive, handleSkip]);

  return {
    isActive,
    steps: TUTORIAL_STEPS,
    currentStep,
    currentStepId: isActive ? TUTORIAL_STEPS[currentStep].id : null,
    handleNext,
    handleSkip,
  };
}
