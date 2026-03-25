import { useState, useEffect, useCallback } from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Ledger! Let\'s take a quick tour of your personal finance command center. 🚀',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="stats"]',
    content: 'Your monthly snapshot — income, expenses, savings, and savings rate at a glance.',
  },
  {
    target: '[data-tour="gamification"]',
    content: 'Earn points, level up, and maintain streaks by tracking your finances consistently!',
  },
  {
    target: '[data-tour="health"]',
    content: 'Your Financial Health Score rates you from 0–100 across budgeting, savings, and spending balance.',
  },
  {
    target: '[data-tour="activity"]',
    content: 'See your recent point-earning activity here. Every action counts!',
  },
  {
    target: 'nav',
    content: 'Use the sidebar to explore Transactions, Budgets, Savings, Stocks, Crypto, and more. Enjoy! 🎉',
    placement: 'right',
  },
];

const TOUR_KEY = 'ledger_tour_completed';

const AppTour = () => {
  const [run, setRun] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tour') === '1' && !localStorage.getItem(TOUR_KEY)) {
      // Small delay to let the dashboard render
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  const handleCallback = useCallback((data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_KEY, '1');
      // Clean the URL
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
          primaryColor: 'hsl(262, 83%, 58%)',
          zIndex: 10000,
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          textColor: 'hsl(var(--foreground))',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        buttonNext: {
          borderRadius: '8px',
          padding: '8px 18px',
          fontSize: '13px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '13px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '12px',
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
