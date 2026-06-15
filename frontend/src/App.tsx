import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthCallbackPage, LoginPage } from "./components/AuthPages";
import { GamePage } from "./components/GamePage";
import { Toasts } from "./components/Toasts";
import { getAccessToken } from "./services/auth";

const queryClient = new QueryClient();

export function App() {
  const path = window.location.pathname;
  const isAuthenticated = Boolean(getAccessToken());

  let page = <GamePage />;

  if (path === "/login") {
    page = <LoginPage />;
  } else if (path === "/auth/callback") {
    page = <AuthCallbackPage />;
  } else if (!isAuthenticated) {
    page = <LoginPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {page}
      <Toasts />
    </QueryClientProvider>
  );
}
