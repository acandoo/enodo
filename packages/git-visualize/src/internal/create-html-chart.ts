import { JSDOM } from 'jsdom'

import * as Plot from '@observablehq/plot'

export const createHTMLChart = (options?: Plot.PlotOptions) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #ddddef;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #222;
      margin: 0;
      padding: 2em;
    }
    figure {
      margin: 0 auto;
      box-shadow: 0 2px 12px #aaa4;
      border-radius: 8px;
      background: #ddddef;
      padding: 1em;
    }
    text {
      font-size: 1.1em;
      fill: #222;
    }
    .plot-title, .plot-subtitle {
      text-anchor: middle;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${
      Plot.plot({
          ...options,
          document: new JSDOM('').window.document
      }).outerHTML
  }
</body>
</html>
`
