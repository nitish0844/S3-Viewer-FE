import { useState, useEffect } from "react";

import {
    Title,
    SimpleGrid,
    Card,
    Text,
    Group,
    ThemeIcon,
    Loader,
    Center,
    Stack,
    Button,
    Divider,
    Menu,
    Modal,
} from "@mantine/core";

import { notifications } from "@mantine/notifications";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import {
    IconFolder,
    IconFile,
    IconArrowLeft,
    IconUpload,
    IconTrash,
    IconDotsVertical,
} from "@tabler/icons-react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import AppShellLayout from "../layout/AppShellLayout";
import api from "../api/axios";

import { useAuthStore } from "../store/authStore";

dayjs.extend(utc);
dayjs.extend(timezone);
function ExplorerPage({ dark, toggleTheme }) {

    const navigate = useNavigate();

    const sessionId = useAuthStore(
        (state) => state.sessionId
    );

    const clearSession = useAuthStore(
        (state) => state.clearSession
    );

    const [dragActive, setDragActive] = useState(false);

    const [draggedFiles, setDraggedFiles] = useState([]);

    const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);

    const [selectedBucket, setSelectedBucket] =
        useState(null);

    const [currentPath, setCurrentPath] =
        useState("");

    const [deleteModalOpen, setDeleteModalOpen] =
        useState(false);

    const [selectedFile, setSelectedFile] =
        useState(null);

    const bucketsQuery = useQuery({
        queryKey: ["buckets"],
        enabled: !!sessionId,
        queryFn: async () => {
            try {
                const response = await api.post(
                    "/buckets",
                    {
                        session_id: sessionId,
                    }
                );
                return response.data.buckets;
            } catch (error) {
                if (
                    error.response?.status === 401
                ) {
                    clearSession();
                    navigate("/");
                }
                throw error;
            }
        },
    });

    useEffect(() => {

        const handleDragOver = (e) => {

            e.preventDefault();

            if (
                e.dataTransfer?.types.includes(
                    "Files"
                )
            ) {
                setDragActive(true);
            }
        };

        const handleDrop = () => {
            setDragActive(false);
        };

        const handleDragEnd = () => {
            setDragActive(false);
        };

        window.addEventListener(
            "dragover",
            handleDragOver
        );

        window.addEventListener(
            "drop",
            handleDrop
        );

        window.addEventListener(
            "dragend",
            handleDragEnd
        );

        return () => {

            window.removeEventListener(
                "dragover",
                handleDragOver
            );

            window.removeEventListener(
                "drop",
                handleDrop
            );

            window.removeEventListener(
                "dragend",
                handleDragEnd
            );
        };

    }, []);

    const dragUploadMutation = useMutation({
        mutationFn: async () => {
            if (!draggedFiles.length) {
                return;
            }
            const file = draggedFiles[0];
            const formData = new FormData();
            formData.append(
                "session_id",
                sessionId
            );
            formData.append(
                "bucket",
                selectedBucket
            );
            formData.append(
                "prefix",
                currentPath
            );
            formData.append(
                "file",
                file,
                file.name
            );
            const response = await api.post(
                "/upload",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            notifications.show({
                color: "green",
                title: "Upload Success",
                message: "File uploaded successfully",
                autoClose: 5000,
                withCloseButton: true,
                position: "top-right"
            });
            setUploadConfirmOpen(false);
            setDraggedFiles([]);
            objectsQuery.refetch();
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                title: "Upload Failed",
                autoClose: 5000,
                withCloseButton: true,
                position: "top-right",
                message:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong",
            });
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            const files = await window.electronAPI
                .selectFile();
            if (!files.length) {
                return;
            }
            const filePath = files[0];
            const fileName =
                filePath.split("/").pop();
            // =========================
            // CHECK FILE EXISTS
            // =========================

            const fileExists =
                objectsQuery.data.files.some(
                    (file) => {

                        const existingName =
                            file.name.replace(
                                currentPath,
                                ""
                            );

                        return (
                            existingName === fileName
                        );
                    }
                );


            // =========================
            // OVERWRITE CONFIRMATION
            // =========================

            if (fileExists) {

                const confirmed =
                    window.confirm(

                        `File "${fileName}" already exists.\n\nDo you want to overwrite it?`
                    );

                if (!confirmed) {
                    return;
                }
            }


            // =========================
            // CREATE FORM DATA
            // =========================

            const formData =
                new FormData();

            formData.append(
                "session_id",
                sessionId
            );

            formData.append(
                "bucket",
                selectedBucket
            );

            formData.append(
                "prefix",
                currentPath
            );


            // =========================
            // READ FILE
            // =========================

            const fileBuffer =
                await window.electronAPI
                    .readFile(filePath);

            const blob =
                new Blob([
                    new Uint8Array(
                        fileBuffer
                    )
                ]);

            formData.append(
                "file",
                blob,
                fileName
            );

            const response = await api.post(
                "/upload",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            notifications.show({
                color: "green",
                title: "Upload Success",
                message: "File uploaded successfully",
                autoClose: 5000,
                withCloseButton: true,
                position: "top-right"
            });
            objectsQuery.refetch();
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                title: "Upload Failed",
                autoClose: 5000,
                withCloseButton: true,
                position: "top-right",
                message:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(
                "/delete-file",
                {
                    session_id: sessionId,
                    bucket: selectedBucket,
                    key: selectedFile.name,
                }
            );
            return response.data;
        },
        onSuccess: () => {
            setDeleteModalOpen(false);
            setSelectedFile(null);
            notifications.show({
                color: "green",
                title: "Delete Success",
                message: "File deleted successfully",
                autoClose: 5000,
                withCloseButton: true,
                position: "top-right"
            })
            objectsQuery.refetch();
        },
        onError: (error) => {
            notifications.show({
                color: "red",
                title: "Delete Failed",
                message:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong",
                autoClose: 5000,
                withCloseButton: true,
                position: "top-right"
            })
        },
    });

    // =========================
    // FETCH OBJECTS
    // =========================
    const objectsQuery = useQuery({
        queryKey: [
            "objects",
            selectedBucket,
            currentPath,
        ],
        enabled: !!selectedBucket,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const response = await api.post(
                "/objects",
                {
                    session_id: sessionId,
                    bucket: selectedBucket,
                    prefix: currentPath,
                }
            );
            return response.data;
        },
    });


    // =========================
    // BACK FOLDER
    // =========================

    const goBack = () => {
        // =========================
        // BACK TO BUCKETS
        // =========================

        if (!currentPath) {
            setSelectedBucket(null);
            return;
        }


        // =========================
        // BACK FOLDER
        // =========================

        const trimmed =
            currentPath.endsWith("/")

                ? currentPath.slice(0, -1)

                : currentPath;

        const parts =
            trimmed.split("/");

        parts.pop();

        const previousPath =
            parts.length > 0

                ? parts.join("/") + "/"

                : "";
        setCurrentPath(previousPath);
    };


    // =========================
    // OPEN FOLDER
    // =========================

    const openFolder = (folder) => {
        setCurrentPath(folder);
    };


    return (
        <AppShellLayout
            dark={dark}
            toggleTheme={toggleTheme}
        >


            {dragActive && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                    onDragLeave={(e) => {

                        if (
                            e.clientX <= 0 ||
                            e.clientY <= 0 ||
                            e.clientX >= window.innerWidth ||
                            e.clientY >= window.innerHeight
                        ) {
                            setDragActive(false);
                        }
                    }}
                    onDrop={(e) => {

                        e.preventDefault();

                        setDragActive(false);

                        if (!selectedBucket) {

                            notifications.show({
                                color: "red",
                                title: "No Bucket Selected",
                                message:
                                    "Please open a bucket first",
                            });

                            return;
                        }

                        const files =
                            Array.from(
                                e.dataTransfer.files
                            );

                        if (!files.length) {
                            return;
                        }

                        setDraggedFiles(files);

                        setUploadConfirmOpen(true);
                    }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(0,0,0,0.75)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <IconUpload
                        size={90}
                        color="white"
                    />

                    <Text
                        c="white"
                        size="xl"
                        fw={700}
                        mt="md"
                    >
                        Drag & Drop to Upload
                    </Text>
                </div>
            )}
            <Group
                justify="space-between"
                mb="xl"
            >
                <Group gap="xs">
                    {selectedBucket && (
                        <ThemeIcon
                            variant="subtle"
                            size={34}
                            radius="xl"
                            style={{
                                cursor: "pointer",
                            }}
                            onClick={goBack}
                        >
                            <IconArrowLeft size={20} />
                        </ThemeIcon>
                    )}

                    <Title order={2} fw={800}>
                        Bucket Explorer
                    </Title>
                </Group>


                {selectedBucket && (
                    <Button
                        color="orange"
                        leftSection={
                            <IconUpload
                                size={16}
                            />
                        }
                        loading={
                            uploadMutation.isPending
                        }
                        onClick={() =>
                            uploadMutation.mutate()
                        }
                    >
                        Upload
                    </Button>
                )
                }
            </Group>
            {/* ========================= */}
            {/* BUCKET LOADER */}
            {/* ========================= */}

            {bucketsQuery.isLoading && (
                <Center mt={100}>
                    <Stack align="center">
                        <Loader
                            color="orange"
                            size="lg"
                        />
                        <Text c="dimmed">
                            Loading buckets...
                        </Text>
                    </Stack>
                </Center>
            )
            }

            {/* ========================= */}
            {/* BUCKETS */}
            {/* ========================= */}

            {!selectedBucket && bucketsQuery.data && (
                <SimpleGrid
                    cols={3}
                    spacing="lg"
                >
                    {bucketsQuery.data.map(
                        (bucket) => (
                            <Card
                                key={bucket}
                                shadow="sm"
                                radius="lg"
                                padding="lg"
                                withBorder
                                style={{
                                    cursor: "pointer",
                                }}
                                onDoubleClick={() => {
                                    setSelectedBucket(bucket);
                                    setCurrentPath("");
                                }}
                            >
                                <Group>
                                    <ThemeIcon
                                        color="orange"
                                        variant="light"
                                        size={50}
                                        radius="xl"
                                    >
                                        <IconFolder
                                            size={26}
                                        />
                                    </ThemeIcon>

                                    <div>
                                        <Text fw={700}>
                                            {bucket}
                                        </Text>
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                        >
                                            AWS S3 Bucket
                                        </Text>
                                    </div>
                                </Group>
                            </Card>
                        )
                    )
                    }
                </SimpleGrid>
            )
            }

            {/* ========================= */}
            {/* OBJECTS LOADER */}
            {/* ========================= */}

            {
                objectsQuery.isLoading && (

                    <Center mt={100}>

                        <Loader
                            color="orange"
                            size="lg"
                        />

                    </Center>
                )
            }


            {/* ========================= */}
            {/* OBJECTS */}
            {/* ========================= */}

            {
                selectedBucket &&
                objectsQuery.data && (

                    <div>

                        <Text
                            fw={700}
                            mb="md"
                        >
                            Bucket: {selectedBucket}
                        </Text>


                        <Text
                            size="sm"
                            c="dimmed"
                            mb="xl"
                        >
                            Path: {currentPath || "/"}
                        </Text>


                        <Divider mb="lg" />


                        <SimpleGrid
                            cols={3}
                            spacing="lg"
                        >

                            {/* FOLDERS */}

                            {
                                objectsQuery.data.folders.map(
                                    (folder) => (

                                        <Card
                                            key={folder}
                                            shadow="sm"
                                            radius="lg"
                                            padding="lg"
                                            withBorder
                                            style={{
                                                cursor: "pointer",
                                            }}
                                            onDoubleClick={() =>
                                                openFolder(folder)
                                            }
                                        >

                                            <Group>

                                                <ThemeIcon
                                                    color="orange"
                                                    variant="light"
                                                    size={50}
                                                    radius="xl"
                                                >

                                                    <IconFolder
                                                        size={26}
                                                    />

                                                </ThemeIcon>


                                                <div>

                                                    <Text fw={700}>

                                                        {
                                                            folder
                                                                .replace(
                                                                    currentPath,
                                                                    ""
                                                                )
                                                                .replace(
                                                                    "/",
                                                                    ""
                                                                )
                                                        }
                                                    </Text>

                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                    >
                                                        Folder
                                                    </Text>

                                                </div>

                                            </Group>

                                        </Card>
                                    )
                                )
                            }


                            {/* FILES */}

                            {objectsQuery.data.files.map(
                                (file) => (
                                    <Card
                                        key={file.name}
                                        shadow="sm"
                                        radius="lg"
                                        padding="lg"
                                        withBorder
                                    >
                                        <div
                                            style={{
                                                position: "relative",
                                            }}
                                        >
                                            {/* TOP RIGHT MENU */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    right: 0,
                                                    zIndex: 10,
                                                }}
                                            >
                                                <Menu
                                                    shadow="md"
                                                    width={180}
                                                >
                                                    <Menu.Target>
                                                        <ThemeIcon
                                                            variant="subtle"
                                                            style={{
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <IconDotsVertical size={18} />
                                                        </ThemeIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item
                                                            color="red"
                                                            leftSection={
                                                                <IconTrash
                                                                    size={16}
                                                                />
                                                            }
                                                            onClick={() => {
                                                                setSelectedFile(
                                                                    file
                                                                );
                                                                setDeleteModalOpen(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </div>
                                            {/* FILE CONTENT */}

                                            <Group align="flex-start" >
                                                <ThemeIcon
                                                    color="blue"
                                                    variant="light"
                                                    size={50}
                                                    radius="xl"
                                                >
                                                    <IconFile size={24} />
                                                </ThemeIcon>

                                                <div>
                                                    <Text fw={700}>
                                                        {
                                                            file.name.replace(
                                                                currentPath,
                                                                ""
                                                            )
                                                        }
                                                    </Text>

                                                    <Text
                                                        size="sm"
                                                        c="dimmed"
                                                    >
                                                        {
                                                            (
                                                                file.size /
                                                                1024 /
                                                                1024
                                                            ).toFixed(2)
                                                        }
                                                        {" "}
                                                        MB
                                                    </Text>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                        mt={4}
                                                    >
                                                        Uploaded:
                                                        {" "}

                                                        {
                                                            dayjs(
                                                                file.last_modified
                                                            )
                                                                .tz(
                                                                    "Asia/Kolkata"
                                                                )
                                                                .format(
                                                                    "DD MMM YYYY hh:mm A"
                                                                )
                                                        }
                                                    </Text>
                                                </div>
                                            </Group>
                                        </div>
                                    </Card>
                                )
                            )
                            }
                        </SimpleGrid>
                    </div>
                )}

            <Modal
                opened={deleteModalOpen}
                onClose={() =>
                    setDeleteModalOpen(false)
                }
                title="Delete File"
                centered
            >
                <Text size="sm">
                    Are you sure you want to delete:
                </Text>
                <Text
                    fw={700}
                    mt="sm"
                    mb="lg"
                >
                    {
                        selectedFile?.name.replace(
                            currentPath,
                            ""
                        )
                    }
                </Text>
                <Group justify="flex-end">
                    <Button
                        variant="default"
                        onClick={() =>
                            setDeleteModalOpen(false)
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        loading={
                            deleteMutation.isPending
                        }
                        onClick={() =>
                            deleteMutation.mutate()
                        }
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={uploadConfirmOpen}
                onClose={() =>
                    setUploadConfirmOpen(false)
                }
                title="Upload File"
                centered
            >
                <Text size="sm">
                    Upload this file to:
                </Text>
                <Text fw={700} mt="sm">
                    {selectedBucket}
                </Text>
                <Text size="sm" c="dimmed">
                    {currentPath || "/"}
                </Text>
                <Text mt="md">
                    {draggedFiles[0]?.name}
                </Text>
                <Group justify="flex-end" mt="lg">
                    <Button
                        variant="default"
                        onClick={() =>
                            setUploadConfirmOpen(false)
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        color="orange"
                        loading={
                            dragUploadMutation.isPending
                        }
                        onClick={() =>
                            dragUploadMutation.mutate()
                        }
                    >
                        Upload
                    </Button>
                </Group>
            </Modal>
        </AppShellLayout>
    );
}

export default ExplorerPage;