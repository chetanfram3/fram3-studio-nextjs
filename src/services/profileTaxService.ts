// src/services/profileTaxService.ts

import { UserProfile } from "@/types/profile";
import type { GSTConfig } from "@/services/payments";

interface TaxCalculation {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    taxType: "CGST+SGST" | "IGST";
    isInterState: boolean;
    customerType: "B2B" | "B2C";
    breakdown: {
        cgst: number;
        sgst: number;
        igst: number;
    };
    stateInfo: {
        businessState: string;
        customerState: string;
        stateCode: string;
    };
    dataSource: "profile" | "detected" | "default";
    confidence: "high" | "medium" | "low";
}

interface ProfileTaxInfo {
    hasCompleteAddress: boolean;
    hasValidGSTIN: boolean;
    customerState: string | null;
    customerStateCode: string | null;
    gstin: string | null;
    companyName: string | null;
    missingFields: string[];
}

export class ProfileTaxService {
    /**
     * GSTIN state code to state name mapping
     */
    private static getStateNameFromGSTINCode(gstinStateCode: string): { code: string; isoCode: string; name: string } | null {
        const stateMapping: Record<string, { code: string; isoCode: string; name: string }> = {
            "01": { code: "01", isoCode: "JK", name: "Jammu and Kashmir" },
            "02": { code: "02", isoCode: "HP", name: "Himachal Pradesh" },
            "03": { code: "03", isoCode: "PB", name: "Punjab" },
            "04": { code: "04", isoCode: "CH", name: "Chandigarh" },
            "05": { code: "05", isoCode: "UT", name: "Uttarakhand" },
            "06": { code: "06", isoCode: "HR", name: "Haryana" },
            "07": { code: "07", isoCode: "DL", name: "Delhi" },
            "08": { code: "08", isoCode: "RJ", name: "Rajasthan" },
            "09": { code: "09", isoCode: "UP", name: "Uttar Pradesh" },
            "10": { code: "10", isoCode: "BR", name: "Bihar" },
            "11": { code: "11", isoCode: "SK", name: "Sikkim" },
            "12": { code: "12", isoCode: "AR", name: "Arunachal Pradesh" },
            "13": { code: "13", isoCode: "NL", name: "Nagaland" },
            "14": { code: "14", isoCode: "MN", name: "Manipur" },
            "15": { code: "15", isoCode: "MZ", name: "Mizoram" },
            "16": { code: "16", isoCode: "TR", name: "Tripura" },
            "17": { code: "17", isoCode: "ML", name: "Meghalaya" },
            "18": { code: "18", isoCode: "AS", name: "Assam" },
            "19": { code: "19", isoCode: "WB", name: "West Bengal" },
            "20": { code: "20", isoCode: "JH", name: "Jharkhand" },
            "21": { code: "21", isoCode: "OR", name: "Odisha" },
            "22": { code: "22", isoCode: "CT", name: "Chhattisgarh" },
            "23": { code: "23", isoCode: "MP", name: "Madhya Pradesh" },
            "24": { code: "24", isoCode: "GJ", name: "Gujarat" },
            "25": { code: "25", isoCode: "DN", name: "Dadra and Nagar Haveli" },
            "26": { code: "26", isoCode: "DD", name: "Daman and Diu" },
            "27": { code: "27", isoCode: "MH", name: "Maharashtra" },
            "28": { code: "28", isoCode: "AP", name: "Andhra Pradesh" },
            "29": { code: "29", isoCode: "KA", name: "Karnataka" },
            "30": { code: "30", isoCode: "GA", name: "Goa" },
            "31": { code: "31", isoCode: "LD", name: "Lakshadweep" },
            "32": { code: "32", isoCode: "KL", name: "Kerala" },
            "33": { code: "33", isoCode: "TN", name: "Tamil Nadu" },
            "34": { code: "34", isoCode: "PY", name: "Puducherry" },
            "35": { code: "35", isoCode: "AN", name: "Andaman and Nicobar Islands" },
            "36": { code: "36", isoCode: "TG", name: "Telangana" },
            "38": { code: "38", isoCode: "LA", name: "Ladakh" }
        };

        return stateMapping[gstinStateCode] || null;
    }

    /**
     * Convert state ISO code to GST state code
     */
    private static getStateCodeFromISOCode(isoCode: string): string | null {
        const isoToStateCode: Record<string, string> = {
            "JK": "01", "HP": "02", "PB": "03", "CH": "04", "UT": "05",
            "HR": "06", "DL": "07", "RJ": "08", "UP": "09", "BR": "10",
            "SK": "11", "AR": "12", "NL": "13", "MN": "14", "MZ": "15",
            "TR": "16", "ML": "17", "AS": "18", "WB": "19", "JH": "20",
            "OR": "21", "CT": "22", "MP": "23", "GJ": "24", "DN": "25",
            "DD": "26", "MH": "27", "AP": "28", "KA": "29", "GA": "30",
            "LD": "31", "KL": "32", "TN": "33", "PY": "34", "AN": "35",
            "TG": "36", "LA": "38"
        };

        return isoToStateCode[isoCode] || null;
    }

