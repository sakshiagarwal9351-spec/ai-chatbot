
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "OpenAI API key is not configured."
        });
    }

    const { message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
            error: "Please enter a valid message."
        });
    }

    try {
        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4.1-mini",
                    input: message.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message || "OpenAI API request failed."
            });
        }

        const reply = data.output
            ?.flatMap(item => item.content || [])
            .filter(item => item.type === "output_text")
            .map(item => item.text)
            .join("\n");

        return res.status(200).json({
            reply: reply || "I couldn't generate a response."
        });

    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong. Please try again."
        });
    }
}
