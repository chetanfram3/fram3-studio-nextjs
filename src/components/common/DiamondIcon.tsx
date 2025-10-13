import { SvgIcon, styled } from "@mui/material";
import { SvgIconProps } from "@mui/material/SvgIcon";

// Define custom props interface to include 'size' and 'animate'
interface DiamondIconProps extends Omit<SvgIconProps, "fontSize"> {
  size?: number;
  animate?: boolean;
}

// Define the styled SvgIcon with animation
const AnimatedSvgIcon = styled(SvgIcon, {
  shouldForwardProp: (prop) => prop !== "animate",
})<{ animate?: boolean }>(({ theme, animate }) => ({
  ...(animate && {
    animation: "diamondBreathe 2s ease-in-out infinite",
    "@keyframes diamondBreathe": {
      "0%, 100%": {
        transform: "scale(1)",
        opacity: 1,
      },
      "50%": {
        transform: "scale(1.1)",
        opacity: 0.8,
      },
    },
  }),
}));

// Define the DiamondIcon component
function DiamondIcon({
  size = 32,
  animate = false,
  sx,
  ...props
}: DiamondIconProps) {
  return (
    <AnimatedSvgIcon
      viewBox="0 0 24 24"
      sx={{ fontSize: size, color: "#78350f", ...sx }} // Default size: 32, color: yellow-900
      animate={animate}
      {...props}
    >
      <path
        fill="currentColor"
        d="M6,2L18,2L22,8L12,22L2,8L6,2M12,4.5L8.5,4.5L6,8L12,18L18,8L15.5,4.5L12,4.5Z"
      />
    </AnimatedSvgIcon>
  );
}

export default DiamondIcon;
