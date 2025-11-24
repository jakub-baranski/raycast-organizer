import { Action, ActionPanel, List, showToast, Toast, Icon, Color } from "@raycast/api";
import React, { useEffect, useState } from "react";
import { ApiClient } from "./services/api";
import { EmployeeRequest, REQUEST_STATUS, RequestWarning } from "./types";
import { formatDate, formatRequestTitle, getRequestSubtitle, getStatusLabel } from "./utils/formatting";
import { ERROR_MESSAGES } from "./constants";

export default function MyRequestsCommand() {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setIsLoading(true);

    try {
      const apiClient = new ApiClient();
      const data = await apiClient.getMyRequests();
      setRequests(data);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Fetch Requests",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelRequest(request: EmployeeRequest) {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Canceling Request...",
      });

      const apiClient = new ApiClient();
      await apiClient.cancelRequest(request.id);

      await showToast({
        style: Toast.Style.Success,
        title: "Request Canceled",
        message: `Request #${request.id} has been canceled`,
      });

      await fetchRequests();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Cancel Request",
        message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      });
    }
  }

  function getStatusIcon(status: string): Icon {
    const statusMap: Record<string, Icon> = {
      [REQUEST_STATUS.ACCEPTED]: Icon.CheckCircle,
      [REQUEST_STATUS.PENDING]: Icon.Clock,
      [REQUEST_STATUS.DECLINED]: Icon.XMarkCircle,
      [REQUEST_STATUS.CANCELLED]: Icon.MinusCircle,
    };
    return statusMap[status] || Icon.Circle;
  }

  function getStatusColor(status: string): Color {
    const colorMap: Record<string, Color> = {
      [REQUEST_STATUS.ACCEPTED]: Color.Green,
      [REQUEST_STATUS.PENDING]: Color.Orange,
      [REQUEST_STATUS.DECLINED]: Color.Red,
      [REQUEST_STATUS.CANCELLED]: Color.SecondaryText,
    };
    return colorMap[status] || Color.PrimaryText;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search requests...">
      {requests.length === 0 && !isLoading ? (
        <List.EmptyView icon={Icon.Document} title="No Requests Found" description="You don't have any requests yet" />
      ) : (
        requests.map((request) => (
          <List.Item
            key={request.id}
            icon={{ source: getStatusIcon(request.status), tintColor: getStatusColor(request.status) }}
            title={formatRequestTitle(request)}
            subtitle={getRequestSubtitle(request)}
            accessories={[
              {
                icon: request.warnings.length > 0 ? { source: Icon.Warning, tintColor: Color.Orange } : undefined,
              },
              { text: formatDate(request.created) },
            ]}
            actions={
              <ActionPanel>
                <Action.Push title="View Details" icon={Icon.Eye} target={<RequestDetails request={request} />} />
                {request.status === REQUEST_STATUS.PENDING && (
                  <Action
                    title="Cancel Request"
                    icon={Icon.XMarkCircle}
                    style={Action.Style.Destructive}
                    onAction={() => handleCancelRequest(request)}
                  />
                )}
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={fetchRequests} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

function RequestDetails({ request }: { request: EmployeeRequest }) {
  const formatWarning = (w: RequestWarning) => (w.project?.trim() ? `${w.warningType} — ${w.project}` : w.warningType);

  return (
    <List>
      <List.Item title="Status" subtitle={getStatusLabel(request.status)} />
      <List.Item title="Start Date" subtitle={formatDate(request.startDate)} />
      <List.Item title="End Date" subtitle={formatDate(request.endDate)} />
      {request.startTime && <List.Item title="Start Time" subtitle={request.startTime} />}
      {request.endTime && <List.Item title="End Time" subtitle={request.endTime} />}
      {request.note && <List.Item title="Note" subtitle={request.note} />}
      {request.checkBy && <List.Item title="Checked By" subtitle={request.checkBy} />}
      {request.adminNote && <List.Item title="Admin Note" subtitle={request.adminNote} />}
      <List.Item title="Created At" subtitle={formatDate(request.created)} />
      {request.projects.length > 0 && (
        <List.Item title="Projects" subtitle={request.projects.map((p) => p.name).join(", ")} />
      )}

      {request.warnings.length > 0 && (
        <List.Item title="Warnings" subtitle={request.warnings.map(formatWarning).join("; ")} />
      )}
    </List>
  );
}
