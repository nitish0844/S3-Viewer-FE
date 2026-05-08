import {
    useEffect,
    useRef,
} from "react";

import {
    Stack,
    Text,
    Title,
    Center,
} from "@mantine/core";

import lottie
    from "lottie-web";

import animationData
    from "../assets/Hosting.json";


function StartupScreen() {

    const containerRef =
        useRef(null);


    useEffect(() => {

        const animation =
            lottie.loadAnimation({

                container:
                    containerRef.current,

                renderer: "svg",

                loop: true,

                autoplay: true,

                animationData,
            });


        return () => {

            animation.destroy();
        };

    }, []);


    return (

        <Center h="100vh">

            <Stack
                align="center"
                gap="md"
            >

                <div
                    ref={containerRef}
                    style={{
                        width: 260,
                        height: 260,
                    }}
                />


                <Title
                    order={2}
                    ta="center"
                >
                    Starting Server...
                </Title>


                <Text
                    c="dimmed"
                    ta="center"
                >
                    Please wait while backend wakes up
                </Text>

            </Stack>

        </Center>
    );
}

export default StartupScreen;