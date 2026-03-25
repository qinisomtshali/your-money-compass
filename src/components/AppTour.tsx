import { useState, useEffect, useCallback } from 'react';
import Joyride, { STATUS, type CallBackProps, type Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Ledger! Let\'s take a quick tour of your personal finance command center. 🚀',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="stats"]',
    content: 'Your monthly snapshot — income, expenses, savings, and savings rate at a glance. Numbers animate in as data loads!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="gamification"]',
    content: 'Earn points, level up, and maintain streaks by tracking your finances consistently!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="health"]',
    content: 'Your Financial Health Score rates you from 0–100 across budgeting, savings, and spending balance.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="activity"]',
    content: 'See your recent point-earning activity here. Every action counts!',
    disableBeacon: true,
  },
  {
    target: 'nav',
    content: 'Use the sidebar to explore all modules. Pro tip: press ⌘K (or Ctrl+K) to quickly jump anywhere! 🎉',
    placement: 'right',
    disableBeacon: true,
  },
];

const TOUR_KEY = 'ledger_tour_completed';

const AppTour = () => {
  const [run, setRun] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tour') === '1' && !localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  const handleCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_KEY, '1');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (!run) return null;

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: 'hsl(256, 30%, 52%)',
          zIndex: 10000,
          arrowColor: 'hsl(240, 4%, 10%)',
          backgroundColor: 'hsl(240, 4%, 10%)',
          textColor: 'hsl(240, 5%, 96%)',
        },
        tooltip: {
          borderRadius: '0.75rem',
          border: '1px solid hsl(240, 4%, 16%)',
          padding: '1.25rem',
        },
        buttonNext: {
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(240, 5%, 45%)',
          fontSize: '0.875rem',
        },
        buttonSkip: {
          color: 'hsl(240, 5%, 45%)',
          fontSize: '0.75rem',
        },
        spotlight: {
          borderRadius: '0.75rem',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Got it',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
};

export default AppTour;
