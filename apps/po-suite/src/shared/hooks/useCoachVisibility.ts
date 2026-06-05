import { useState } from 'react';
import { COACH_DISMISSED_KEY } from '../services/storageKeys';

export function useCoachVisibility() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedForever, setIsDismissedForever] = useState(
    () => localStorage.getItem(COACH_DISMISSED_KEY) === 'true',
  );

  const showCoach = () => {
    if (localStorage.getItem(COACH_DISMISSED_KEY) === 'true') return;
    setIsVisible(true);
  };

  const dismiss = () => setIsVisible(false);

  const dismissForever = () => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'true');
    setIsDismissedForever(true);
    setIsVisible(false);
  };

  return { isVisible, isDismissedForever, showCoach, dismiss, dismissForever };
}
