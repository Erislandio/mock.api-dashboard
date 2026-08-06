import { createClient } from "@supabase/supabase-js";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { NextRequest, NextResponse } from "next/server";
import { match } from "path-to-regexp";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL or Service Role Key is missing in environment variables"
    );
  }
  return createClient(url, key);
}

async function logRequest(data: {
  projectId: string;
  endpointId?: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  status: number;
  duration_ms: number;
  ip_address: string;
  enableLogs?: boolean;
}) {
  if (data.enableLogs === false) return;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("request_logs").insert({
      project_id: data.projectId,
      endpoint_id: data.endpointId,
      method: data.method,
      url: data.url,
      headers: data.headers,
      body: data.body,
      status: data.status,
      duration_ms: data.duration_ms,
      ip_address: data.ip_address
    });

    if (error) {
      console.error("Failed to log request to db:", error);
    }
  } catch (error) {
    console.error("Failed to log request:", error);
  }
}

// Simple in-memory cache for GET requests to reduce latency and database load
const responseCache = new Map<
  string,
  { data: any; headers: any; status: number; expiresAt: number }
>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function handleRequest(
  req: NextRequest,
  props: { params: Promise<{ token: string; path?: string[] }> }
) {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server configuration error: Missing Supabase Service Role Key"
      },
      { status: 500 }
    );
  }

  const params = await props.params;
  const startTime = Date.now();
  const method = req.method;
  const requestPath = "/" + (params.path?.join("/") || "");
  const fullUrl = req.url;
  const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  const cacheKey = `${params.token}:${method}:${requestPath}:${req.nextUrl.search}`;

  if (method === "GET") {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      // Return cached response directly
      const duration = Date.now() - startTime;

      // We still log the request asynchronously
      logRequest({
        projectId: cached.data._projectId || "unknown",
        endpointId: cached.data._endpointId || "unknown",
        enableLogs: cached.data._enableLogs !== false,
        method,
        url: fullUrl,
        headers: headersObj,
        body: undefined,
        status: cached.status,
        duration_ms: duration,
        ip_address: ipAddress
      });

      const responseBody = { ...cached.data };
      delete responseBody._projectId;
      delete responseBody._endpointId;

      return NextResponse.json(responseBody, {
        status: cached.status,
        headers: { ...cached.headers, "X-Cache": "HIT" }
      });
    }
  }

  // Find Project
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, auth_config")
    .eq("public_token", params.token)
    .single();

  console.log(project, params.token);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Read body text for logging/validation
  let bodyText = "";
  let bodyJson: any = null;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      bodyText = await req.text();
      if (bodyText) bodyJson = JSON.parse(bodyText);
    } catch (e) {
      // Ignore parse error, maybe it's not JSON
    }
  }

  // Find Endpoints
  const { data: endpoints } = await supabaseAdmin
    .from("endpoints")
    .select("*")
    .eq("project_id", project.id)
    .eq("is_active", true);

  if (!endpoints) {
    const duration = Date.now() - startTime;
    await logRequest({
      projectId: project.id,
      method,
      url: fullUrl,
      headers: headersObj,
      body: bodyText,
      status: 404,
      duration_ms: duration,
      ip_address: ipAddress
    });
    return NextResponse.json(
      { error: "No endpoints configured" },
      { status: 404 }
    );
  }

  // Match Endpoint Path and Method
  let matchedEndpoint = null;
  let pathParams: Record<string, string> = {};

  for (const ep of endpoints) {
    if (ep.method !== method && !ep.crud_enabled) continue;

    // Convert /users/:id to path-to-regexp format
    const matcher = match(ep.path, { decode: decodeURIComponent });
    const result = matcher(requestPath);

    if (result) {
      // Check method match for non-crud
      if (!ep.crud_enabled && ep.method !== method) continue;

      matchedEndpoint = ep;
      pathParams = result.params as Record<string, string>;
      break;
    }
  }

  // If no direct match, check CRUD exact matching routes
  if (!matchedEndpoint) {
    for (const ep of endpoints) {
      if (!ep.crud_enabled) continue;

      // If CRUD is enabled on /products, it also supports /products/:id
      const baseMatcher = match(ep.path, { decode: decodeURIComponent });
      const idMatcher = match(`${ep.path}/:id`, { decode: decodeURIComponent });

      const idResult = idMatcher(requestPath);
      if (idResult) {
        matchedEndpoint = ep;
        pathParams = idResult.params as Record<string, string>;
        break;
      }

      const baseResult = baseMatcher(requestPath);
      if (baseResult) {
        matchedEndpoint = ep;
        pathParams = baseResult.params as Record<string, string>;
        break;
      }
    }
  }

  if (!matchedEndpoint) {
    const duration = Date.now() - startTime;
    await logRequest({
      projectId: project.id,
      method,
      url: fullUrl,
      headers: headersObj,
      body: bodyText,
      status: 404,
      duration_ms: duration,
      ip_address: ipAddress
    });
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  // --- AUTHENTICATION VALIDATION ---
  const projectAuth = project.auth_config || { type: "none" };
  const endpointAuth = matchedEndpoint.auth_config || { type: "inherit" };
  const auth = endpointAuth.type === "inherit" ? projectAuth : endpointAuth;

  if (auth.type !== "none") {
    let isAuthorized = false;

    if (auth.type === "bearer") {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader === `Bearer ${auth.token}`) {
        isAuthorized = true;
      }
    } else if (auth.type === "basic") {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Basic ")) {
        const base64Credentials = authHeader.replace("Basic ", "");
        try {
          const decoded = atob(base64Credentials);
          if (decoded === `${auth.username}:${auth.password}`) {
            isAuthorized = true;
          }
        } catch (e) {
          // ignore decode error
        }
      }
    } else if (auth.type === "apikey") {
      const headerName = (auth.keyName || "").toLowerCase();
      const headerValue = req.headers.get(headerName);
      if (headerValue === auth.keyValue) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const duration = Date.now() - startTime;
      await logRequest({
        projectId: project.id,
        endpointId: matchedEndpoint.id,
        enableLogs: matchedEndpoint.enable_logs !== false,
        method,
        url: fullUrl,
        headers: headersObj,
        body: bodyText,
        status: 401,
        duration_ms: duration,
        ip_address: ipAddress
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  // --- END AUTHENTICATION VALIDATION ---

  // Validate Body against Schema if present
  if (bodyJson && matchedEndpoint.schema && matchedEndpoint.schema.type) {
    const validate = ajv.compile(matchedEndpoint.schema);
    const valid = validate(bodyJson);
    if (!valid) {
      const duration = Date.now() - startTime;
      const status = 400;
      const errorResp = { success: false, errors: validate.errors };
      await logRequest({
        projectId: project.id,
        endpointId: matchedEndpoint.id,
        enableLogs: matchedEndpoint.enable_logs !== false,
        method,
        url: fullUrl,
        headers: headersObj,
        body: bodyText,
        status,
        duration_ms: duration,
        ip_address: ipAddress
      });
      return NextResponse.json(errorResp, { status });
    }
  }

  // Handle Delay
  if (matchedEndpoint.delay_ms > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, matchedEndpoint.delay_ms)
    );
  }

  // Handle CRUD operations
  if (matchedEndpoint.crud_enabled) {
    let crudResponse = null;
    let crudStatus = 200;

    if (method === "GET") {
      if (pathParams.id) {
        // GET 1
        const { data } = await supabaseAdmin
          .from("endpoint_records")
          .select("json_data")
          .eq("endpoint_id", matchedEndpoint.id)
          .like("json_data", `%"id":"${pathParams.id}"%`)
          .limit(1);
        if (data && data.length > 0) {
          crudResponse = JSON.parse(data[0].json_data);
        } else {
          crudResponse = { error: "Not found" };
          crudStatus = 404;
        }
      } else {
        // GET ALL
        // Handling search, page, limit from search params
        const searchParams = req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "20");
        const page = parseInt(searchParams.get("page") || "1");
        const search = searchParams.get("search");

        let query = supabaseAdmin
          .from("endpoint_records")
          .select("json_data")
          .eq("endpoint_id", matchedEndpoint.id);
        if (search) {
          query = query.like("json_data", `%${search}%`);
        }

        const start = (page - 1) * limit;
        const { data } = await query.range(start, start + limit - 1);
        crudResponse = data ? data.map((d) => JSON.parse(d.json_data)) : [];
      }
    } else if (method === "POST") {
      // Add random ID if not present
      const newRecord = { ...bodyJson };
      if (!newRecord.id) newRecord.id = crypto.randomUUID();

      await supabaseAdmin.from("endpoint_records").insert({
        endpoint_id: matchedEndpoint.id,
        json_data: JSON.stringify(newRecord)
      });
      crudResponse = newRecord;
      crudStatus = 201;
    } else if (method === "PUT" || method === "PATCH") {
      if (pathParams.id) {
        const { data } = await supabaseAdmin
          .from("endpoint_records")
          .select("id, json_data")
          .eq("endpoint_id", matchedEndpoint.id)
          .like("json_data", `%"id":"${pathParams.id}"%`)
          .limit(1);
        if (data && data.length > 0) {
          const oldData = JSON.parse(data[0].json_data);
          const newData =
            method === "PUT"
              ? { ...bodyJson, id: pathParams.id }
              : { ...oldData, ...bodyJson, id: pathParams.id };
          await supabaseAdmin
            .from("endpoint_records")
            .update({ json_data: JSON.stringify(newData) })
            .eq("id", data[0].id);
          crudResponse = newData;
        } else {
          crudResponse = { error: "Not found" };
          crudStatus = 404;
        }
      }
    } else if (method === "DELETE") {
      if (pathParams.id) {
        const { data } = await supabaseAdmin
          .from("endpoint_records")
          .select("id")
          .eq("endpoint_id", matchedEndpoint.id)
          .like("json_data", `%"id":"${pathParams.id}"%`)
          .limit(1);
        if (data && data.length > 0) {
          await supabaseAdmin
            .from("endpoint_records")
            .delete()
            .eq("id", data[0].id);
          crudResponse = { success: true };
        } else {
          crudResponse = { error: "Not found" };
          crudStatus = 404;
        }
      }
    }

    if (crudResponse) {
      const duration = Date.now() - startTime;
      await logRequest({
        projectId: project.id,
        endpointId: matchedEndpoint.id,
        enableLogs: matchedEndpoint.enable_logs !== false,
        method,
        url: fullUrl,
        headers: headersObj,
        body: bodyText,
        status: crudStatus,
        duration_ms: duration,
        ip_address: ipAddress
      });
      return NextResponse.json(crudResponse, { status: crudStatus });
    }
  }

  // Return standard configured response
  const duration = Date.now() - startTime;
  await logRequest({
    projectId: project.id,
    endpointId: matchedEndpoint.id,
    enableLogs: matchedEndpoint.enable_logs !== false,
    method,
    url: fullUrl,
    headers: headersObj,
    body: bodyText,
    status: matchedEndpoint.status_code,
    duration_ms: duration,
    ip_address: ipAddress
  });

  const headers = matchedEndpoint.headers || {};
  const responseData = matchedEndpoint.response || {};

  if (method === "GET") {
    responseCache.set(cacheKey, {
      data: {
        ...responseData,
        _projectId: project.id,
        _endpointId: matchedEndpoint.id,
        _enableLogs: matchedEndpoint.enable_logs !== false
      },
      headers: headers,
      status: matchedEndpoint.status_code,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
  }

  return NextResponse.json(responseData, {
    status: matchedEndpoint.status_code,
    headers: { ...headers, "X-Cache": "MISS" }
  });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
export const HEAD = handleRequest;
