import { useTrainingEngineStore } from "@/store/trainingEngineStore";

export function useTrainingFeedback() {
  const feedbackHistory = useTrainingEngineStore((state) => state.feedbackHistory);
  const submitFeedback = useTrainingEngineStore((state) => state.submitFeedback);

  return {
    feedbackHistory,
    submitFeedback,
  };
}
