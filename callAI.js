export const callAI = async (prompt, text) => {
  try {
    const response = await fetch("https://steeldocs-ai.onrender.com/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI server error");
    }

    return data.result;
  } catch (err) {
    console.error("Error calling AI backend:", err);
    throw err;
  }
};