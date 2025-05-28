export async function checkOpenAIConnection(llmKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${llmKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data;

    const isGpt4oAvailable = models.some(
      (model: { id: string }) => model.id === "gpt-4o"
    );

    if (isGpt4oAvailable) {
      return "Model gpt-4o is available.";
    } else {
      throw new Error("Model gpt-4o is not available.");
    }
  } catch (error: any) {
    throw new Error(`Failed to connect to OpenAI: ${error.message || error}`);
  }
}
