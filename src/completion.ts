import { Completion, CompletionContext } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { labelCache, valueCache } from './utils';

export interface CompletionConfig {
  lokiUrl: string;
  cacheDuration: number;
  fetchOptions?: RequestInit;
}

async function fetchLabels(config: CompletionConfig): Promise<string[]> {
  const { lokiUrl, cacheDuration, fetchOptions } = config;
  const cacheKey = lokiUrl;
  const now = Date.now();
  
  if (labelCache.has(cacheKey)) {
    const entry = labelCache.get(cacheKey)!;
    if (now - entry.timestamp < cacheDuration) {
      return entry.data;
    }
  }
  
  try {
    const response = await fetch(`${lokiUrl}/loki/api/v1/labels`, fetchOptions);
    const { data } = await response.json();
    
    labelCache.set(cacheKey, {
      timestamp: now,
      data
    });
    
    return data;
  } catch (error) {
    console.error('Loki labels fetch error:', error);
    return [];
  }
}

async function fetchLabelValues(
  config: CompletionConfig,
  label: string
): Promise<string[]> {
  const { lokiUrl, cacheDuration, fetchOptions } = config;
  const cacheKey = lokiUrl;
  const now = Date.now();
  
  if (!valueCache.has(cacheKey)) {
    valueCache.set(cacheKey, new Map());
  }
  const urlCache = valueCache.get(cacheKey)!;
  
  if (urlCache.has(label)) {
    const entry = urlCache.get(label)!;
    if (now - entry.timestamp < cacheDuration) {
      return entry.data;
    }
  }
  
  try {
    const response = await fetch(
      `${lokiUrl}/loki/api/v1/label/${label}/values`,
      fetchOptions
    );
    const { data } = await response.json();
    
    urlCache.set(label, {
      timestamp: now,
      data
    });
    
    return data;
  } catch (error) {
    console.error('Loki values fetch error:', error);
    return [];
  }
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
    const tree = syntaxTree(state);
    const node = tree.resolveInner(pos, -1);
    
    const isInLabelMatcher = node.name === 'LabelMatcher';
    const isInLabelValue = node.name === 'String';
    const isInPipeline = node.name === 'PipelineExpr';
    const isAfterOperator = node.prevSibling?.name === 'Operator';
    
    if (isInLabelMatcher) {
      const labels = await fetchLabels(config);
      
      return {
        from: node.from,
        options: labels.map(label => ({
          label,
          type: 'label',
          info: 'Label from Loki',
          apply: `${label}=`
        }))
      };
    }
    
    if (isInLabelValue && isAfterOperator) {
      const labelMatcher = node.parent;
      if (labelMatcher?.name === 'LabelMatcher') {
        const labelNameNode = labelMatcher.getChild('LabelName');
        if (labelNameNode) {
          const labelName = state.sliceDoc(labelNameNode.from, labelNameNode.to);
          const values = await fetchLabelValues(config, labelName);
          
          return {
            from: node.from,
            options: values.map(value => ({
              label: `'${value}'`,
              type: 'value',
              info: `Value for ${labelName}`
            }))
          };
        }
      }
    }
    
    if (isInPipeline) {
      return {
        from: node.from,
        options: STATIC_COMPLETIONS.filter(c => 
          c.type === 'keyword' || c.type === 'function'
        )
      };
    }
    
    const word = context.matchBefore(/\w*/);
    if (!word) return null;
    
    return {
      from: word.from,
      options: STATIC_COMPLETIONS
    };
  };
}