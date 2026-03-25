import { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS, type Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Ledger! Let\'s take a quick tour of your personal finance command center. 🚀',
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: '[data-tour="stats"]',
    content: 'Your monthly snapshot — income, expenses, savings, and savings rate at a glance. Numbers animate in as data loads!',
    skipBeacon: true,
  },
  {
    target: '[data-tour="gamification"]',
    content: 'Earn points, level up, and maintain streaks by tracking your finances consistently!',
    skipBeacon: true,
  },
  {
    target: '[data-tour="health"]',
    content: 'Your Financial Health Score rates you from 0–100 across budgeting, savings, and spending balance.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="activity"]',
    content: 'See your recent point-earning activity here. Every action counts!',
    skipBeacon: true,
  },
  {
    target: 'nav',
    content: 'Use the sidebar to explore all modules. Pro tip: press ⌘K (or Ctrl+K) to quickly jump anywhere! 🎉',
    placement: 'right' as const,
    skipBeacon: true,
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

  const handleEvent = useCallback((data: { status: string }) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
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
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        primaryColor: 'hsl(256, 30%, 52%)',
        zIndex: 10000,
        arrowColor: 'hsl(240, 4%, 10%)',
        backgroundColor: 'hsl(240, 4%, 10%)',
        textColor: 'hsl(240, 5%, 96%)',
        showProgress: true,
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
