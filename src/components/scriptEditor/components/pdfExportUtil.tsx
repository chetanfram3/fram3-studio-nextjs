// src/modules/scripts/pdfExportUtil.tsx
"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import { registerFonts } from "./fonts";
import { getCurrentBrand } from "@/config/brandConfig";

// Register fonts at module level
registerFonts();

/**
 * PDF Export Utility - Theme-aware PDF generation
 *
 * IMPORTANT NOTE: @react-pdf/renderer uses its own styling system,
 * not MUI. Colors must be specified as hex values, not theme tokens.
 * However, we can still make it brand-aware by getting brand config.
 *
 * Theme integration approach:
 * - Use brand configuration for fonts
 * - Use consistent color palette (gold/bronze theme)
 * - Keep primary brand color (#FFD700 - Gold) for highlights
 * - Use professional, print-friendly colors for body text
 *
 * Porting changes:
 * - Added brand font configuration support
 * - Documented color choices for maintainability
 * - Improved code organization with comments
 * - Enhanced type safety
 * - Added brand-aware styling approach
 */

// ==========================================
// THEME-AWARE COLOR PALETTE
// ==========================================
// Note: These are hex values for @react-pdf/renderer
// They align with our theme's color scheme:
// - Primary brand color: #FFD700 (Gold - matches dark mode primary)
// - Text colors: Professional grays for print readability
// - Background colors: Light, print-friendly neutrals

