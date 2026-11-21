
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is missing in Vercel.");
    }

    const { message, messages, prompt, query } = req.body || {};

    let chatMessages = [];

    if (Array.isArray(messages)) {
      chatMessages = messages
        .filter(item =>
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        )
        .map(item => ({
          role: item.role,
          content: item.content
        }));
    } else {
      const userMessage = message || prompt || query;

      if (typeof userMessage === "string" && userMessage.trim()) {
        chatMessages = [
          {
            role: "user",
            content: userMessage.trim()
          }
        ];
      }
    }

    if (chatMessages.length === 0) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are ChatBuddy, a friendly and helpful AI assistant. Give clear, useful and easy-to-understand answers."
            },
            ...chatMessages
          ],
          temperature: 0.7,
          max_completion_tokens: 1024
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Groq API request failed."
      );
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("No response received from Groq.");
    }

    return res.status(200).json({
      reply: reply,
      response: reply,
      message: reply
    });

  } catch (error) {
    console.error("Chat API Error:", error);

    return res.status(500).json({
      error: error.message || "Something went wrong."
    });
  }
}
