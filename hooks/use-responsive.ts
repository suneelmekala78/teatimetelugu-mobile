import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Returns reactive screen dimensions that update on orientation/resize,
 * plus safe area insets for bottom spacing.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return { width, height, insets };
}
