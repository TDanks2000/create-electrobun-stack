import { createRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { APP_NAME } from "../../../shared/constants";
import type { AppEnvironment } from "../../../shared/types";
import { rpc } from "../lib/rpc";
import { rootRoute } from "./__root";

const Home = () => {
  const [environment, setEnvironment] = useState<AppEnvironment | null>(null);
  const [greeting, setGreeting] = useState("Waiting for Bun...");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [environmentResult, greetingResult] = await Promise.all([
        rpc.request.getEnvironment(null),
        rpc.request.greet({ name: APP_NAME }),
      ]);

      if (!mounted) {
        return;
      }

      setEnvironment(environmentResult);
      setGreeting(greetingResult.greeting);
      rpc.send.logToBun({ message: "Renderer loaded and called Bun RPC." });
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Electrobun + React</p>
        <h1>{APP_NAME}</h1>
        <p className="lede">{greeting}</p>
        <div className="grid">
          <div>
            <span>Router</span>
            <strong>TanStack Router</strong>
          </div>
          <div>
            <span>Styles</span>
            <strong>Tailwind CSS</strong>
          </div>
          <div>
            <span>RPC</span>
            <strong>Typed Electrobun RPC</strong>
          </div>
        </div>
        <dl className="facts">
          <div>
            <dt>Platform</dt>
            <dd>{environment?.platform ?? "Loading"}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{environment?.startedAt ?? "Loading"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};

export const indexRoute = createRoute({
  component: Home,
  getParentRoute: () => rootRoute,
  path: "/",
});
