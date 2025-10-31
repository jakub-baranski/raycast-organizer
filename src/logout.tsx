import { showToast, Toast, popToRoot, confirmAlert, Alert } from "@raycast/api";
import { AuthService } from "./services/auth";
import { ERROR_MESSAGES } from "./constants";

export default async function LogoutCommand() {
  const confirmed = await confirmAlert({
    title: "Logout",
    message: "Are you sure you want to logout?",
    primaryAction: {
      title: "Logout",
      style: Alert.ActionStyle.Destructive,
    },
  });

  if (confirmed) {
    try {
      await AuthService.clearTokens();

      await showToast({
        style: Toast.Style.Success,
        title: "Logged Out",
        message: "You have been successfully logged out",
      });

      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Logout Failed",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    }
  }
}
