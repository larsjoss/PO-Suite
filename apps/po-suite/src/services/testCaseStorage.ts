import type { TestPlan, StoredTestPlan, TestPlansResponse } from '../types';

const TCG_PLANS_KEY = 'tcg_plans';

function loadPlans(): StoredTestPlan[] {
  try {
    return JSON.parse(localStorage.getItem(TCG_PLANS_KEY) ?? '[]') as StoredTestPlan[];
  } catch {
    return [];
  }
}

function savePlans(plans: StoredTestPlan[]): void {
  localStorage.setItem(TCG_PLANS_KEY, JSON.stringify(plans));
}

export function getTestPlans(q?: string): TestPlansResponse {
  let plans = loadPlans();
  if (q?.trim()) {
    const lower = q.toLowerCase();
    plans = plans.filter(
      (p) =>
        p.story_title.toLowerCase().includes(lower) ||
        p.storyText.toLowerCase().includes(lower),
    );
  }
  plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { plans, total: plans.length };
}

export function getTestPlan(id: string): StoredTestPlan {
  const plan = loadPlans().find((p) => p.id === id);
  if (!plan) throw new Error('Testplan nicht gefunden');
  return plan;
}

export function createTestPlan(plan: TestPlan, storyText: string): StoredTestPlan {
  const plans = loadPlans();
  const stored: StoredTestPlan = {
    ...plan,
    id: crypto.randomUUID(),
    storyText,
    createdAt: new Date().toISOString(),
  };
  plans.unshift(stored);
  savePlans(plans);
  return stored;
}

export function deleteTestPlan(id: string): void {
  savePlans(loadPlans().filter((p) => p.id !== id));
}
