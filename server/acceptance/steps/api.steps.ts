import assert from 'assert/strict';
import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import JSZip from 'jszip';
import { ApiWorld } from '../support/world';

type JsonRecord = Record<string, unknown>;

function fillTemplate(input: string, saved: Record<string, unknown>): string {
  return input.replace(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g, (_, key: string) => {
    const value = saved[key];
    if (value === undefined || value === null) {
      throw new Error(`No saved value found for token ${key}`);
    }
    return String(value);
  });
}

function parsePathSegments(path: string): Array<string | number> {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized
    .split('.')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function getByPath(root: unknown, path: string): unknown {
  return parsePathSegments(path).reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      return current[segment];
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    return (current as JsonRecord)[segment];
  }, root);
}

function normalizeExpectedValue(raw: string): string | number | boolean | null {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

async function saveHttpResponse(world: ApiWorld, response: Response): Promise<void> {
  const arrayBuffer = await response.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  const text = bytes.toString('utf8');
  const contentType = response.headers.get('content-type') || '';

  let json: unknown = null;
  if (contentType.includes('application/json') && text.length > 0) {
    json = JSON.parse(text);
  }

  world.response = {
    status: response.status,
    headers: response.headers,
    bytes,
    text,
    json
  };
}

async function createQuestionFromTable(
  world: ApiWorld,
  alias: string,
  text: string,
  table: DataTable
): Promise<void> {
  const alternatives = table.hashes().map((row) => ({
    id: String(row.id),
    text: String(row.text),
    correct: String(row.correct).toLowerCase() === 'true'
  }));

  const response = await fetch(`${world.baseUrl}/questions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, alternatives })
  });

  await saveHttpResponse(world, response);
  assert.equal(response.status, 201, `Failed to create question alias ${alias}`);

  const body = world.response?.json as JsonRecord;
  assert.ok(body?.id, `Created question ${alias} did not return an id`);
  world.saved[alias] = body.id;
}

Given('the API is running', async function (this: ApiWorld) {
  const response = await fetch(`${this.baseUrl}/`);
  await saveHttpResponse(this, response);
  assert.equal(response.status, 200, 'API root endpoint is not reachable');
});

Given(
  'a question exists as {string} with text {string} and alternatives:',
  async function (this: ApiWorld, alias: string, text: string, table: DataTable) {
    await createQuestionFromTable(this, alias, text, table);
  }
);

When(
  'I send a {string} request to {string}',
  async function (this: ApiWorld, method: string, path: string) {
    const finalPath = fillTemplate(path, this.saved);
    const response = await fetch(`${this.baseUrl}${finalPath}`, {
      method: method.toUpperCase()
    });

    await saveHttpResponse(this, response);
  }
);

When(
  'I send a {string} request to {string} with JSON body:',
  async function (this: ApiWorld, method: string, path: string, body: string) {
    const finalPath = fillTemplate(path, this.saved);
    const finalBody = fillTemplate(body, this.saved);

    const response = await fetch(`${this.baseUrl}${finalPath}`, {
      method: method.toUpperCase(),
      headers: { 'content-type': 'application/json' },
      body: finalBody
    });

    await saveHttpResponse(this, response);
  }
);

When(
  'I upload correction files to {string} with grading mode {string}:',
  async function (this: ApiWorld, path: string, gradingMode: string, csvPayload: string) {
    const finalPath = fillTemplate(path, this.saved);
    const [answerKeyCsv, responsesCsv] = csvPayload.split(/\r?\n---\r?\n/);

    assert.ok(answerKeyCsv, 'Answer key CSV section is required');
    assert.ok(responsesCsv, 'Responses CSV section is required, separated by --- line');

    const formData = new FormData();
    formData.append('gradingMode', gradingMode);
    formData.append('answerKeyFile', new Blob([answerKeyCsv], { type: 'text/csv' }), 'answer-key.csv');
    formData.append('responsesFile', new Blob([responsesCsv], { type: 'text/csv' }), 'responses.csv');

    const response = await fetch(`${this.baseUrl}${finalPath}`, {
      method: 'POST',
      body: formData
    });

    await saveHttpResponse(this, response);
  }
);

When(
  'I upload only answer key file to {string} with grading mode {string}:',
  async function (this: ApiWorld, path: string, gradingMode: string, answerKeyCsv: string) {
    const finalPath = fillTemplate(path, this.saved);

    const formData = new FormData();
    formData.append('gradingMode', gradingMode);
    formData.append('answerKeyFile', new Blob([answerKeyCsv], { type: 'text/csv' }), 'answer-key.csv');

    const response = await fetch(`${this.baseUrl}${finalPath}`, {
      method: 'POST',
      body: formData
    });

    await saveHttpResponse(this, response);
  }
);

Then('the response status should be {int}', function (this: ApiWorld, expectedStatus: number) {
  assert.ok(this.response, 'No response available');
  assert.equal(this.response.status, expectedStatus);
});

Then('I save response field {string} as {string}', function (this: ApiWorld, path: string, alias: string) {
  assert.ok(this.response, 'No response available');

  const value = getByPath(this.response.json, path);
  assert.notEqual(value, undefined, `Response field ${path} does not exist`);
  this.saved[alias] = value;
});

Then('the response field {string} should be a non-empty string', function (this: ApiWorld, path: string) {
  assert.ok(this.response, 'No response available');

  const value = getByPath(this.response.json, path);
  assert.equal(typeof value, 'string');
  assert.ok(String(value).trim().length > 0, `Field ${path} is empty`);
});

Then('the response field {string} should equal {string}', function (this: ApiWorld, path: string, expected: string) {
  assert.ok(this.response, 'No response available');

  const value = getByPath(this.response.json, path);
  assert.equal(value, normalizeExpectedValue(expected));
});

Then('the response field {string} should equal number {float}', function (this: ApiWorld, path: string, expected: number) {
  assert.ok(this.response, 'No response available');

  const value = Number(getByPath(this.response.json, path));
  assert.ok(Number.isFinite(value), `Field ${path} is not numeric`);
  assert.ok(Math.abs(value - expected) < 0.0001, `Expected ${expected}, got ${value}`);
});

Then(
  'the response field {string} should equal saved value {string}',
  function (this: ApiWorld, path: string, alias: string) {
    assert.ok(this.response, 'No response available');

    const actual = getByPath(this.response.json, path);
    assert.equal(actual, this.saved[alias]);
  }
);

Then(
  'the response field {string} should be an array with length {int}',
  function (this: ApiWorld, path: string, expectedLength: number) {
    assert.ok(this.response, 'No response available');

    const value = getByPath(this.response.json, path);
    assert.ok(Array.isArray(value), `Field ${path} is not an array`);
    assert.equal(value.length, expectedLength);
  }
);

Then('the response header {string} should contain {string}', function (this: ApiWorld, header: string, expected: string) {
  assert.ok(this.response, 'No response available');

  const value = this.response.headers.get(header.toLowerCase()) || '';
  assert.ok(value.includes(expected), `Header ${header} does not contain ${expected}. Actual: ${value}`);
});

Then('the response text should contain {string}', function (this: ApiWorld, expected: string) {
  assert.ok(this.response, 'No response available');
  assert.ok(this.response.text.includes(expected), `Response text does not include ${expected}`);
});

Then('the generated zip should contain files:', async function (this: ApiWorld, table: DataTable) {
  assert.ok(this.response, 'No response available');

  const zip = await JSZip.loadAsync(this.response.bytes);
  const expectedFiles = table.raw().map((row) => row[0]);

  expectedFiles.forEach((fileName) => {
    assert.ok(zip.file(fileName), `Expected zip to contain ${fileName}`);
  });
});

Then('zip file {string} should contain {string}', async function (this: ApiWorld, fileName: string, expectedText: string) {
  assert.ok(this.response, 'No response available');

  const zip = await JSZip.loadAsync(this.response.bytes);
  const file = zip.file(fileName);
  assert.ok(file, `Zip file ${fileName} was not found`);

  const content = await file.async('text');
  assert.ok(content.includes(expectedText), `Zip file ${fileName} does not include expected text`);
});
