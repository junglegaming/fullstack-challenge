import { afterEach, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { JSDOM } from "jsdom";

const { window } = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const globals = globalThis as Record<string, unknown>;
globals.window = window;
globals.document = window.document;

for (const key of Object.getOwnPropertyNames(window)) {
  if (!(key in globals)) {
    try {
      globals[key] = (window as unknown as Record<string, unknown>)[key];
    } catch {
    }
  }
}

globals.IS_REACT_ACT_ENVIRONMENT = true;

expect.extend(matchers as never);

afterEach(() => {
  cleanup();
});
