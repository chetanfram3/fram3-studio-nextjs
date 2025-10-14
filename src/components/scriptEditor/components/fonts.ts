import { Font } from '@react-pdf/renderer';

// Register all fonts
export const registerFonts = () => {
  // Gameshow font
  Font.register({
    family: 'Gameshow',
    src: `${window.location.origin}/fonts/Gameshow.ttf`,
  });

  // Inter variable fonts
  Font.register({
    family: 'Inter',
    fonts: [
      // Normal styles (100–900)
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 100, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 200, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 300, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 400, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 500, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 600, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 700, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 800, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Inter-VariableFont_opsz,wght.ttf`, fontWeight: 900, fontStyle: 'normal' },
      // Italic styles (100–900)
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 100, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 200, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 300, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 500, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 600, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 700, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 800, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Inter-Italic-VariableFont_opsz,wght.ttf`, fontWeight: 900, fontStyle: 'italic' },
    ],
  });

  // Montserrat variable fonts
  Font.register({
    family: 'Montserrat',
    fonts: [
      // Normal styles (100–900)
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 100, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 200, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 300, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 400, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 500, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 600, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 700, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 800, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Montserrat-VariableFont_wght.ttf`, fontWeight: 900, fontStyle: 'normal' },
      // Italic styles (100–900)
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 100, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 200, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 300, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 500, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 600, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 700, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 800, fontStyle: 'italic' },
      { src: `${window.location.origin}/fonts/Montserrat-Italic-VariableFont_wght.ttf`, fontWeight: 900, fontStyle: 'italic' },
    ],
  });

  // Orbitron variable font
  Font.register({
    family: 'Orbitron',
    fonts: [
      // Normal styles (400–900, no italic)
      { src: `${window.location.origin}/fonts/Orbitron-VariableFont_wght.ttf`, fontWeight: 400, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Orbitron-VariableFont_wght.ttf`, fontWeight: 500, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Orbitron-VariableFont_wght.ttf`, fontWeight: 600, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Orbitron-VariableFont_wght.ttf`, fontWeight: 700, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Orbitron-VariableFont_wght.ttf`, fontWeight: 800, fontStyle: 'normal' },
      { src: `${window.location.origin}/fonts/Orbitron-VariableFont_wght.ttf`, fontWeight: 900, fontStyle: 'normal' },
    ],
  });

  // Hyphenation callback to prevent unwanted word splitting
  Font.registerHyphenationCallback((word) => [word]);
};