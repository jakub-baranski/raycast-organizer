import { EmployeeRequest, REQUEST_STATUS, REQUEST_TYPE } from "../types";

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get status color for Raycast UI
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    [REQUEST_STATUS.ACCEPTED]: "#00FF00",
    [REQUEST_STATUS.PENDING]: "#FFA500",
    [REQUEST_STATUS.REJECTED]: "#FF0000",
    [REQUEST_STATUS.CANCELLED]: "#808080",
  };
  return statusColors[status] || "#000000";
}

// TODO: I don't like that...
export const REQUEST_TYPES = [
  { value: REQUEST_TYPE.REMOTE_WORK, title: "Remote Work" },
  { value: REQUEST_TYPE.REMOTE_ON_DEMAND, title: "Remote Work (OD)" },
  { value: REQUEST_TYPE.VACATION, title: "Vacation" },
  { value: REQUEST_TYPE.BUSINESS, title: "Business" },
  { value: REQUEST_TYPE.VACATION_ON_DEMAND, title: "Vacation on Demand" },
  { value: REQUEST_TYPE.CUSTOM_TIME, title: "Custom Time" },
];


export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    [REQUEST_STATUS.ACCEPTED]: "Accepted",
    [REQUEST_STATUS.PENDING]: "Pending",
    [REQUEST_STATUS.REJECTED]: "Rejected",
    [REQUEST_STATUS.CANCELLED]: "Cancelled",
  };
  return statusLabels[status] || status;
}

export function getRequestTypeLabel(type: string): string {
  return REQUEST_TYPES.filter((t) => t.value === type)[0]?.title || type;
}

export function getRequestTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    [REQUEST_TYPE.VACATION]: "🏖️",
    [REQUEST_TYPE.REMOTE_WORK]: "🏠",
    [REQUEST_TYPE.BUSINESS]: "💼",
    [REQUEST_TYPE.REMOTE_ON_DEMAND]: "🛋️",
    [REQUEST_TYPE.VACATION_ON_DEMAND]: "🌴",
    [REQUEST_TYPE.CUSTOM_TIME]: "⏰",
  };
  return iconMap[type] || "📝";
}

export function formatRequestTitle(request: EmployeeRequest): string {
  const typeLabel = getRequestTypeLabel(request.requestType);
  return `${getRequestTypeIcon(request.requestType)} ${typeLabel} - ${formatDate(request.startDate)} to ${formatDate(request.endDate)}`;
}

export function getRequestSubtitle(request: EmployeeRequest): string {
  const statusLabel = getStatusLabel(request.status);
  const projects = request.projects.map((p) => p.name).join(", ");
  return `Status: ${statusLabel}${projects ? ` | Projects: ${projects}` : ""}`;
}