const PDF_COLORS = {
  // Brand colors (aligned with theme)
  brandPrimary: "#FFD700", // Gold - our primary color
  brandBlack: "#000000", // Pure black for text

  // Text colors (professional, print-friendly)
  textPrimary: "#1F2937", // Dark gray for main text
  textSecondary: "#6B7280", // Medium gray for secondary text
  textMuted: "#9CA3AF", // Light gray for muted text

  // Background colors (light, print-friendly)
  bgWhite: "#FFFFFF", // Pure white
  bgLight: "#F8FAFC", // Very light gray
  bgBlue: "#EFF6FF", // Very light blue for highlights

  // Accent colors
  accentBlue: "#2563EB", // Blue for stats
  accentSuccess: "#10B981", // Green for status

  // Borders
  borderLight: "#E5E7EB", // Light border
} as const;

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: PDF_COLORS.bgWhite,
    padding: 40,
    fontFamily: "Helvetica", // Fallback font
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "column",
    width: "60%",
  },
  headerRight: {
    flexDirection: "column",
    width: "40%",
    alignItems: "flex-end",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Gameshow",
    color: PDF_COLORS.brandBlack,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 10,
    marginTop: 20,
    fontFamily: "Inter", // Brand font
  },
  subtitle: {
    fontSize: 12,
    color: PDF_COLORS.textSecondary,
    marginBottom: 5,
    fontFamily: "Helvetica",
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.brandPrimary, // Gold divider
    marginTop: 20,
    marginBottom: 20,
  },
  metadataBox: {
    backgroundColor: PDF_COLORS.bgLight,
    padding: 16,
    borderRadius: 4,
    marginBottom: 20,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    color: PDF_COLORS.textSecondary,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    fontSize: 10,
    color: PDF_COLORS.textPrimary,
    fontFamily: "Helvetica",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    width: "30%",
    backgroundColor: PDF_COLORS.bgBlue,
    borderRadius: 4,
    padding: 10,
  },
  statLabel: {
    fontSize: 9,
    color: PDF_COLORS.textSecondary,
    marginBottom: 3,
    fontFamily: "Helvetica",
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: PDF_COLORS.accentBlue,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: PDF_COLORS.textPrimary,
    fontFamily: "Helvetica-Bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.bgBlue,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.brandPrimary, // Gold for emphasis
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: PDF_COLORS.textPrimary,
  },
  screenplayContainer: {
    marginTop: 10,
    padding: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sceneHeading: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 15,
    marginBottom: 5,
    textTransform: "uppercase",
    fontFamily: "Montserrat",
  },
  character: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 0,
    fontWeight: 700,
    textTransform: "uppercase",
    marginLeft: 150,
    fontFamily: "Montserrat",
  },
  dialogue: {
    fontSize: 12,
    marginTop: 0,
    marginBottom: 10,
    marginLeft: 100,
    marginRight: 100,
    fontFamily: "Montserrat",
  },
  parenthetical: {
    fontSize: 12,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 120,
    marginRight: 120,
    fontStyle: "italic",
    fontFamily: "Montserrat",
  },
  transition: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 15,
    marginBottom: 5,
    textAlign: "right",
    textTransform: "uppercase",
    fontFamily: "Montserrat",
  },
  action: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: "Montserrat",
  },
  heading: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 5,
    fontFamily: "Montserrat",
  },
  code: {
    fontSize: 12,
    fontFamily: "Courier",
    backgroundColor: PDF_COLORS.bgLight,
    padding: 5,
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.brandPrimary, // Gold border
    paddingTop: 15,
    backgroundColor: PDF_COLORS.bgLight,
  },
  footerText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: PDF_COLORS.textSecondary,
    marginTop: 5,
  },
  footerBrand: {
    fontSize: 10,
    marginBottom: 5,
  },
  footerBrandGameshow: {
    fontFamily: "Gameshow",
    fontSize: 16,
    color: PDF_COLORS.brandBlack,
  },
  footerBrandGameshowHighlight: {
    fontFamily: "Gameshow",
    fontSize: 16,
    color: PDF_COLORS.brandPrimary, // Gold highlight
  },
  footerBrandOrbitron: {
    fontFamily: "Inter", // Using Inter instead of Orbitron
    color: PDF_COLORS.brandBlack,
  },
  footerBrandOrbitronHighlight: {
    fontFamily: "Inter",
    color: PDF_COLORS.brandPrimary, // Gold highlight
  },
  superscript: {
    fontSize: 6,
    position: "absolute",
    bottom: 3,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: PDF_COLORS.textMuted,
    fontFamily: "Helvetica",
  },
  description: {
    width: "40%",
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  scenes: {
    width: "15%",
    textAlign: "center",
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  words: {
    width: "15%",
    textAlign: "center",
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  duration: {
    width: "30%",
    textAlign: "right",
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  status: {
    fontSize: 14,
    fontWeight: 700,
    color: PDF_COLORS.accentSuccess,
    marginTop: 12,
    marginBottom: 20,
    textAlign: "right",
    paddingRight: 12,
    fontFamily: "Helvetica-Bold",
  },
  bulletList: {
    marginLeft: 20,
    marginBottom: 10,
    fontFamily: "Montserrat",
  },
  orderedList: {
    marginLeft: 20,
    marginBottom: 10,
    fontFamily: "Montserrat",
  },
  listItem: {
    marginBottom: 5,
    fontFamily: "Montserrat",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: PDF_COLORS.borderLight,
    marginBottom: 10,
    fontFamily: "Montserrat",
  },
  tableCell: {
    fontSize: 11,
    padding: 5,
    fontFamily: "Montserrat",
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 700,
    padding: 5,
    fontFamily: "Montserrat",
  },
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Enhanced parsing for Tiptap HTML content
const parseScriptContent = (htmlContent: string) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const parsedContent: Array<{
    type: string;
    content: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderlined?: boolean;
    isStrikethrough?: boolean;
    alignment?: string;
    segments?: Array<{
      text: string;
      isBold: boolean;
      isItalic: boolean;
      isUnderlined: boolean;
      isStrikethrough: boolean;
    }>;
    listItems?: string[];
    tableData?: { headers: string[]; rows: string[][] };
  }> = [];

  const processNode = (node: Node, parentType: string = "action") => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        let isBold = false;
        let isItalic = false;
        let isUnderlined = false;
        let isStrikethrough = false;
        let current: Node | null = node;
        while (current && current !== tempDiv) {
          if (current.nodeName === "STRONG" || current.nodeName === "B")
            isBold = true;
          if (current.nodeName === "EM" || current.nodeName === "I")
            isItalic = true;
          if (current.nodeName === "U") isUnderlined = true;
          if (current.nodeName === "S" || current.nodeName === "STRIKE")
            isStrikethrough = true;
          current = current.parentNode;
        }
        return [{ text, isBold, isItalic, isUnderlined, isStrikethrough }];
      }
      return [];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const element = node as HTMLElement;
    const className = element.className || "";
    const tagName = element.tagName.toLowerCase();
    const styleAttr = element.getAttribute("style") || "";
    const alignment =
      styleAttr.includes("text-align: center") ||
      className.includes("has-text-align-center")
        ? "center"
        : styleAttr.includes("text-align: right") ||
            className.includes("has-text-align-right")
          ? "right"
          : "left";

    let type = parentType;
    if (className.includes("scene-heading")) type = "sceneHeading";
    else if (className.includes("character")) type = "character";
    else if (className.includes("dialogue")) type = "dialogue";
    else if (className.includes("parenthetical")) type = "parenthetical";
    else if (className.includes("transition")) type = "transition";
    else if (tagName === "p") type = "action";
    else if (tagName === "h1" || tagName === "h2" || tagName === "h3")
      type = "heading";
    else if (tagName === "code" || tagName === "pre") type = "code";
    else if (tagName === "ul") type = "bulletList";
    else if (tagName === "ol") type = "orderedList";
    else if (tagName === "table") type = "table";

    if (type === "bulletList" || type === "orderedList") {
      const listItems: string[] = [];
      const liElements = element.querySelectorAll("li");
      liElements.forEach((li) => listItems.push(li.textContent?.trim() || ""));
      parsedContent.push({
        type,
        content: element.textContent || "",
        alignment,
        listItems,
      });
      return [];
    }

    if (type === "table") {
      const tableData = { headers: [] as string[], rows: [] as string[][] };
      const headers = element.querySelectorAll("th");
      headers.forEach((header) =>
        tableData.headers.push(header.textContent?.trim() || "")
      );
      const rows = element.querySelectorAll("tr");
      rows.forEach((row, index) => {
        if (index === 0 && headers.length > 0) return;
        const cells = row.querySelectorAll("td");
        const rowData: string[] = [];
        cells.forEach((cell) => rowData.push(cell.textContent?.trim() || ""));
        if (rowData.length > 0) tableData.rows.push(rowData);
      });
      parsedContent.push({
        type,
        content: element.textContent || "",
        alignment,
        tableData,
      });
      return [];
    }

    const segments: Array<{
      text: string;
      isBold: boolean;
      isItalic: boolean;
      isUnderlined: boolean;
      isStrikethrough: boolean;
    }> = [];
    for (const child of Array.from(node.childNodes)) {
      segments.push(...processNode(child, type));
    }

    if (segments.length > 0) {
      parsedContent.push({
        type,
        content: element.textContent || "",
        alignment,
        segments,
      });
    } else {
      parsedContent.push({
        type,
        content: element.textContent || "",
        isBold:
          type === "sceneHeading" ||
          type === "character" ||
          type === "transition",
        isItalic: type === "parenthetical",
        alignment,
      });
    }

    return [];
  };

  for (const child of Array.from(tempDiv.childNodes)) {
    processNode(child);
  }

  return parsedContent;
};

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format duration
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// ==========================================
// PDF DOCUMENT COMPONENT
// ==========================================

interface ScriptPDFProps {
  title: string;
  content: string;
  scriptStats: {
    words: number;
    characters: number;
    scenes: number;
    dialogues: number;
    pages: number;
    duration: number;
  };
  version: number;
  date: string;
  scriptType?: string;
}

const ScriptPDF = ({
  title,
  content,
  scriptStats,
  version,
  date,
  scriptType = "TV Commercial",
}: ScriptPDFProps) => {
  const parsedContent = parseScriptContent(content);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {(() => {
              try {
                return (
                  <Image
                    src={`${window.location.origin}/logo512.png`}
                    style={styles.logo}
                  />
                );
              } catch (e) {
                return null;
              }
            })()}
            <Text style={styles.companyName}>FRAM3 STUDIO</Text>
            <Text style={styles.footerBrandOrbitron}>
              Bringing Stories to Life
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>Script Document</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <Text style={[styles.label, { marginRight: 4 }]}>Version:</Text>
              <Text style={styles.value}>{version}.0</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <Text style={[styles.label, { marginRight: 4 }]}>Date:</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerDivider} />

        {/* Script Title and Info */}
        <View style={styles.metadataBox}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
            {title}
          </Text>
          <View style={styles.metadataRow}>
            <View>
              <Text style={styles.label}>Script Type</Text>
              <Text style={styles.value}>{scriptType}</Text>
            </View>
            <View>
              <Text style={styles.label}>Created On</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View>
              <Text style={styles.label}>Last Modified</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Words</Text>
            <Text style={styles.statValue}>{scriptStats.words}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Scenes</Text>
            <Text style={styles.statValue}>{scriptStats.scenes}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Est. Duration</Text>
            <Text style={styles.statValue}>
              {formatDuration(scriptStats.duration)}
            </Text>
          </View>
        </View>

        {/* Script Details Table */}
        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.description]}>
              Element Type
            </Text>
            <Text style={[styles.tableHeaderText, styles.scenes]}>Count</Text>
            <Text style={[styles.tableHeaderText, styles.words]}>Words</Text>
            <Text style={[styles.tableHeaderText, styles.duration]}>
              Details
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.description]}>Scene Headings</Text>
            <Text style={[styles.scenes]}>{scriptStats.scenes}</Text>
            <Text style={[styles.words]}>-</Text>
            <Text style={[styles.duration]}>-</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.description]}>Dialogue Blocks</Text>
            <Text style={[styles.scenes]}>{scriptStats.dialogues}</Text>
            <Text style={[styles.words]}>-</Text>
            <Text style={[styles.duration]}>-</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.description]}>Total Content</Text>
            <Text style={[styles.scenes]}>-</Text>
            <Text style={[styles.words]}>{scriptStats.words}</Text>
            <Text style={[styles.duration]}>
              {formatDuration(scriptStats.duration)}
            </Text>
          </View>
        </View>

        {/* Script Content Section */}
        <Text style={styles.sectionTitle}>Script Content</Text>
        <View style={styles.screenplayContainer}>
          {parsedContent.map((item, index) => {
            const baseStyle =
              styles[item.type as keyof typeof styles] || styles.action;

            if (item.type === "bulletList") {
              return (
                <View key={index} style={styles.bulletList}>
                  {item.listItems?.map((line, i) => (
                    <View
                      key={`${index}-${i}`}
                      style={{ flexDirection: "row" }}
                    >
                      <Text style={{ marginRight: 5 }}>•</Text>
                      <Text style={styles.listItem}>{line}</Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (item.type === "orderedList") {
              return (
                <View key={index} style={styles.orderedList}>
                  {item.listItems?.map((line, i) => (
                    <View
                      key={`${index}-${i}`}
                      style={{ flexDirection: "row" }}
                    >
                      <Text style={{ marginRight: 5 }}>{i + 1}.</Text>
                      <Text style={styles.listItem}>{line}</Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (item.type === "table") {
              return (
                <View key={index} style={styles.table}>
                  <View style={styles.tableHeader}>
                    {item.tableData?.headers.map((header, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.tableHeaderCell,
                          { width: `${100 / item.tableData!.headers.length}%` },
                        ]}
                      >
                        {header}
                      </Text>
                    ))}
                  </View>
                  {item.tableData?.rows.map((row, i) => (
                    <View key={i} style={styles.tableRow}>
                      {row.map((cell, j) => (
                        <Text
                          key={j}
                          style={[
                            styles.tableCell,
                            {
                              width: `${100 / item.tableData!.headers.length}%`,
                            },
                          ]}
                        >
                          {cell}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              );
            }

            if (item.segments && item.segments.length > 0) {
              return (
                <View key={index} style={baseStyle}>
                  <Text
                    style={{
                      textAlign: item.alignment as "left" | "center" | "right",
                    }}
                  >
                    {item.segments.map((segment, segIndex) => (
                      <Text
                        key={segIndex}
                        style={{
                          fontFamily: segment.isBold
                            ? "Montserrat"
                            : "Montserrat",
                          fontWeight: segment.isBold ? 700 : 400,
                          fontStyle: segment.isItalic ? "italic" : "normal",
                          textDecoration: segment.isUnderlined
                            ? "underline"
                            : segment.isStrikethrough
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {segment.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              );
            }

            return (
              <View key={index} style={baseStyle}>
                <Text
                  style={{
                    textAlign: item.alignment as "left" | "center" | "right",
                  }}
                >
                  {item.content}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>
            <Text style={styles.footerBrandOrbitron}>FRAM</Text>
            <Text style={styles.footerBrandOrbitronHighlight}>3</Text>
            <Text style={styles.footerBrandOrbitron}> STUDIO - </Text>
            <Text style={styles.footerBrandOrbitron}> From </Text>
            <Text style={styles.footerBrandOrbitronHighlight}>Words</Text>
            <Text style={styles.footerBrandOrbitron}> to Worlds®™</Text>
          </Text>
          <Text style={styles.footerText}>
            {title} • Generated on {date} • Version {version}
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `Page ${pageNumber}`}
          fixed
        />
      </Page>
    </Document>
  );
};

// ==========================================
// EXPORT FUNCTION
// ==========================================

/**
 * Export script content to PDF
 *
 * @param title - Script title
 * @param content - HTML content from TipTap editor
 * @param scriptStats - Script statistics
 * @param version - Script version number
 * @param scriptType - Type of script (e.g., "TV Commercial")
 * @returns Promise<boolean> - Success status
 */
export const exportScriptToPDF = async (
  title: string,
  content: string,
  scriptStats: {
    words: number;
    characters: number;
    scenes: number;
    dialogues: number;
    pages: number;
    duration: number;
  },
  version: number,
  scriptType = "TV Commercial"
): Promise<boolean> => {
  const fileName = `${title.replace(/\s+/g, "_")}_v${version}.pdf`;
  const date = formatDate(new Date());

  try {
    const MyDocument = (
      <ScriptPDF
        title={title}
        content={content}
        scriptStats={scriptStats}
        version={version}
        date={date}
        scriptType={scriptType}
      />
    );

    const blob = await pdf(MyDocument).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
};
