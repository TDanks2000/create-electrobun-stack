export const collapseStringArrays = (json: string): string =>
  json.replace(
    /^([ \t]+"(?:[^"\\]|\\.)+": )\[\n((?:[ \t]+"(?:[^"\\]|\\.)*"[,]?\n)+)[ \t]*\]([,]?)/gm,
    (match: string, prefix: string, items: string, trailing: string) => {
      const itemList = items
        .trim()
        .split("\n")
        .map((item) => item.trim().replace(/,$/, ""));
      const replacement = `${prefix}[${itemList.join(", ")}]${trailing}`;

      if (replacement.length > 80) {
        return match;
      }

      return replacement;
    },
  );
