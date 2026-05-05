import { cancel, isCancel, text } from "@clack/prompts";

export const promptProjectName = async (): Promise<string> => {
  const answer = await text({
    message: "Project name",
    placeholder: "my-electrobun-app",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Project name is required.";
      }

      return undefined;
    },
  });

  if (isCancel(answer)) {
    cancel("Scaffold cancelled.");
    process.exit(0);
  }

  return answer.trim();
};
