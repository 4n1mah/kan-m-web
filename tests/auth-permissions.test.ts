import { describe, expect, it } from "vitest";
import {
  canDeleteOrders,
  canEditAnyOrder,
  canEditCatalog,
  canManageCartOrders,
  canManageSettings,
  canManageUsers,
  canUploadOrderPhotos,
  canViewActivity,
  canViewFinancials,
  canViewReports,
} from "@/lib/auth";

type Role = "OWNER" | "BAKER" | "ASSISTANT";
const ROLES: Role[] = ["OWNER", "BAKER", "ASSISTANT"];

// Cada helper con el conjunto EXACTO de roles que debe dejar pasar.
// Se prueba cada rol contra cada helper, incluidos los negativos.
const MATRIX: { name: string; fn: (role: Role) => boolean; allowed: Role[] }[] = [
  { name: "canManageUsers", fn: canManageUsers, allowed: ["OWNER"] },
  { name: "canManageSettings", fn: canManageSettings, allowed: ["OWNER"] },
  { name: "canDeleteOrders", fn: canDeleteOrders, allowed: ["OWNER"] },
  { name: "canEditCatalog", fn: canEditCatalog, allowed: ["OWNER", "BAKER"] },
  { name: "canEditAnyOrder", fn: canEditAnyOrder, allowed: ["OWNER", "BAKER"] },
  { name: "canManageCartOrders", fn: canManageCartOrders, allowed: ["OWNER", "BAKER"] },
  { name: "canViewActivity", fn: canViewActivity, allowed: ["OWNER", "BAKER"] },
  { name: "canUploadOrderPhotos", fn: canUploadOrderPhotos, allowed: ["OWNER", "BAKER"] },
  { name: "canViewReports", fn: canViewReports, allowed: ["OWNER", "BAKER"] },
  { name: "canViewFinancials", fn: canViewFinancials, allowed: ["OWNER", "BAKER"] },
];

describe("helpers de autorización", () => {
  for (const { name, fn, allowed } of MATRIX) {
    for (const role of ROLES) {
      const expected = allowed.includes(role);
      it(`${name}(${role}) === ${expected}`, () => {
        expect(fn(role)).toBe(expected);
      });
    }
  }

  it("ASSISTANT solo puede ver: ningún permiso de escritura ni de dinero", () => {
    const concedidos = MATRIX.filter(({ fn }) => fn("ASSISTANT")).map(({ name }) => name);
    expect(concedidos).toEqual([]);
  });

  it("OWNER tiene todos los permisos", () => {
    const negados = MATRIX.filter(({ fn }) => !fn("OWNER")).map(({ name }) => name);
    expect(negados).toEqual([]);
  });

  it("BAKER tiene todo salvo usuarios, configuración y borrado de pedidos", () => {
    const negados = MATRIX.filter(({ fn }) => !fn("BAKER")).map(({ name }) => name).sort();
    expect(negados).toEqual(["canDeleteOrders", "canManageSettings", "canManageUsers"]);
  });
});
