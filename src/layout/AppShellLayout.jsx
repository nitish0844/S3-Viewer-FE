import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  ScrollArea,
  ThemeIcon,
  Divider,
  Menu,
  rem,
} from "@mantine/core";

import {
  useDisclosure
} from "@mantine/hooks";

import {
  IconBrandAws,
  IconCloud,
  IconSettings,
  IconInfoCircle,
  IconRefresh,
  IconMoon,
  IconSun,
  IconLogout,
} from "@tabler/icons-react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

function AppShellLayout({
  children,
  dark,
  toggleTheme,
}) {
  
  const navigate = useNavigate();
  const [
    opened,
    { toggle }
  ] = useDisclosure();

  const clearSession = useAuthStore(
        (state) => state.clearSession
    );


  return (
    <AppShell
      header={{
        height: 64
      }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: {
          mobile: !opened
        },
      }}
      padding="lg"
      bg={
        dark
          ? "#111827"
          : "#f4f6f8"
      }
    >
      {/* HEADER */}
      <AppShell.Header
        px="lg"
        bg={
          dark
            ? "#111827"
            : "#ffffff"
        }
      >
        <Group
          h="100%"
          justify="space-between"
        >
          {/* LEFT */}
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap={10}>
              <ThemeIcon
                color="orange"
                variant="light"
                size={42}
                radius="md"
              >
                <IconBrandAws
                  size={24}
                />
              </ThemeIcon>
              <div>
                <Text
                  fw={700}
                  size="lg"
                  c={
                    dark
                      ? "white"
                      : "black"
                  }
                >
                  AWS S3 Explorer
                </Text>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  Desktop Storage Manager
                </Text>
              </div>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      {/* SIDEBAR */}
      <AppShell.Navbar
        p="md"
        bg={
          dark
            ? "#111827"
            : "#ffffff"
        }
      >
        {/* TITLE */}
        <AppShell.Section>
          <Text
            fw={700}
            size="xs"
            c="dimmed"
            mb="md"
            tt="uppercase"
          >
            Services
          </Text>
        </AppShell.Section>

        {/* MENU */}
        <AppShell.Section
          grow
          component={ScrollArea}
        >
          <NavLink
            label="Amazon S3"
            leftSection={
              <IconCloud
                size={18}
              />
            }
            active
            color="orange"
          />
        </AppShell.Section>
        <Divider my="md" />
        {/* SETTINGS */}
        <AppShell.Section>
          <Menu
            shadow="md"
            width={220}
            position="top-start"
          >
            <Menu.Target>
              <NavLink
                label="Settings"
                leftSection={
                  <IconSettings
                    size={18}
                  />
                }
              />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                Application
              </Menu.Label>
              <Menu.Item
                leftSection={
                  <IconRefresh
                    style={{
                      width: rem(16),
                      height: rem(16),
                    }}
                  />
                }
              >
                Check Updates
              </Menu.Item>
              <Menu.Item
                leftSection={
                  <IconInfoCircle
                    style={{
                      width: rem(16),
                      height: rem(16),
                    }}
                  />
                }
              >
                App Info
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={
                  dark ? (
                    <IconSun
                      style={{
                        width: rem(16),
                        height: rem(16),
                      }}
                    />
                  ) : (
                    <IconMoon
                      style={{
                        width: rem(16),
                        height: rem(16),
                      }}
                    />
                  )
                }
                onClick={
                  toggleTheme
                }
              >
                {
                  dark
                    ? "Light Theme"
                    : "Dark Theme"
                }
              </Menu.Item>

              {/* LOGOUT */}

              {window.location.hash !== "#/" && (
                <Menu.Item
                  onClick={
                    () => {
                      clearSession();
                      navigate("/");
                    }
                  }
                  leftSection={
                    <IconLogout
                      style={{
                        width: rem(16),
                        height: rem(16),
                      }}
                    />
                  }
                >
                  Logout
                </Menu.Item>
              )}

            </Menu.Dropdown>

          </Menu>

        </AppShell.Section>

      </AppShell.Navbar>


      {/* MAIN */}
      <AppShell.Main>

        {children}

      </AppShell.Main>

    </AppShell>
  );
}

export default AppShellLayout;