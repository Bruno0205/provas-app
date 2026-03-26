import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber';

export type HttpResponseState = {
  status: number;
  headers: Headers;
  bytes: Buffer;
  text: string;
  json: unknown;
};

export class ApiWorld extends World {
  baseUrl: string;
  saved: Record<string, unknown>;
  response: HttpResponseState | null;

  constructor(options: IWorldOptions) {
    super(options);
    const port = process.env.ACCEPTANCE_PORT || '4010';
    this.baseUrl = `http://localhost:${port}`;
    this.saved = {};
    this.response = null;
  }
}

setWorldConstructor(ApiWorld);
