import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { initI18n, brand } from "./lib/i18n";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

async function bootstrap() {
  await initI18n();

  if (brand.fonts) {
    document.documentElement.style.setProperty(
      "--font-display",
      `"${brand.fonts.display?.family || "Inter"}", sans-serif`,
    );
    document.documentElement.style.setProperty(
      "--font-body",
      `"${brand.fonts.body?.family || "Inter"}", sans-serif`,
    );
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap();
