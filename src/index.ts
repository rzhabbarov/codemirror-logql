import { LRLanguage, LanguageSupport } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { parser } from '@grafana/lezer-logql';
import { styleTags, tags as t } from '@lezer/highlight';
import { autocompletion } from '@codemirror/autocomplete';
import { CompletionConfig, createLogQLCompletionSource } from './completion';
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

interface LogQLExtensionConfig {
    completion?: CompletionConfig;
    linterEnabled?: boolean;
}

export function logqlExtension(config: LogQLExtensionConfig = {}): Extension {
    const {
        completion,
        linterEnabled,
    } = config;

    const extensions: Extension[] = [
        logqlSyntax,
    ];

    if (completion) {
        extensions.push(
          autocompletion({
              override: [createLogQLCompletionSource(completion)]
          })
        );
    }

    if (linterEnabled) {
        extensions.push([createLogQLLinter()]);
    }

    return new LanguageSupport(logqlSyntax, extensions);
}

export default logqlExtension;