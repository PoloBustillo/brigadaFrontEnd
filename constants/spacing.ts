/**
 * Brigada Digital - Spacing System
 * Consistent spacing values for layouts
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export type SpacingSize = keyof typeof spacing;

/**
 * Helper function to get multiple spacing values
 * @example getSpacing('md', 'lg') // returns { md: 16, lg: 24 }
 */
export const getSpacing = (...sizes: SpacingSize[]) => {
  return sizes.reduce(
    (acc, size) => {
      acc[size] = spacing[size];
      return acc;
    },
    {} as Record<SpacingSize, number>,
  );
};
