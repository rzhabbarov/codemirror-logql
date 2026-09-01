# codemirror-logql

A lightweight **LogQL language support extension for CodeMirror 6**, designed for Grafana Loki–based editors but usable in any CodeMirror environment.

This package provides syntax highlighting, autocompletion, and basic linting for
[LogQL](https://grafana.com/docs/loki/latest/logql/) — the query language used by Grafana Loki.

---

## Features

- ✅ LogQL syntax highlighting (powered by `@grafana/lezer-logql`)
- ✅ Context-aware autocompletion
  - Built-in keywords, operators, functions, and time ranges
  - Dynamic label names and values via async providers
- ✅ Built-in linter
- ✅ Fully compatible with CodeMirror 6
- ✅ No hard dependency on Grafana SDK

---

## Installation

```bash
npm install codemirror-logql
```
or
```bash
yarn add codemirror-logql
```
or
```bash
pnpm add codemirror-logql
```

---

## Basic usage
```typescript
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { logqlExtension } from "codemirror-logql";

const view = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
      logqlExtension()
    ]
  }),
  parent: document.body
});
```

## Autocompletion
To enable LogQL autocompletion, provide a completion configuration.
```typescript
interface CompletionConfig {
  getLabels(): Promise<string[]> | string[];
  getValues(label?: string): Promise<string[]> | string[];
}
```
These functions can fetch data from any source
(e.g. Grafana Loki HTTP API, internal services, mock data).

## Example (Grafana Loki API)
```typescript
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { logqlExtension } from "codemirror-logql";

const getLabels = async (): Promise<string[]> => {
  const response = await fetch('/grafanaApi/.../resources/labels');
  const json = await response.json();
  return json.data;
};

const getValues = async (label: string): Promise<string[]> => {
  const response = await fetch(
    `/grafanaApi/.../resources/label/${label}/values`
  );
  const json = await response.json();
  return json.data;
};

const view = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
      logqlExtension({
        completion: {
          getLabels,
          getValues
        }
      })
    ]
  }),
  parent: document.getElementById("logql-input-container")!
});
```

## Linter
Enable the built-in linter with:
```typescript
logqlExtension({
  linterEnabled: true
});
```

## Peer Dependencies
This package relies on CodeMirror 6 packages provided by the host application:
* **@codemirror/state**
* **@codemirror/view** 
* **@codemirror/language**
* **@codemirror/autocomplete**
* **@codemirror/lint**
* **@lezer/highlight**
* **@lezer/lr**
