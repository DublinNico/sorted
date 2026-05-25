import { colors } from "@/constants/theme";
import { Circle, Defs, FeGaussianBlur, Filter, Path, Svg } from "react-native-svg";

/**
 * SortedLogo
 * Gold circle with a white checkmark.
 *
 * @param size  Diameter in dp (default 96)
 * @param glow  Soft Gaussian glow halo (default false)
 */
const SortedLogo = ({ size = 96, glow = false }: { size?: number; glow?: boolean }) => {
  // Expand the SVG canvas so the blurred glow is not clipped.
  const vPad = glow ? 28 : 0;
  const vSize = 100 + vPad * 2;
  const totalSize = glow ? size * (vSize / 100) : size;

  return (
    <Svg
      width={totalSize}
      height={totalSize}
      viewBox={`${-vPad} ${-vPad} ${vSize} ${vSize}`}
    >
      {glow && (
        <Defs>
          <Filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="9" />
          </Filter>
        </Defs>
      )}

      {/* Blurred glow source — same circle, rendered soft behind the sharp one */}
      {glow && (
        <Circle cx="50" cy="50" r="46" fill={colors.accent} filter="url(#glow)" />
      )}

      {/* Sharp main circle */}
      <Circle cx="50" cy="50" r="46" fill={colors.accent} />

      {/* Checkmark — dark green on gold */}
      <Path
        d="M 22 50 L 40 68 L 78 28"
        stroke={colors.background}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

export default SortedLogo;
