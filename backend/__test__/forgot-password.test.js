const request = require("supertest");
const express = require("express");

process.env.JWT_RESET_SECRET = "test-reset-secret";
process.env.BACKEND_BASE_URL = "http://backend.test";
process.env.FRONTEND_BASE_URL = "http://frontend.test";
process.env.SMTP_HOST = "smtp.test";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "noreply@test";
process.env.SMTP_PASS = "pass";


jest.mock("@prisma/client", () => {
  const mockPrisma = {
    users: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const PrismaClient = jest.fn(() => mockPrisma);
  return { PrismaClient, __mockPrisma: mockPrisma };
});

jest.mock("nodemailer", () => {
  const sendMail = jest.fn();
  const verify = jest.fn().mockResolvedValue(true);
  const createTransport = jest.fn(() => ({ sendMail, verify }));
  return {
    createTransport,
    __mockSendMail: sendMail,
    __mockVerify: verify,
  };
});

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));


const { __mockPrisma } = require("@prisma/client");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const forgotRouter = require("../forgot-password");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", forgotRouter);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_RESET_SECRET = "test-reset-secret";
});

describe("Forgot password API", () => {

  it("POST /auth/forgot-password - email is required", async () => {
    const app = createApp();

    const res = await request(app).post("/auth/forgot-password").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("email is required");
    expect(__mockPrisma.users.findFirst).not.toHaveBeenCalled();
  });

  it("POST /auth/forgot-password - 500 when JWT_RESET_SECRET missing", async () => {
    const app = createApp();

    const saved = process.env.JWT_RESET_SECRET;
    delete process.env.JWT_RESET_SECRET;

    __mockPrisma.users.findFirst.mockResolvedValue({
      user_id: "u1",
      email: "user@example.com",
    });

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(__mockPrisma.users.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { user_id: true, email: true },
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Server misconfigured");
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(nodemailer.__mockSendMail).not.toHaveBeenCalled();

    process.env.JWT_RESET_SECRET = saved;
  });

  it("POST /auth/forgot-password - user not found -> still 200 generic, no mail", async () => {
    const app = createApp();

    __mockPrisma.users.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "unknown@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "If this email is registered, we have sent a reset link.",
    });

    expect(jwt.sign).not.toHaveBeenCalled();
    expect(nodemailer.__mockSendMail).not.toHaveBeenCalled();
  });

  it("POST /auth/forgot-password - user found -> sign token + send mail", async () => {
    const app = createApp();

    __mockPrisma.users.findFirst.mockResolvedValue({
      user_id: "u1",
      email: "user@example.com",
    });

    jwt.sign.mockReturnValue("reset-token");
    nodemailer.__mockSendMail.mockResolvedValue({ messageId: "123" });

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(__mockPrisma.users.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { user_id: true, email: true },
    });

    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: "u1", type: "reset" },
      "test-reset-secret",
      { expiresIn: "24h" }
    );

    expect(nodemailer.__mockSendMail).toHaveBeenCalledTimes(1);
    const mailArg = nodemailer.__mockSendMail.mock.calls[0][0];
    expect(mailArg.to).toBe("user@example.com");
    expect(mailArg.from).toContain(process.env.SMTP_USER);
    expect(mailArg.html).toContain(
      `${process.env.BACKEND_BASE_URL}/auth/reset-password?token=`
    );
    expect(mailArg.html).toContain(encodeURIComponent("reset-token"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Reset link sent (if email exists).",
    });
  });

  it("POST /auth/forgot-password - sendMail error -> 500", async () => {
    const app = createApp();

    __mockPrisma.users.findFirst.mockResolvedValue({
      user_id: "u1",
      email: "user@example.com",
    });

    jwt.sign.mockReturnValue("reset-token");
    nodemailer.__mockSendMail.mockRejectedValue(new Error("SMTP down"));

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to send email. Please try again later.",
    });
  });


  it("GET /auth/reset-password - missing token -> redirect with error=missing_token", async () => {
    const app = createApp();

    const res = await request(app)
      .get("/auth/reset-password")
      .redirects(0); 

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      `${process.env.FRONTEND_BASE_URL}/reset-password?error=missing_token`
    );
  });

  it("GET /auth/reset-password - valid reset token -> redirect to frontend with token", async () => {
    const app = createApp();

    jwt.verify.mockReturnValue({
      userId: "u1",
      type: "reset",
    });

    const token = "good-token";

    const res = await request(app)
      .get("/auth/reset-password")
      .query({ token })
      .redirects(0);

    expect(jwt.verify).toHaveBeenCalledWith(
      token,
      process.env.JWT_RESET_SECRET
    );
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      `${process.env.FRONTEND_BASE_URL}/reset-password?token=${encodeURIComponent(
        token
      )}`
    );
  });

  it("GET /auth/reset-password - invalid/expired token -> redirect error=invalid_or_expired", async () => {
    const app = createApp();

    jwt.verify.mockImplementation(() => {
      throw new Error("bad");
    });

    const res = await request(app)
      .get("/auth/reset-password")
      .query({ token: "bad-token" })
      .redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      `${process.env.FRONTEND_BASE_URL}/reset-password?error=invalid_or_expired`
    );
  });


  it("POST /auth/reset-password - token and password required", async () => {
    const app = createApp();

    const res = await request(app)
      .post("/auth/reset-password")
      .send({}); 

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "token and password are required",
    });
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it("POST /auth/reset-password - invalid token -> 400", async () => {
    const app = createApp();

    jwt.verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "bad", password: "newpass" });

    expect(jwt.verify).toHaveBeenCalledWith(
      "bad",
      process.env.JWT_RESET_SECRET
    );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
    expect(__mockPrisma.users.update).not.toHaveBeenCalled();
  });

  it("POST /auth/reset-password - valid reset token -> hash password & update user", async () => {
    const app = createApp();

    jwt.verify.mockReturnValue({
      userId: "u1",
      type: "reset",
    });

    bcrypt.hash.mockResolvedValue("hashed-pass");
    __mockPrisma.users.update.mockResolvedValue({});

    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "good", password: "newpass" });

    expect(jwt.verify).toHaveBeenCalledWith(
      "good",
      process.env.JWT_RESET_SECRET
    );
    expect(bcrypt.hash).toHaveBeenCalledWith("newpass", 10);
    expect(__mockPrisma.users.update).toHaveBeenCalledWith({
      where: { user_id: "u1" },
      data: { password: "hashed-pass" },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Password has been reset." });
  });
});