    /**
     * Extract tax-relevant information from user profile
     */
    static extractTaxInfo(profile: UserProfile): ProfileTaxInfo {
        const address = profile?.extendedInfo?.details?.address;
        const gstinInfo = profile?.extendedInfo?.details?.gstin;

        const missingFields: string[] = [];

        // Check address completeness
        const hasCompleteAddress = !!(
            address?.country === "IN" &&
            address?.state
        );

        if (!hasCompleteAddress) {
            if (!address?.country) missingFields.push("country");
            if (!address?.state) missingFields.push("state");
        }

        // Validate GSTIN
        const hasValidGSTIN = !!(
            gstinInfo?.number &&
            this.validateGSTINFormat(gstinInfo.number)
        );

        let customerState = null;
        let customerStateCode = null;

        // For B2B: Use GSTIN state code directly (first 2 characters)
        if (hasValidGSTIN && gstinInfo?.number) {
            customerStateCode = gstinInfo.number.substring(0, 2);
            const stateInfo = this.getStateNameFromGSTINCode(customerStateCode);
            customerState = stateInfo?.name || null;
        }
        // For B2C: Use address state (fallback)
        else if (hasCompleteAddress && address?.state) {
            customerState = address.state;
            customerStateCode = null; // No GSTIN, so no state code
        }

        return {
            hasCompleteAddress,
            hasValidGSTIN,
            customerState,
            customerStateCode,
            gstin: gstinInfo?.number || null,
            companyName: gstinInfo?.companyName || null,
            missingFields
        };
    }

    /**
     * Calculate tax using backend GST configuration
     */
    static calculateTaxFromProfile(
        baseAmount: number,
        profile: UserProfile,
        gstConfig?: GSTConfig
    ): TaxCalculation {
        const taxInfo = this.extractTaxInfo(profile);

        // Use backend GST config
        const gstRate = gstConfig?.rate || 18;

        // Get business state code from config
        const businessStateCode = gstConfig?.businessGSTIN?.substring(0, 2) || "29"; // Default to Karnataka

        console.log("🔍 TAX DEBUG:", {
            gstin: taxInfo.gstin,
            customerStateCode: taxInfo.customerStateCode,
            businessStateCode,
            hasValidGSTIN: taxInfo.hasValidGSTIN,
            addressState: profile?.extendedInfo?.details?.address?.state
        });

        // Determine if inter-state - SIMPLIFIED LOGIC
        let isInterState = false;

        if (taxInfo.hasValidGSTIN && taxInfo.customerStateCode) {
            // B2B: Compare GSTIN state codes directly
            isInterState = taxInfo.customerStateCode !== businessStateCode;
        } else if (profile?.extendedInfo?.details?.address?.state) {
            // B2C: Convert address state (ISO code) to GST state code and compare
            const addressStateCode = this.getStateCodeFromISOCode(profile.extendedInfo.details.address.state);
            if (addressStateCode) {
                isInterState = addressStateCode !== businessStateCode;
            } else {
                // Default to intra-state if can't convert
                isInterState = false;
            }
        } else {
            // Default to intra-state
            isInterState = false;
        }

        // Calculate GST
        const gstAmount = Math.round((baseAmount * gstRate) / 100);
        const totalAmount = baseAmount + gstAmount;

        // Determine breakdown
        const breakdown = isInterState ? {
            cgst: 0,
            sgst: 0,
            igst: gstAmount
        } : {
            cgst: Math.round(gstAmount / 2),
            sgst: Math.round(gstAmount / 2),
            igst: 0
        };

        // Determine confidence and data source
        let confidence: "high" | "medium" | "low" = "low";
        let dataSource: "profile" | "detected" | "default" = "default";

        if (taxInfo.hasValidGSTIN) {
            confidence = "high";
            dataSource = "profile";
        } else if (taxInfo.hasCompleteAddress) {
            confidence = "medium";
            dataSource = "profile";
        }

        console.log("🚀 TAX RESULT:", {
            isInterState,
            taxType: isInterState ? "IGST" : "CGST+SGST",
            breakdown
        });

        return {
            baseAmount,
            gstAmount,
            totalAmount,
            taxType: isInterState ? "IGST" : "CGST+SGST",
            isInterState,
            customerType: taxInfo.hasValidGSTIN ? "B2B" : "B2C",
            breakdown,
            stateInfo: {
                businessState: gstConfig?.businessState || "Karnataka",
                customerState: taxInfo.customerState || "Unknown",
                stateCode: taxInfo.customerStateCode || "Unknown"
            },
            dataSource,
            confidence
        };
    }

    /**
     * Validate GSTIN format
     */
    private static validateGSTINFormat(gstin: string): boolean {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstinRegex.test(gstin)) return false;

        const stateCode = parseInt(gstin.substr(0, 2));
        return stateCode >= 1 && stateCode <= 38;
    }

    /**
     * Get missing profile fields needed for accurate tax calculation
     */
    static getMissingFieldsForTax(profile: UserProfile): string[] {
        const taxInfo = this.extractTaxInfo(profile);
        return taxInfo.missingFields;
    }

    /**
     * Check if profile has sufficient data for tax calculation
     */
    static hasCompleteTaxData(profile: UserProfile): boolean {
        const taxInfo = this.extractTaxInfo(profile);
        return taxInfo.hasCompleteAddress;
    }

    /**
     * Get tax summary for display
     */
    static getTaxSummary(profile: UserProfile) {
        const taxInfo = this.extractTaxInfo(profile);

        return {
            canCalculateTax: taxInfo.hasCompleteAddress,
            customerType: taxInfo.hasValidGSTIN ? "Business (B2B)" : "Individual (B2C)",
            customerState: taxInfo.customerState,
            missingFields: taxInfo.missingFields,
            confidence: taxInfo.hasValidGSTIN ? "High" :
                taxInfo.hasCompleteAddress ? "Medium" : "Low"
        };
    }
}