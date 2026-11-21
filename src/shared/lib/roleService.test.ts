import { describe, it, expect, beforeEach } from 'vitest';
import { roleService, DEFAULT_ROLE_DEFINITIONS, ROLE_PERMISSIONS_CATALOG } from './roleService';

describe('roleService (RBAC & Role Configuration)', () => {
  beforeEach(() => {
    localStorage.clear();
    roleService.resetToDefaults();
  });

  it('loads default roles properly with all required permissions and keys', () => {
    const roles = roleService.getRoles();
    expect(roles.admin).toBeDefined();
    expect(roles.organizer).toBeDefined();
    expect(roles.expert).toBeDefined();
    expect(roles.mentor).toBeDefined();
    expect(roles.participant).toBeDefined();
    expect(roles.guest).toBeDefined();

    expect(roles.admin.permissions.length).toBe(ROLE_PERMISSIONS_CATALOG.length);
    expect(roleService.hasPermission('admin', 'access_admin')).toBe(true);
    expect(roleService.hasPermission('guest', 'access_admin')).toBe(false);
  });

  it('allows editing role name and custom attributes', () => {
    const customName = 'Главный конструктор и наставник';
    const customBadge = 'Шеф-пилот';

    roleService.updateRole('mentor', {
      name: customName,
      badgeTitle: customBadge,
    });

    expect(roleService.getRoleTitle('mentor')).toBe(customName);
    expect(roleService.getRoleBadge('mentor')).toBe(customBadge);

    const reloaded = roleService.getRole('mentor');
    expect(reloaded.name).toBe(customName);
    expect(reloaded.badgeTitle).toBe(customBadge);
  });

  it('allows adding and removing permissions for a role', () => {
    expect(roleService.hasPermission('participant', 'manage_teams_crm')).toBe(false);

    const currentPerms = roleService.getRole('participant').permissions;
    roleService.updateRole('participant', {
      permissions: [...currentPerms, 'manage_teams_crm'],
    });

    expect(roleService.hasPermission('participant', 'manage_teams_crm')).toBe(true);

    // Remove permission
    roleService.updateRole('participant', {
      permissions: currentPerms.filter((p) => p !== 'access_quiz'),
    });
    expect(roleService.hasPermission('participant', 'access_quiz')).toBe(false);
  });

  it('resets to defaults when requested', () => {
    roleService.updateRole('expert', {
      name: 'Измененное имя жюри',
      permissions: [],
    });

    expect(roleService.getRoleTitle('expert')).toBe('Измененное имя жюри');
    expect(roleService.getRole('expert').permissions.length).toBe(0);

    roleService.resetToDefaults();

    expect(roleService.getRoleTitle('expert')).toBe(DEFAULT_ROLE_DEFINITIONS.expert.name);
    expect(roleService.getRole('expert').permissions.length).toBeGreaterThan(0);
  });
});
