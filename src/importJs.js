
import { decode, encode } from 'js-base64';
import { globalCached, fetch, innumerable, requireFromStr, DEFAULT_TIMEOUT } from './utils';

const scopeNameRegx = /\(import-remote\)\/((?:@[^/]+\/[^/]+)|(?:[^@][^/]+))/;

function importJs(href, { 
  cached = globalCached, timeout = DEFAULT_TIMEOUT, global, sync, scopeName, host, devtool, nocache, beforeSource 
} = {}) {
  if (!cached._js) innumerable(cached, '_js', {});
  if (cached._js[href]) return cached._js[href];

  return cached._js[href] = new Promise((resolve, reject) => {
    fetch(href, { timeout, sync, nocache, beforeSource }).then(source => {
      try {
        if (devtool && (typeof devtool === 'string' && /^(eval|inline)/.test(String(devtool))) && host && source) {
          if (!/\/$/.test(host)) host += '/';
          const isEval = /^eval/.test(String(devtool));
          if (isEval) {
            source = source.replace(/\/\/# sourceURL=\[module\]\\n/g, '\\n');
            source = source.replace(
              /\/\/# sourceURL=(webpack-internal:\/\/\/[A-z/\-_0-9.@[\]]+)\\n/g, 
              (m, p1) => '\\n' // `//# sourceURL=${host}__get-internal-source?fileName=${encodeURIComponent(p1)}\\n`
            );
          }
          if (host) {
            const regx = new RegExp(`\\/\\/# sourceMappingURL=data:application\\/json;charset=utf-8;base64,([0-9A-z]+={0,2})${
              isEval ? '\\\\n' : '(?:\\n|$)'
            }`, 'g');
            source = source.replace(regx, 
              (m, p1) => {
                let sourcemap = JSON.parse(decode(p1));
                sourcemap.sources = sourcemap.sources.map(src => {
                  if (scopeName) {
                    let [, srcScopeName] = src.match(scopeNameRegx) || [];
                    if (srcScopeName && srcScopeName !== scopeName) {
                      src = src.replace(scopeNameRegx, `(import-remote)/[${scopeName}]`);
                    }
                  }
                  return host + src;
                });
                return `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${encode(JSON.stringify(sourcemap))}${
                  isEval ? '\\n' : m.endsWith('\n') ? '\n' : ''
                }`;
              });
          }
        }
        if (beforeSource) source = beforeSource(source, 'js', href);
        const result = requireFromStr(source, { global });
        resolve(result);
      } catch (err) {
        if (err && !err.url) err.url = href;
        console.error(err, source); 
        reject(err); 
      }
    }).catch(reject);
  });
}

export default importJs;

