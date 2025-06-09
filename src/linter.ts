import { syntaxTree } from '@codemirror/language';
import { Diagnostic, linter } from '@codemirror/lint';

export const createLogQLLinter = () => {
    return linter(view => {
        const diagnostics: Diagnostic[] = [];
        const tree = syntaxTree(view.state);
        const text = view.state.doc.toString();
        
        if (text.trim() === '') {
            return diagnostics;
        }
        
        let quoteCount = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '"') quoteCount++;
        }
        
        if (quoteCount % 2 !== 0) {
            diagnostics.push({
                from: 0,
                to: text.length,
                severity: 'error',
                message: 'Unclosed double quote',
            });
        }
        
        const bracketStack: {char: string, pos: number}[] = [];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{' || text[i] === '(' || text[i] === '[') {
                bracketStack.push({char: text[i], pos: i});
            } else if (text[i] === '}' || text[i] === ')' || text[i] === ']') {
                if (bracketStack.length === 0) {
                    diagnostics.push({
                        from: i,
                        to: i + 1,
                        severity: 'error',
                        message: `Unexpected closing bracket '${text[i]}'`,
                    });
                } else {
                    const last = bracketStack.pop()!;
                    if (
                        (last.char === '{' && text[i] !== '}') ||
                        (last.char === '(' && text[i] !== ')') ||
                        (last.char === '[' && text[i] !== ']')
                    ) {
                        diagnostics.push({
                            from: last.pos,
                            to: last.pos + 1,
                            severity: 'error',
                            message: `Mismatched bracket '${last.char}'`,
                        });
                    }
                }
            }
        }
        
        bracketStack.forEach(b => {
            diagnostics.push({
                from: b.pos,
                to: b.pos + 1,
                severity: 'error',
                message: `Unclosed bracket '${b.char}'`,
            });
        });
        
        tree.iterate({
            enter(node) {
                if (node.type.isError) {
                    const errorText = view.state.sliceDoc(node.from, node.to);
                    diagnostics.push({
                        from: node.from,
                        to: node.to,
                        severity: 'error',
                        message: `Syntax error: ${errorText}`,
                    });
                }
            }
        });
        
        const hasEmptySelector = text.includes('{}');
        if (hasEmptySelector) {
            const start = text.indexOf('{}');
            diagnostics.push({
                from: start,
                to: start + 2,
                severity: 'warning',
                message: 'Empty selector {} will match all logs, which may be inefficient',
            });
        }
        
        return diagnostics;
    });
};