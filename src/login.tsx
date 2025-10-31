import { Action, ActionPanel, Form, showToast, Toast, popToRoot } from "@raycast/api";
import { useState } from "react";
import { ApiClient } from "./services/api";
import { AuthService } from "./services/auth";
import { ERROR_MESSAGES } from "./constants";

export default function LoginCommand() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!username || !password) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: ERROR_MESSAGES.VALIDATION_ERROR,
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiClient = new ApiClient();
      const response = await apiClient.login(username, password);

      await AuthService.setTokens(
        response.access,
        response.refresh,
        response.accessExpiration,
        response.refreshExpiration,
        response.user
      );

      await showToast({
        style: Toast.Style.Success,
        title: "Login Successful",
        message: `Welcome back, ${response.user.firstName}!`,
      });

      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Login Failed",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Login" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="username"
        title="Username"
        placeholder="Enter your username"
        value={username}
        onChange={setUsername}
      />
      <Form.PasswordField
        id="password"
        title="Password"
        placeholder="Enter your password"
        value={password}
        onChange={setPassword}
      />
      <Form.Description text="Login to access your Organizer account" />
    </Form>
  );
}
