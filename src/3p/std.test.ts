import * as mod from "https://deno.land/std@0.79.0/testing/asserts.ts";
export * from "https://deno.land/std@0.79.0/testing/asserts.ts";
export const assert = (expr: any, msg?: string) => mod.assert(expr, msg);
