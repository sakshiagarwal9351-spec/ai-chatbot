

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "Gemini API key is not configured."
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
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: message.trim() }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);

            return res.status(response.status).json({
                error: data.error?.message || "Gemini API request failed."
            });
        }

        const reply = data.candidates
            ?.flatMap(candidate => candidate.content?.parts || [])
            .filter(part => part.text)
            .map(part => part.text)
            .join("\n");

        return res.status(200).json({
            reply: reply || "I couldn't generate a response."
        });

    } catch (error) {
        console.error("Server error:", error);

        return res.status(500).json({
            error: "Something went wrong. Please try again."
        });
    }
}
