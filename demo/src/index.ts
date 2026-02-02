import { EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { logqlExtension } from "codemirror-logql"

const initSimpleLoqQlInput = () => {
    const logQlInputContainer = document.getElementById("logql-input-container");

    if (!logQlInputContainer) {
        return;
    }

    const getLabels = async (): Promise<string[]> => {
      try {
        const response = await fetch('/grafanaApi/datasources/uid/ac4000ca-1959-45f5-aa45-2bd0898f7026/resources/labels');

        const json = await response.json();

        return json.data;

      } catch (e) {
        console.error('Labels loading error: ', e);

        return [];
      }
    }

    const getValues = async (label: string): Promise<string[]> => {
      try {
        const response = await fetch(`/grafanaApi/datasources/uid/ac4000ca-1959-45f5-aa45-2bd0898f7026/resources/label/${label}/values`);

        const json = await response.json();

        return json.data;

      } catch (e) {
        console.error(`Values for label "${label}" loading error: `, e);

        return [];
      }
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          logqlExtension({
            completion: {
              getLabels,
              getValues
            },
            linterEnabled: true,
          })
        ]
      }),
      parent: logQlInputContainer
    });
}


document.addEventListener('DOMContentLoaded', (event) => {
    initSimpleLoqQlInput();
});

