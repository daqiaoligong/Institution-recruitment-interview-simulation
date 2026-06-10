import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { HomePage } from "../pages/HomePage";
import { InterviewReviewPage } from "../pages/InterviewReviewPage";
import { InterviewSessionPage } from "../pages/InterviewSessionPage";
import { InterviewSetupPage } from "../pages/InterviewSetupPage";
import { JobProfilePage } from "../pages/JobProfilePage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { QuestionBankPage } from "../pages/QuestionBankPage";
import { useAuthStore } from "../stores/authStore";

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore.getState().currentUser;
  return user ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "interview/setup", element: <RequireAuth><InterviewSetupPage /></RequireAuth> },
      { path: "interview/session/:id", element: <RequireAuth><InterviewSessionPage /></RequireAuth> },
      { path: "interview/review/:id", element: <RequireAuth><InterviewReviewPage /></RequireAuth> },
      { path: "question-bank", element: <RequireAuth><QuestionBankPage /></RequireAuth> },
      { path: "job-profile", element: <RequireAuth><JobProfilePage /></RequireAuth> },
      { path: "profile", element: <RequireAuth><ProfilePage /></RequireAuth> }
    ]
  }
]);
