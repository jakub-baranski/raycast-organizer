/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API URL - Base API URL */
  "apiUrl"?: string,
  /** Use Drafts - Enable drafts for forms */
  "useDrafts": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `login` command */
  export type Login = ExtensionPreferences & {}
  /** Preferences accessible in the `logout` command */
  export type Logout = ExtensionPreferences & {}
  /** Preferences accessible in the `my-requests` command */
  export type MyRequests = ExtensionPreferences & {}
  /** Preferences accessible in the `create-request` command */
  export type CreateRequest = ExtensionPreferences & {}
  /** Preferences accessible in the `log-time` command */
  export type LogTime = ExtensionPreferences & {}
  /** Preferences accessible in the `view-time-logs` command */
  export type ViewTimeLogs = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `login` command */
  export type Login = {}
  /** Arguments passed to the `logout` command */
  export type Logout = {}
  /** Arguments passed to the `my-requests` command */
  export type MyRequests = {}
  /** Arguments passed to the `create-request` command */
  export type CreateRequest = {}
  /** Arguments passed to the `log-time` command */
  export type LogTime = {}
  /** Arguments passed to the `view-time-logs` command */
  export type ViewTimeLogs = {}
}

