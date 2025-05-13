function markdownToPlainText(markdown) {
    // 移除 Markdown 标题符号
    let plainText = markdown.replace(/^#+\s*/gm, '');

    // 移除 Markdown 链接格式
    plainText = plainText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 移除 Markdown 加粗和斜体符号
    plainText = plainText.replace(/\*\*([^*]+)\*\*/g, '$1');
    plainText = plainText.replace(/\*([^*]+)\*/g, '$1');

    // 移除 Markdown 代码块符号
    plainText = plainText.replace(/`([^`]+)`/g, '$1');

    // 移除 Markdown 分割线
    plainText = plainText.replace(/^-{3,}/gm, '');

    // 移除多余的空行
    plainText = plainText.replace(/\n{3,}/g, '\n\n');

    return plainText.trim();
}

// 示例用法
const markdown = `以下是整理好的热门文章资讯，已翻译为简体中文： 

--- 

### 1. **《我的GPT造型师教会我如何更好地提示》** 
**文章介绍**  
本文探讨了大型语言模型（LLM）的奇怪行为，并通过作者与GPT造型师的互动，揭示了如何通过优化提示来更好地利用这些模型。文章深入分析了LLM的工作原理和局限性。 

**文章链接**  
\`https://towardsdatascience.com/what-my-gpt-stylist-taught-me-about-prompting-better-inside-the-strange-behavior-of-llms/\`   
**作者**  
Arielle Caron  
**发布时间**  
2025年5月9日 

--- 

### 2. **《AccentFold论文回顾：非洲ASR领域最重要的研究之一》** 
**文章介绍**  
文章回顾了AccentFold论文，该研究解决了当前自动语音识别（ASR）系统在处理非洲口音时的局限性。作者详细分析了论文的创新点和实际应用价值。 

**文章链接**  
\`https://towardsdatascience.com/a-review-of-accentfold-one-of-the-most-important-papers-on-african-asr/\`   
**作者**  
Zaynab Awofeso  
**发布时间**  
2025年5月9日 

--- 

### 3. **《欺骗性数据的危险（第二部分）：基础比例与糟糕的统计》》** 
**文章介绍**  
本文是作者关于欺骗性数据系列的第二部分，重点讨论了相关性、基础比例、摘要统计和不确定性如何误导人们。文章通过生动的例子和图表，帮助读者理解统计陷阱。 

**文章链接**  
\`https://towardsdatascience.com/the-dangers-of-deceptive-data-part-2-base-proportions-and-bad-statistics/\`   
**作者**  
Murtaza Ali  
**发布时间**  
2025年5月8日 

--- 

希望这些资讯对您有帮助！如果需要进一步了解某篇文章，请随时告诉我。`;

console.log(markdownToPlainText(markdown));