// backend/__test__/auth_mw.test.js

// ให้มี secret ตอนโหลดโมดูล
process.env.NEXTAUTH_SECRET = "test-secret";

// mock jose.jwtVerify ก่อน require auth_mw
jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
}));

const { jwtVerify } = require("jose");
const {
  optionalAuth,
  requireAuth,
  requireMember,
  requireAdmin,
} = require("../auth_mw");

// helper res แบบง่าย ๆ
function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("auth_mw middlewares", () => {
  /* ---------------- optionalAuth ---------------- */

  it("optionalAuth - no token -> next() แต่ไม่ผูก req.user", async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  it("optionalAuth - valid token -> set req.user และ req.tokenHeader", async () => {
    const req = {
      headers: { authorization: "Bearer good-token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "u1", role: "member", login_name: "alice" },
      protectedHeader: { alg: "HS256" },
    });

    await optionalAuth(req, res, next);

    expect(jwtVerify).toHaveBeenCalledWith(
      "good-token",
      expect.any(Uint8Array),
      expect.objectContaining({
        algorithms: ["HS256"],
      })
    );
    expect(req.user).toEqual({
      id: "u1",
      role: "member",
      login_name: "alice",
    });
    expect(req.tokenHeader).toEqual({ alg: "HS256" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("optionalAuth - invalid token -> swallow error, ไม่ตั้ง req.user", async () => {
    const req = {
      headers: { authorization: "Bearer bad-token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockRejectedValue(new Error("bad token"));

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  /* ---------------- requireAuth ---------------- */

  it("requireAuth - no token -> 401 LOGIN_REQUIRED", async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: "Please log in to continue.",
      error_code: "LOGIN_REQUIRED",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAuth - invalid token -> 401 LOGIN_REQUIRED", async () => {
    const req = {
      headers: { authorization: "Bearer bad-token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockRejectedValue(new Error("invalid"));

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: "Please log in to continue.",
      error_code: "LOGIN_REQUIRED",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAuth - valid token -> ผูก req.user แล้ว next()", async () => {
    const req = {
      headers: { authorization: "Bearer good-token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "u1", role: "member" },
      protectedHeader: { alg: "HS256" },
    });

    await requireAuth(req, res, next);

    expect(req.user).toEqual({ id: "u1", role: "member" });
    expect(req.tokenHeader).toEqual({ alg: "HS256" });
    expect(next).toHaveBeenCalledTimes(1);
    // ไม่เขียน response เอง
    expect(res.body).toBeNull();
  });

  /* ---------------- requireMember ---------------- */

  it("requireMember - no token -> 401 LOGIN_REQUIRED", async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await requireMember(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: "Please log in to continue.",
      error_code: "LOGIN_REQUIRED",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireMember - role ไม่ใช่ member/admin -> 403 Forbidden (member only)", async () => {
    const req = {
      headers: { authorization: "Bearer token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "u1", role: "guest" },
      protectedHeader: {},
    });

    await requireMember(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden (member only)" });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireMember - role=member -> next()", async () => {
    const req = {
      headers: { authorization: "Bearer token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "u1", role: "member" },
      protectedHeader: {},
    });

    await requireMember(req, res, next);

    expect(req.user).toEqual({ id: "u1", role: "member" });
    expect(res.body).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("requireMember - role=admin ก็ผ่านได้", async () => {
    const req = {
      headers: { authorization: "Bearer token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "u1", role: "admin" },
      protectedHeader: {},
    });

    await requireMember(req, res, next);

    expect(req.user).toEqual({ id: "u1", role: "admin" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  /* ---------------- requireAdmin ---------------- */

  it("requireAdmin - no token -> 401 LOGIN_REQUIRED (admin)", async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: "Please log in to admin account continue.",
      error_code: "LOGIN_REQUIRED",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAdmin - role ไม่ใช่ admin -> 403 Forbidden (admin only)", async () => {
    const req = {
      headers: { authorization: "Bearer token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "u1", role: "member" },
      protectedHeader: {},
    });

    await requireAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden (admin only)" });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAdmin - role=admin -> next()", async () => {
    const req = {
      headers: { authorization: "Bearer token" },
    };
    const res = createRes();
    const next = jest.fn();

    jwtVerify.mockResolvedValue({
      payload: { id: "admin-1", role: "admin" },
      protectedHeader: { alg: "HS256" },
    });

    await requireAdmin(req, res, next);

    expect(req.user).toEqual({ id: "admin-1", role: "admin" });
    expect(req.tokenHeader).toEqual({ alg: "HS256" });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
