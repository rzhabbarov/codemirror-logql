import { Extension } from '@codemirror/state';

export interface LogQlExtensionConfig {
    lokiUrl?: string,
    enableCompletion?: boolean,
    themeExtension?: Extension,
    optionClass?: string;
}