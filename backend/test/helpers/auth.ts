import { TestAuthTokens } from "../../src/modules/auth/test-auth.adapter.js";

export function authorizationHeader(token: string): { authorization: string } {
  return {
    authorization: `Bearer ${token}`
  };
}

export function accountAAuthHeaders(): { authorization: string } {
  return authorizationHeader(TestAuthTokens.accountA);
}

export function accountBAuthHeaders(): { authorization: string } {
  return authorizationHeader(TestAuthTokens.accountB);
}

export function invalidAuthHeaders(): { authorization: string } {
  return authorizationHeader(TestAuthTokens.invalid);
}
