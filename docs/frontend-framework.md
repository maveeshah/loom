# Frontend Framework Guide

The Loom frontend uses a React (Vite + TypeScript) codebase to render dynamic data tables, forms, and record views driven purely by Blueprint metadata. 

## Configuration

Frontend configuration lives in `frontend/src/framework/config.ts`.
This central module determines:
- Environment mode and base API URLs.
- Theming tokens: primary brand color overrides, logo details.
- Global layout configurations, including sidebar and toolbar features.

## The Routing Model

Navigation matches generic patterns inside `App.tsx` and `DynamicRoute.tsx`:
- List View: `/app/:module`
- Form View (Create): `/app/:module/new`
- Form View (Edit): `/app/:module/:id/edit`
- Detailed View: `/app/:module/:id`

The UI resolves `:module` against the Blueprint schema's `slug`.

## Dynamic Routes & Views

When navigating to an entity matching a blueprint, the `DynamicRoute` component defers to:
- `ModuleListView`: Genereic table component.
- `RecordForm`: Generic dynamic form.
- `RecordView`: The detailed page. It dynamically composes tabs according to the `views` array defined in the Blueprint (e.g., Summary, History, Comments).

## Frontend Plugin Registry

Instead of relying heavily on `import.meta.glob` path conventions, an explicit explicit registry at `frontend/src/framework/pluginRegistry.ts` manages component overrides.

To provide a custom component (e.g., a specialized Dashboard or a custom Tab inside `RecordView`):
1. **Develop** your component (e.g., `src/plugins/billing/InvoiceTimeline.tsx`).
2. **Register** it:
   ```typescript
   pluginRegistry.registerView({
       module: 'invoice',
       surface: 'tab',
       id: 'timeline',
       component: InvoiceTimeline
   });
   ```
3. **Reference** it in the blueprint:
   ```yaml
   views:
     - id: timeline
       type: custom
   ```
The framework falls back to a generic component implementation if a view ID isn't found in the plugin registry.
