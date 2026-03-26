import { Before, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { ApiWorld } from './world';

setDefaultTimeout(60_000);

const serverRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(serverRoot, 'data');
const questionsPath = path.join(dataDir, 'questions.json');
const examsPath = path.join(dataDir, 'exams.json');

let serverProcess: ChildProcessWithoutNullStreams | null = null;
let questionsBackup = '[]\n';
let examsBackup = '[]\n';
let chosenPort = 4010;

async function ensureServerReady(baseUrl: string): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 20_000) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore connection errors while server starts
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Server did not become ready at ${baseUrl}`);
}

async function readOrDefault(filePath: string, defaultContent: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return defaultContent;
  }
}

async function resetDataFiles(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(questionsPath, '[]\n', 'utf8');
  await fs.writeFile(examsPath, '[]\n', 'utf8');
}

BeforeAll(async () => {
  questionsBackup = await readOrDefault(questionsPath, '[]\n');
  examsBackup = await readOrDefault(examsPath, '[]\n');

  chosenPort = 4100 + Math.floor(Math.random() * 400);
  process.env.ACCEPTANCE_PORT = String(chosenPort);

  serverProcess = spawn('node', ['-r', 'ts-node/register/transpile-only', 'src/index.ts'], {
    cwd: serverRoot,
    env: { ...process.env, PORT: String(chosenPort) },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', () => {
    // keep process output quiet unless the run fails
  });

  serverProcess.stderr.on('data', () => {
    // keep process output quiet unless the run fails
  });

  const baseUrl = `http://localhost:${chosenPort}`;
  await ensureServerReady(baseUrl);
});

Before(async function beforeScenario(this: ApiWorld) {
  await resetDataFiles();
  this.saved = {};
  this.response = null;
});

AfterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }

  await fs.writeFile(questionsPath, questionsBackup, 'utf8');
  await fs.writeFile(examsPath, examsBackup, 'utf8');
});
