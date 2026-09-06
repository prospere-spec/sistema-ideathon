const { spawn } = require("node:child_process");
const nextBin = require.resolve("next/dist/bin/next");

const production = process.argv.includes("--production");
const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== "--production");
const environment = { ...process.env, DEMO_MODE: "true", NEXT_PUBLIC_DEMO_MODE: "true" };
const run = (script, args) => new Promise((resolve) => {
  const child = spawn(process.execPath, [nextBin, script, ...args], { env: environment, stdio: "inherit" });
  child.on("exit", (code, signal) => resolve({ code: code ?? 1, signal }));
});

const start = async () => {
  if (production) {
    const build = await run("build", []);
    if (build.code !== 0) process.exit(build.code);
  }
  const started = await run(production ? "start" : "dev", forwardedArgs);
  if (started.signal) process.kill(process.pid, started.signal);
  process.exit(started.code);
};

void start();
