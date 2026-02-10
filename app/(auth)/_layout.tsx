import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login-enhanced" />
      <Stack.Screen name="activation" />
      <Stack.Screen name="create-password" />
    </Stack>
  );
}
