import type { ReactNode } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { HomePage } from "../pages/HomePage";
import { InterviewReviewPage } from "../pages/InterviewReviewPage";
import { InterviewSessionPage } from "../pages/InterviewSessionPage";
import { InterviewSetupPage } from "../pages/InterviewSetupPage";
import { InterviewProcessingPage } from "../pages/InterviewProcessingPage";
import { JobProfilePage } from "../pages/JobProfilePage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { QuestionBankPage } from "../pages/QuestionBankPage";
import { useAuthStore } from "../stores/authStore";

function RequireAuth({ children }: { children: ReactNode }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  return currentUser && token ? children : <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
}

const basename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(
  [
    { path: "/login", element: <LoginPage /> },
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "interview/setup", element: <RequireAuth><InterviewSetupPage /></RequireAuth> },
        { path: "interview/session/:id", element: <RequireAuth><InterviewSessionPage /></RequireAuth> },
        { path: "interview/processing/:id", element: <RequireAuth><InterviewProcessingPage /></RequireAuth> },
        { path: "interview/review/:id", element: <RequireAuth><InterviewReviewPage /></RequireAuth> },
        { path: "question-bank", element: <RequireAuth><QuestionBankPage /></RequireAuth> },
        { path: "job-profile", element: <RequireAuth><JobProfilePage /></RequireAuth> },
        { path: "profile", element: <RequireAuth><ProfilePage /></RequireAuth> }
      ]
    }
  ],
  { basename }
);
