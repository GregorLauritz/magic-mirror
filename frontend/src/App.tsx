import { QueryClient, QueryClientProvider } from "react-query";
import React from "react";
import MenuAppBar from "./components/appbar/MenuAppBar";
import { PADDING } from "./assets/styles/theme";
import { Box } from "@mui/material";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import RouteErrorPage from "./routes/RouteErrorPage";
import { Dashboard, Settings } from "@mui/icons-material";
import { Registration } from "./routes/Registration";
import ErrorPage from "./routes/ErrorPage";

const queryCache = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: 300,
      staleTime: 60000,
    },
  },
});

const BaseFrame = ({ children }: { children: JSX.Element }) => {
  return (
    <React.Fragment>
      <MenuAppBar />
      <Box p={PADDING}>{children}</Box>
    </React.Fragment>
  );
};

const AppFrame = () => {
  return (
    <BaseFrame>
      <Outlet />
    </BaseFrame>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppFrame />,
    errorElement: (
      <BaseFrame>
        <RouteErrorPage />
      </BaseFrame>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "registration",
        element: <Registration />,
      },
      {
        path: "error",
        element: <ErrorPage />,
      },
    ],
  },
]);

export const App = () => {
  return (
    <QueryClientProvider client={queryCache}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
