import { useEffect, useState } from "react";
import api from "../api/axios";
import {
    Card,
    Text,
    Button,
    Group,
    Stack,
    Title,
    ThemeIcon,
} from "@mantine/core";
import { useAuthStore } from "../store/authStore";

import { IconBrandAws } from "@tabler/icons-react";
import AppShellLayout from "../layout/AppShellLayout";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

function AuthPage({ dark, toggleTheme }) {
    const [awsCredentials, setAwsCredentials] = useState(null);
    const setSession = useAuthStore((state) => state.setSession);
    const navigate = useNavigate();

    const loadAwsCredentials =
        async () => {
            try {
                const result = await window.electronAPI.getAwsKeychain();
                setAwsCredentials(result);
            } catch (error) {

                console.error(error);
            }
        };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAwsCredentials();
    }, []);

    const connectMutation =
        useMutation({
            mutationFn: async () => {
                const existingSession =
                await window.electronAPI.getSession(awsCredentials.access_key);
                if (existingSession) {
                    console.log("Existing session found");
                    try {
                        const validation = await api.post("/validate-session", { session_id: existingSession });

                        if (validation.data.valid) {
                            console.log("Using existing session");
                            setSession(existingSession, awsCredentials.access_key);

                            return { session_id: existingSession };
                        }

                    } catch (error) {
                        console.log("Session expired", error);
                        await window.electronAPI.deleteSession(awsCredentials.access_key);
                    }
                }

                console.log(
                    "Creating new session..."
                );

                const response = await api.post("/connect",
                    {
                        access_key: awsCredentials.access_key,
                        secret_key: awsCredentials.secret_key,
                        region: "ap-south-1",
                    }
                );
                await window.electronAPI.saveSession({access_key: awsCredentials.access_key, session_id: response.data.session_id});
                setSession(response.data.session_id, awsCredentials.access_key);
                return response.data;
            },

            onSuccess: () => {
                console.log("Connected Successfully");
                navigate(
                    "/explorer"
                );
            },
            onError: (error) => {
                console.error(error);
            },
        });

    return (
        <AppShellLayout dark={dark} toggleTheme={toggleTheme}>
            <Title
                order={2}
                mb="xl"
                fw={800}
                style={{
                    letterSpacing: "-1px",
                }}
                c={dark ? "#f8f9fa" : "#1e293b"}
            >
                AWS Connections
            </Title>

            {awsCredentials && (
                <Card
                    shadow="sm"
                    radius="lg"
                    padding="xl"
                    withBorder
                    maw={700}
                >
                    <Group
                        justify="space-between"
                    >
                        <Group>
                            <ThemeIcon
                                color="orange"
                                variant="light"
                                size={56}
                                radius="xl"
                            >
                                <IconBrandAws
                                    size={30}
                                />
                            </ThemeIcon>

                            <Stack gap={2}>
                                <Text
                                    fw={700}
                                    size="lg"
                                >
                                    Amazon S3
                                </Text>

                                <Text
                                    c="dimmed"
                                    size="sm"
                                >
                                    {awsCredentials.access_key}
                                </Text>
                            </Stack>
                        </Group>
                        <Button
                            color="orange"
                            radius="md"
                            loading={
                                connectMutation.isPending
                            }
                            onClick={() =>
                                connectMutation.mutate()
                            }
                        >
                            Connect
                        </Button>
                    </Group>
                </Card>
            )}
        </AppShellLayout>
    );
}

export default AuthPage;