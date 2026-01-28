interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  
  try {
    // 1. Get Gemini config from DB
    const config = await DB.prepare(
      "SELECT apiKey, model FROM gemini_config WHERE id = 'default'"
    ).first();

    if (!config || !config.apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured. Please go to Settings." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { apiKey, model } = config as { apiKey: string, model: string };

    // 2. Get recent logs to provide context for the report
    const { results: logs } = await DB.prepare(
      "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100"
    ).all();

    if (logs.length === 0) {
      return new Response(JSON.stringify({ error: "No logs found to generate report." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const logsContext = logs.map(l => {
      const tags = l.tags ? JSON.parse(l.tags as string) : [];
      return `[${new Date(l.timestamp as number).toLocaleString()}] 类型:${l.type} 强度:L${l.intensity} 内容:${l.content} 标签:${tags.join(',')}`;
    }).join('\n');

    // 3. Construct the prompt
    const prompt = `你现在是“心理共和国”的首席政治分析师和国策顾问。
“心理共和国”是一个模拟个人内心世界的虚拟国家，每一条“震动日志”都代表一次情绪波动或心理事件。

以下是最近的“国民生活观察日志”（震动日志）：
${logsContext}

请基于这些日志，为心理共和国撰写一份《国家综合实力评估报告》。
报告需要包含核心指标评分、议会风云、居民吐槽、战略展望和AI吐槽。

请严格按以下 JSON 格式返回，不要包含任何其他文字：
{
  "title": "string (报告标题，包含年份和周数)",
  "metrics": {
    "gdp": "string (如 '5.2% (多巴胺同比)')",
    "inflation": "string (如 '8.4% (情绪波动)')",
    "stability": number (0-100),
    "happiness": number (0-100)
  },
  "indicators": {
    "politics": { "name": "政治生态", "score": number, "reason": "string" },
    "admin": { "name": "行政效能", "score": number, "reason": "string" },
    "economy": { "name": "经济情况", "score": number, "reason": "string" },
    "gini": { "name": "基尼系数", "score": number, "reason": "string" },
    "debt": { "name": "债务杠杆", "score": number, "reason": "string" },
    "defense": { "name": "国防建设", "score": number, "reason": "string" },
    "diplomacy": { "name": "外交关系", "score": number, "reason": "string" }
  },
  "parliament": {
    "rulingParty": "string",
    "opposition": "string",
    "recentScandals": ["string", "string"]
  },
  "residents": {
    "brain": "string",
    "heart": "string",
    "liver": "string"
  },
  "strategicOutlook": ["string", "string", "string"],
  "roast": "string (AI吐槽：犀利、幽默、毒舌但有智慧)"
}`;

    // 4. Call Gemini API via Cloudflare AI Gateway (OpenAI compat)
    const gatewayUrl = "https://gateway.ai.cloudflare.com/v1/2d3995707c5e4f36a3f79715ec8c489d/mygateway/compat/chat/completions";
    
    // Ensure model name is in the format expected by AI Gateway for Google Studio
    // If user selected 'gemini-1.5-flash', we might need 'google-ai-studio/gemini-1.5-flash'
    const fullModelName = model.startsWith('google-ai-studio/') ? model : `google-ai-studio/${model}`;

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: fullModelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      return new Response(JSON.stringify({ error: errorData.error?.message || "Cloudflare AI Gateway call failed" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json() as any;
    const resultText = data.choices[0].message.content;
    
    // Parse the JSON from the response
    const reportData = JSON.parse(resultText);

    return new Response(JSON.stringify(reportData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
