import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@mantine/core/styles.css";
import { HashRouter } from "react-router-dom";
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient =
  new QueryClient();

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <QueryClientProvider
      client={queryClient}
    >
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);