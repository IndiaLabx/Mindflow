
## 2025-03-12 - [Lazy Loading Large Libraries in React Hooks]
**Learning:** In Vite/React architectures, passing a statically imported function (that internally requires massive dependencies like `jspdf` and `html2canvas`) into a custom hook (like `usePDFGenerator`) causes those dependencies to be bundled eagerly at the component level, even if the hook only calls the function on demand.
**Action:** Instead of passing the generator function directly, modify the hook signature to accept an asynchronous factory function `() => Promise<GeneratorFunction>`. At the call site, use `() => import('./path').then(m => m.generatorFunction)`. Additionally, ensure the generator function itself dynamically imports its heavy third-party libraries.
