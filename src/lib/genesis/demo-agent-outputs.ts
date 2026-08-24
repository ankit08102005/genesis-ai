import type { AgentKey } from "./agent-schemas";

/**
 * Deterministic fallback outputs used when the AI provider is not configured or
 * unavailable. These are always surfaced in the UI with a DEMO badge — they are
 * never presented as model output.
 */
export function demoAgentOutput(agent: AgentKey, prompt: string): unknown {
  const target = /auth/i.test(prompt) ? "AuthService" : "TargetComponent";
  switch (agent) {
    case "requirement":
      return {
        summary: `Derived 2 requirements from the request: "${prompt.slice(0, 80)}".`,
        requirements: [
          {
            title: "Refresh token issuance",
            description:
              "The system must issue a long-lived refresh token alongside the access token and expose an endpoint to exchange it for a new access token.",
            type: "functional",
            priority: "critical",
          },
          {
            title: "Refresh token rotation and revocation",
            description:
              "Refresh tokens must rotate on each use and be revocable per token family to limit replay of leaked tokens.",
            type: "non-functional",
            priority: "high",
          },
        ],
      };
    case "architecture":
      return {
        summary: "Extend the authentication subsystem with a rotating refresh-token flow.",
        changes: [
          { component: target, change: "Add issueRefreshToken() and rotateRefreshToken()", reason: "Access tokens expire in 15 minutes; clients need silent renewal." },
          { component: "AuthController", change: "Expose POST /api/auth/refresh", reason: "Public entry point for token exchange." },
          { component: "User", change: "Add refreshTokenFamily and revokedAt fields", reason: "Enables per-family revocation." },
        ],
        risks: ["Token replay if rotation is not atomic", "Session invalidation must clear stored families"],
        dependencies: ["jsonwebtoken", "MongoDB"],
      };
    case "impact":
      return {
        summary: "Authentication subsystem change with a broad blast radius.",
        directlyAffected: ["AuthController", "UserRepository", "SessionMiddleware"],
        indirectlyAffected: ["LoginAPI", "Frontend"],
        affectedApis: ["LoginAPI"],
        affectedDatabaseModels: ["User", "MongoDB"],
        affectedTests: ["tests/auth.test.ts", "tests/login.test.ts"],
        relatedRequirements: ["REQ-001 — User authentication", "REQ-002 — Secure login and session handling"],
        riskLevel: "high",
      };
    case "coding":
      return {
        summary: "Three files modified to support rotating refresh tokens.",
        filesToCreate: [],
        filesToModify: ["src/services/auth.ts", "src/controllers/authController.ts", "src/models/user.ts"],
        filesToDelete: [],
        changes: [
          {
            file: "src/services/auth.ts",
            description: "Issue and rotate refresh tokens alongside access tokens.",
            before: `async login(email: string, password: string) {\n  const user = await this.users.findByEmail(email);\n  const accessToken = this.sign(user, "15m");\n  return { accessToken };\n}`,
            after: `async login(email: string, password: string) {\n  const user = await this.users.findByEmail(email);\n  const accessToken = this.sign(user, "15m");\n  const refreshToken = await this.issueRefreshToken(user);\n  return { accessToken, refreshToken };\n}\n\nasync refreshToken(token: string) {\n  const family = await this.users.findTokenFamily(token);\n  if (!family || family.revokedAt) throw new AuthError("Invalid refresh token");\n  await this.users.rotateTokenFamily(family.id);\n  return { accessToken: this.sign(family.user, "15m"), refreshToken: await this.issueRefreshToken(family.user) };\n}`,
          },
          {
            file: "src/controllers/authController.ts",
            description: "Expose the refresh endpoint.",
            before: `router.post("/login", ctrl.login);\nrouter.post("/logout", ctrl.logout);`,
            after: `router.post("/login", ctrl.login);\nrouter.post("/refresh", ctrl.refresh);\nrouter.post("/logout", ctrl.logout);`,
          },
          {
            file: "src/models/user.ts",
            description: "Persist refresh token families for revocation.",
            before: `const UserSchema = new Schema({\n  email: { type: String, unique: true },\n  passwordHash: String,\n});`,
            after: `const UserSchema = new Schema({\n  email: { type: String, unique: true },\n  passwordHash: String,\n  refreshTokenFamily: { type: String, index: true },\n  revokedAt: { type: Date, default: null },\n});`,
          },
        ],
      };
    case "testing":
      return {
        summary: "12 test cases planned across unit, integration and regression scopes. Not executed.",
        testsRequired: [
          { suite: "AuthService", name: "login returns access and refresh tokens", kind: "unit" },
          { suite: "AuthService", name: "refresh rejects an invalid token", kind: "unit" },
          { suite: "AuthService", name: "refresh rejects an expired token", kind: "unit" },
          { suite: "AuthService", name: "refresh rotates the token family", kind: "unit" },
          { suite: "AuthService", name: "revoked family cannot refresh", kind: "edge" },
          { suite: "LoginAPI", name: "POST /api/auth/refresh returns 200 with a valid token", kind: "integration" },
          { suite: "LoginAPI", name: "POST /api/auth/refresh returns 401 for a reused token", kind: "regression" },
        ],
        regressionRisks: ["Existing logout flow must clear refresh families", "Session middleware must accept rotated tokens"],
        testPlan: [
          "Extend tests/auth.test.ts with rotation coverage",
          "Add replay-attack integration test to tests/login.test.ts",
          "Re-run the full authentication suite before applying changes",
        ],
      };
    case "security":
      return {
        summary: "Two issues found in the proposed change.",
        score: 72,
        issues: [
          {
            title: "Refresh tokens stored without hashing",
            location: "src/models/user.ts",
            severity: "high",
            risk: "Database disclosure would expose usable long-lived credentials.",
            recommendation: "Store only a SHA-256 hash of the refresh token and compare hashes on exchange.",
          },
          {
            title: "Refresh endpoint is unauthenticated and unthrottled",
            location: "src/controllers/authController.ts",
            severity: "medium",
            risk: "Allows brute forcing of token values.",
            recommendation: "Apply per-IP rate limiting and a constant-time comparison.",
          },
        ],
        recommendations: ["Rotate on every use", "Bind the refresh token to a device fingerprint"],
      };
    case "documentation":
      return {
        summary: "Three documents affected.",
        documentsToUpdate: ["docs/auth.md", "README.md", "CHANGELOG.md"],
        changes: [
          { document: "docs/auth.md", change: "Document the refresh flow, rotation and revocation semantics.", reason: "New public endpoint." },
          { document: "README.md", change: "Update the authentication section and environment variables.", reason: "Setup instructions changed." },
          { document: "CHANGELOG.md", change: "Add entry: refresh token authentication.", reason: "Release tracking." },
        ],
      };
    default:
      return { summary: "No output." };
  }
}
