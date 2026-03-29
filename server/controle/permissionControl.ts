import { eq, and } from "drizzle-orm";
import { users, userPermissions, SYSTEM_MODULES, type SystemModule } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Permission Control Module - RBAC granular por módulo
 * Cada usuário tem permissões individuais por módulo (view, create, edit, delete)
 * Admin tem acesso total automaticamente
 */

export type PermissionMap = Record<SystemModule, {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}>;

/**
 * Obter todas as permissões de um usuário
 */
export async function getUserPermissions(userId: number): Promise<PermissionMap> {
  const db = await getDb();
  if (!db) return getEmptyPermissions();

  // Verificar se é admin - admin tem acesso total
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecord.length > 0 && userRecord[0].role === "admin") {
    return getFullPermissions();
  }

  const perms = await db
    .select()
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));

  const map = getEmptyPermissions();
  for (const p of perms) {
    const mod = p.module as SystemModule;
    if (SYSTEM_MODULES.includes(mod)) {
      map[mod] = {
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
      };
    }
  }

  return map;
}

/**
 * Definir permissões de um módulo para um usuário
 */
export async function setUserModulePermission(
  userId: number,
  module: SystemModule,
  permissions: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Upsert: se já existe, atualiza; se não, insere
    const existing = await db
      .select()
      .from(userPermissions)
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.module, module)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userPermissions)
        .set(permissions)
        .where(and(eq(userPermissions.userId, userId), eq(userPermissions.module, module)));
    } else {
      await db.insert(userPermissions).values({
        userId,
        module,
        ...permissions,
      });
    }
    return true;
  } catch (error) {
    console.error("[PermissionControl] Error setting permission:", error);
    return false;
  }
}

/**
 * Definir todas as permissões de um usuário de uma vez (bulk)
 */
export async function setAllUserPermissions(
  userId: number,
  permissions: Partial<PermissionMap>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    for (const [module, perms] of Object.entries(permissions)) {
      await setUserModulePermission(userId, module as SystemModule, perms);
    }
    return true;
  } catch (error) {
    console.error("[PermissionControl] Error setting all permissions:", error);
    return false;
  }
}

/**
 * Verificar se usuário tem permissão específica em um módulo
 */
export async function checkPermission(
  userId: number,
  module: SystemModule,
  action: "canView" | "canCreate" | "canEdit" | "canDelete"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Admin tem acesso total
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecord.length > 0 && userRecord[0].role === "admin") return true;

  const perm = await db
    .select()
    .from(userPermissions)
    .where(and(eq(userPermissions.userId, userId), eq(userPermissions.module, module)))
    .limit(1);

  if (perm.length === 0) return false;
  return perm[0][action];
}

/**
 * Listar todos os usuários com suas permissões
 */
export async function listUsersWithPermissions() {
  const db = await getDb();
  if (!db) return [];

  const allUsers = await db.select().from(users);
  const allPerms = await db.select().from(userPermissions);

  return allUsers.map(user => {
    const userPerms = allPerms.filter(p => p.userId === user.id);
    const permMap = getEmptyPermissions();
    
    if (user.role === "admin") {
      return { ...user, permissions: getFullPermissions() };
    }

    for (const p of userPerms) {
      const mod = p.module as SystemModule;
      if (SYSTEM_MODULES.includes(mod)) {
        permMap[mod] = {
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        };
      }
    }

    return { ...user, permissions: permMap };
  });
}

// Helpers
function getEmptyPermissions(): PermissionMap {
  const map = {} as PermissionMap;
  for (const mod of SYSTEM_MODULES) {
    map[mod] = { canView: false, canCreate: false, canEdit: false, canDelete: false };
  }
  return map;
}

function getFullPermissions(): PermissionMap {
  const map = {} as PermissionMap;
  for (const mod of SYSTEM_MODULES) {
    map[mod] = { canView: true, canCreate: true, canEdit: true, canDelete: true };
  }
  return map;
}
