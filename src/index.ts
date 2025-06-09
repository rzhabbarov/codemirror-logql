import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { Extension, EditorState } from '@codemirror/state';
import { parser } from '@grafana/lezer-logql';
import { styleTags, tags as t } from '@lezer/highlight';
import { autocompletion } from '@codemirror/autocomplete';
import { createLogQLCompletionSource, STATIC_COMPLETIONS } from './completion';
import { clearCache, clearLabelCache, clearValueCache } from './utils';
import { createLogQLLinter } from './linter';

export const logqlSyntax = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                Identifier: t.variableName,
                String: t.string,
                Number: t.number,
                Duration: t.number,
                Comment: t.lineComment,
                
                'Eq Neq Re Eq ReNeq': t.compareOperator,
                'And Or': t.logicOperator,
                'Add Sub Mul Div Mod Pow': t.arithmeticOperator,
                
                'Unwrap rate count sum min max avg stddev stdvar bottomk topk': t.keyword,
                'by without': t.keyword,
                'json logfmt pattern regexp': t.keyword,
                'line_format label_format': t.keyword,
                
                'rate count_over_time sum_over_time avg_over_time': t.function(t.variableName),
                
                'LabelName': t.labelName,
                'LabelValue': t.string,
                
                '( )': t.paren,
                '[ ]': t.squareBracket,
                '{ }': t.brace
            })
        ]
    }),
    languageData: {
        closeBrackets: { brackets: ['(', '[', '{', '\'', '"', '`'] },
        commentTokens: { line: '#' },
},
});

export interface LogQLExtensionConfig {
  lokiUrl: string;
  enableCompletion?: boolean;
  cacheDuration?: number;
  fetchOptions?: RequestInit;
}

export function logqlExtension(config: LogQLExtensionConfig): Extension {
  const {
    lokiUrl,
    enableCompletion = true,
    cacheDuration = 300_000,
    fetchOptions
  } = config;
  
  const extensions: Extension[] = [
    logqlSyntax,
  ];
  
  if (enableCompletion) {
    extensions.push(
      autocompletion({
        override: [createLogQLCompletionSource({
          lokiUrl,
          cacheDuration,
          fetchOptions
        })]
      })
    );
  }

  extensions.push([createLogQLLinter()]);
  
  return new LanguageSupport(logqlSyntax, extensions);

}

export { 
  STATIC_COMPLETIONS,
  clearCache,
  clearLabelCache,
  clearValueCache
};

export default logqlExtension;