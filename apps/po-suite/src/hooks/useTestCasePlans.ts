import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteTestPlan, getTestPlan, getTestPlans } from '../services/testCaseStorage';
import type { StoredTestPlan } from '../types';

export function useTestCasePlans(q: string) {
  return useQuery({
    queryKey: ['tcg-plans', q],
    queryFn: () => getTestPlans(q),
  });
}

export function useTestCasePlan(id: string | undefined) {
  return useQuery({
    queryKey: ['tcg-plan', id],
    queryFn: () => getTestPlan(id!),
    enabled: !!id,
  });
}

export function useDeleteTestPlan() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      deleteTestPlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tcg-plans'] });
    },
  });
}

export function useTestCasePlanList(q: string): { plans: StoredTestPlan[]; isLoading: boolean } {
  const { data, isLoading } = useTestCasePlans(q);
  return { plans: data?.plans ?? [], isLoading };
}
