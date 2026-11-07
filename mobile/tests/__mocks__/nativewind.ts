// NativeWind mock for Jest — returns the component unchanged.
// In tests we don't need Tailwind class resolution; StyleSheet values from
// tokens are tested directly.
export const styled = (component: unknown) => component;
export default { styled };
