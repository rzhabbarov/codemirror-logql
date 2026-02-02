import { Completion, CompletionContext } from '@codemirror/autocomplete';

export interface CompletionConfig {
  getLabels(): Promise<string[]> | string[];
  getValues(label?: string): Promise<string[]> | string[];
}

export const STATIC_COMPLETIONS: Completion[] = [
  { label: 'json', type: 'keyword', info: 'Parse JSON logs' },
  { label: 'logfmt', type: 'keyword', info: 'Parse logfmt logs' },
  { label: 'pattern', type: 'keyword', info: 'Parse with pattern' },
  { label: 'regexp', type: 'keyword', info: 'Parse with regex' },
  
  { label: 'line_format', type: 'function', info: 'Format log lines', apply: 'line_format \'\'' },
  { label: 'label_format', type: 'function', info: 'Rename/format labels', apply: 'label_format ' },
  
  { label: 'rate', type: 'function', info: 'Calculate events per second' },
  { label: 'count', type: 'function', info: 'Count log entries' },
  { label: 'sum', type: 'function' },
  { label: 'min', type: 'function' },
  { label: 'max', type: 'function' },
  { label: 'avg', type: 'function' },
  { label: 'stddev', type: 'function' },
  { label: 'stdvar', type: 'function' },
  { label: 'bottomk', type: 'function', apply: 'bottomk(5, ' },
  { label: 'topk', type: 'function', apply: 'topk(5, ' },
  
  { label: 'by', type: 'keyword', apply: 'by (' },
  { label: 'without', type: 'keyword', apply: 'without (' },
  
  { label: '|=', type: 'operator', info: 'Line contains string' },
  { label: '!=', type: 'operator', info: 'Line does not contain string' },
  { label: '|~', type: 'operator', info: 'Line matches regex' },
  { label: '!~', type: 'operator', info: 'Line does not match regex' },
  
  { label: '[1m]', type: 'time', info: '1 minute range' },
  { label: '[5m]', type: 'time' },
  { label: '[15m]', type: 'time' },
  { label: '[1h]', type: 'time' },
  { label: '[1d]', type: 'time' }
];

export function createLogQLCompletionSource(config: CompletionConfig) {
  return async (context: CompletionContext) => {
    const { state, pos } = context;
    const textBefore = state.sliceDoc(0, pos);
    const lineBefore = textBefore.split('\n').pop() || '';
    const lastOpenBrace = textBefore.lastIndexOf('{');
    const lastCloseBrace = textBefore.lastIndexOf('}');
    const isInsideBraces = lastOpenBrace > lastCloseBrace;
    
    if (isInsideBraces) {
      const textInBraces = textBefore.slice(lastOpenBrace + 1);
      const hasEquals = textInBraces.includes('=');
      const hasComma = textInBraces.includes(',');
      
      if (!hasEquals || lineBefore.trim().endsWith(',') || lineBefore.trim().endsWith('{')) {
        console.log('Fetching labels...');
        const labels = await config.getLabels();
        
        return {
          from: pos,
          options: labels.map(label => ({
            label,
            type: 'label',
            info: 'Label from Loki',
            apply: `${label}=`
          }))
        };
      }
      
      const equalsMatch = lineBefore.match(/(\w+)=$/);
      if (equalsMatch) {
        const labelName = equalsMatch[1];
        console.log('Fetching values for:', labelName);
        const values = await config.getValues(labelName);
        
        return {
          from: pos,
          options: values.map(value => ({
            label: value,
            type: 'value',
            info: `Value for ${labelName}`,
            apply: `"${value}"`
          }))
        };
      }
    }
    
    const word = context.matchBefore(/\w*/);
    if (word) {
      return {
        from: word.from,
        options: STATIC_COMPLETIONS
      };
    }
    
    return null;
  };
}