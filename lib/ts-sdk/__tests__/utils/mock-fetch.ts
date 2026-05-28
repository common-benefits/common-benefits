/**
 * MSW-like fetch mocking using `vi.stubGlobal("fetch", ...)`.
 *
 * Pared-down adaptation of the upstream CommonGrants SDK helper. Keeps the
 * `setupServer` / `http` / `HttpResponse` API surface so tests read familiarly
 * and can migrate to real MSW later.
 */

import { vi } from "vitest";

export interface RequestInfo {
  url: string;
  method: string;
  headers: Headers;
  params: Record<string, string>;
  request: Request;
}

export type RequestHandler = (info: RequestInfo) => Response | Promise<Response>;

export interface HttpHandler {
  method: string;
  path: string | RegExp;
  handler: RequestHandler;
}

export const HttpResponse = {
  json(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
      status: init?.status ?? 200,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(new Headers(init?.headers).entries()),
      },
    });
  },
};

function createHandler(
  method: string,
  path: string | RegExp,
  handler: RequestHandler
): HttpHandler {
  return { method, path, handler };
}

export const http = {
  get: (path: string | RegExp, handler: RequestHandler) => createHandler("GET", path, handler),
  post: (path: string | RegExp, handler: RequestHandler) => createHandler("POST", path, handler),
};

function extractParams(pattern: string | RegExp, pathname: string): Record<string, string> | null {
  if (pattern instanceof RegExp) {
    const match = pathname.match(pattern);
    return match ? {} : null;
  }

  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
}

export function setupServer(...handlers: HttpHandler[]) {
  let currentHandlers: HttpHandler[] = [...handlers];
  let isListening = false;

  const findHandler = (method: string, url: string) => {
    const pathname = new URL(url).pathname;
    for (const h of currentHandlers) {
      if (h.method !== method) continue;
      const params = extractParams(h.path, pathname);
      if (params !== null) return { handler: h, params };
    }
    return null;
  };

  const mockFetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = request.url;
    const method = request.method;

    const match = findHandler(method, url);
    if (!match) {
      return HttpResponse.json({ error: "No handler found", url, method }, { status: 404 });
    }

    return match.handler.handler({
      url,
      method,
      headers: request.headers,
      params: match.params,
      request,
    });
  };

  return {
    listen() {
      if (isListening) return;
      vi.stubGlobal("fetch", mockFetch);
      isListening = true;
    },
    close() {
      if (!isListening) return;
      vi.unstubAllGlobals();
      isListening = false;
    },
    resetHandlers() {
      currentHandlers = [...handlers];
    },
    use(...runtimeHandlers: HttpHandler[]) {
      currentHandlers = [...runtimeHandlers, ...currentHandlers];
    },
  };
}
