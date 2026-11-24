import { guardApi } from "./guard.js";
import { fail } from "./http.js";

// Membungkus Route Handler: cek origin + sesi + role, await params, tangkap error tak terduga.
// Handler menerima ({ request, user, params }) dan mengembalikan Response.
//
//   export const GET = withRole(["admin"], async ({ params }) => ok({ data: ... }));
export function withRole(roles, handler) {
  return async function route(request, context) {
    const g = await guardApi(roles, request);
    if (g.error) return g.error;
    try {
      const params = (await context?.params) ?? {};
      return await handler({ request, user: g.user, params });
    } catch (err) {
      console.error(err);
      return fail("Terjadi kesalahan pada server.", 500);
    }
  };
}
