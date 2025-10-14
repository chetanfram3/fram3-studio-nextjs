import { Box, Typography, useTheme, alpha, keyframes } from "@mui/material";

// Define keyframes for animations
const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

interface ProgressIndicatorProps {
  currentPhase: number;
}

interface Phase {
  id: number;
  title: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentPhase,
}) => {
  const theme = useTheme();

  // Define the phases of script generation
  const phases: Phase[] = [
    { id: 0, title: "Initializing" },
    { id: 1, title: "Analyzing Context" },
    { id: 2, title: "Evaluating Concepts" },
    { id: 3, title: "Drafting Script" },
    { id: 4, title: "Running QA Checks" },
  ];

  // Calculate progress percentage based on phase completion
  const progressPercentage = (currentPhase / (phases.length - 1)) * 100;

  // Get current phase information
  const currentPhaseInfo =
    phases.find((phase) => phase.id === currentPhase) || phases[0];

  // For the circular progress
  const circleRadius = 85;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const offset =
    circleCircumference - (progressPercentage / 100) * circleCircumference;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {/* Step indicator and percentage */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          mb: 2,
        }}
      >
        {/* Step indicator */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 2,
            py: 0.75,
            bgcolor: alpha(theme.palette.background.paper, 0.15),
            borderRadius: "12px",
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
          >
            Step
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.secondary.main,
              fontWeight: 600,
              ml: 0.5,
            }}
          >
            {currentPhase + 1}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: alpha(theme.palette.text.secondary, 0.7), mx: 0.5 }}
          >
            of
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}
          >
            {phases.length}
          </Typography>
        </Box>

        {/* Percentage indicator */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.secondary.main,
            fontWeight: 500,
            animation: `${pulse} 1.5s infinite ease-in-out`,
          }}
        >
          {Math.round(progressPercentage)}% Complete
        </Typography>
      </Box>

      {/* Circular Progress Indicator */}
      <Box
        sx={{
          position: "relative",
          width: 220,
          height: 220,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.background.paper, 0.2),
          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* SVG for circular progress */}
        <Box
          component="svg"
          width={220}
          height={220}
          viewBox="0 0 220 220"
          sx={{
            position: "absolute",
            transform: "rotate(-90deg)",
          }}
        >
          {/* Background circle */}
          <Box
            component="circle"
            cx={110}
            cy={110}
            r={circleRadius}
            fill="none"
            stroke={alpha(theme.palette.background.paper, 0.3)}
            strokeWidth={10}
          />

          {/* Progress circle */}
          <Box
            component="circle"
            cx={110}
            cy={110}
            r={circleRadius}
            fill="none"
            stroke={theme.palette.secondary.main}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circleCircumference}
            strokeDashoffset={offset}
            sx={{
              transition: "stroke-dashoffset 0.8s ease-in-out",
            }}
          />
        </Box>

        {/* Center content */}
        <Box sx={{ zIndex: 10, textAlign: "center", px: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
          >
            {currentPhaseInfo.title}
          </Typography>

          {currentPhase === 1 && (
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.7),
                display: "block",
                mt: 1,
              }}
            >
              Processing your requirements...
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProgressIndicator;
