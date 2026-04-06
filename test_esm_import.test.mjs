import { hasPermission } from './frontend/src/utils/authUtils.js';
test('esm import', () => expect(hasPermission).toBeDefined());
