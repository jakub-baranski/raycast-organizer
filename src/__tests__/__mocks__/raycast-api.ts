/* eslint-disable @typescript-eslint/no-explicit-any */
export const LocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  allItems: jest.fn(),
  clear: jest.fn(),
};

export const getPreferenceValues = jest.fn(() => ({
  apiUrl: "https://api.test.com",
}));

export const showToast = jest.fn();

export const popToRoot = jest.fn();

export const confirmAlert = jest.fn();

export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
    Animated: "animated",
  },
};

export const Alert = {
  ActionStyle: {
    Destructive: "destructive",
    Default: "default",
    Cancel: "cancel",
  },
};

export const Action = {
  SubmitForm: jest.fn(),
  Push: jest.fn(),
  CopyToClipboard: jest.fn(),
};

export const ActionPanel = jest.fn();

export const Form = {
  TextField: jest.fn(),
  PasswordField: jest.fn(),
  DatePicker: jest.fn(),
  Dropdown: {
    Item: jest.fn(),
  },
  TextArea: jest.fn(),
  Separator: jest.fn(),
  Description: jest.fn(),
};

export const List = {
  Item: jest.fn(),
  EmptyView: jest.fn(),
};

export const Icon = {
  CheckCircle: "check-circle",
  Clock: "clock",
  XMarkCircle: "x-mark-circle",
  MinusCircle: "minus-circle",
  Circle: "circle",
  Eye: "eye",
  ArrowClockwise: "arrow-clockwise",
  Document: "document",
};

export const Color = {
  Green: "green",
  Orange: "orange",
  Red: "red",
  SecondaryText: "secondary-text",
  PrimaryText: "primary-text",
};
