#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mermaid 支持的 HTML 代码
const mermaidScript = `<!-- Mermaid Support -->
<script src="https://unpkg.com/mermaid@10/dist/mermaid.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });

    // 处理 mermaid 代码块
    const mermaidBlocks = document.querySelectorAll('pre.prettyprint.source.lang-mermaid code');
    mermaidBlocks.forEach((block, index) => {
      const mermaidCode = block.textContent;
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = mermaidCode;
      mermaidDiv.id = 'mermaid-diagram-' + index;

      // 替换代码块
      block.parentElement.parentElement.replaceChild(mermaidDiv, block.parentElement);
    });

    // 重新初始化 Mermaid
    mermaid.init();
  });
</script>
</head>`;

function addMermaidSupport() {
  const apiDir = path.join(__dirname, '../doc/api');

  if (!fs.existsSync(apiDir)) {
    console.log('API 文档目录不存在');
    return;
  }

  // 查找所有 HTML 文件
  const htmlFiles = glob.sync(path.join(apiDir, '*.html'));

  htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');

    // 检查是否包含 mermaid 代码块
    if (content.includes('lang-mermaid')) {
      // 在 </head> 标签前插入 Mermaid 脚本
      content = content.replace('</head>', mermaidScript);

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`已为 ${path.basename(filePath)} 添加 Mermaid 支持`);
    }
  });
}

if (require.main === module) {
  addMermaidSupport();
}

module.exports = addMermaidSupport;