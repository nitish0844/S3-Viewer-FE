import { useState } from "react";
import { MantineProvider } from "@mantine/core";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ExplorerPage from "./pages/ExplorerPage";
import { useEffect } from "react";
import api from "./api/axios";
import StartupScreen from "./components/StartupScreen";


function App() {
  const [dark, setDark] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  const toggleTheme = () => {
    setDark(!dark);
  };

  useEffect(() => {

    const checkHealth =
      async () => {

        try {
          console.log(
            "Checking server health..."
          );
          await api.get("/health");

          console.log(
            "Server ready"
          );

          setServerReady(true);
        } catch (error) {
          console.error(error);

          console.log(
            "Server sleeping..."
          );
          setTimeout(
            checkHealth,
            3000
          );
        }
      };

    checkHealth();
  }, []);

  return (

    <MantineProvider
      forceColorScheme={
        dark
          ? "dark"
          : "light"
      }
    >

      {!serverReady ? (
          <StartupScreen />
          ):(
            <Routes>
              <Route
                path="/"
                element={
                  <AuthPage
                    dark={dark}
                    toggleTheme={
                      toggleTheme
                    }
                  />
                }
              />

              <Route
                path="/explorer"
                element={
                  <ExplorerPage
                    dark={dark}
                    toggleTheme={
                      toggleTheme
                    }
                  />
                }
              />

            </Routes>
          )
      }
    </MantineProvider>
  );
}

export default App;