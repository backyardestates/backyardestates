import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";

// Minimal “branded” look without over-engineering
export function FeasibilityPdf({ data }: { data: any }) {
    return (
        <Document>
            <Page size="LETTER" style={{ padding: 32 }}>
                {/* Hero */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 20, fontWeight: 700 }}>
                        ADU Feasibility & Investment Engine™
                    </Text>
                    <Text style={{ fontSize: 11, marginTop: 6 }}>
                        The only way to get a real price, real timeline, and zero-surprise build.
                    </Text>
                </View>

                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12 }}>
                        <Text style={{ fontWeight: 700 }}>Name:</Text> {data.contact?.name || "—"}
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                        <Text style={{ fontWeight: 700 }}>Phone:</Text> {data.contact?.phone || "—"}
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                        <Text style={{ fontWeight: 700 }}>Email:</Text> {data.contact?.email || "—"}
                    </Text>
                    <Text style={{ fontSize: 12, marginTop: 6 }}>
                        <Text style={{ fontWeight: 700 }}>Property:</Text> {data.address?.full || "—"} ({data.address?.city || "—"})
                    </Text>
                </View>

                <View style={{ padding: 12, border: "1pt solid #dedede", marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Your Vision</Text>
                    <Text style={{ fontSize: 11 }}>
                        {data.aduType} • {data.bed} bed • {data.bath} bath • Use: {data.intendedUse}
                    </Text>
                    {data.floorplan?.name ? (
                        <Text style={{ fontSize: 11, marginTop: 4 }}>
                            Selected floorplan: {data.floorplan.name} ({data.floorplan.sqft} sqft)
                        </Text>
                    ) : null}
                </View>

                <View style={{ padding: 12, border: "1pt solid #dedede", marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Snapshot Numbers (Preliminary)</Text>
                    <Text style={{ fontSize: 11 }}>
                        Estimated total cost: {data.outputs?.estimatedTotalCost ? `$${Number(data.outputs.estimatedTotalCost).toLocaleString()}` : "—"}
                    </Text>
                    <Text style={{ fontSize: 11 }}>
                        Estimated monthly payment: {data.outputs?.monthlyPayment ? `$${Number(data.outputs.monthlyPayment).toLocaleString()}` : "—"}
                    </Text>
                    <Text style={{ fontSize: 11 }}>
                        Interest / term: {data.outputs?.interestRate ?? "—"}% • {data.outputs?.termMonths ?? "—"} months
                    </Text>
                </View>

                <View style={{ padding: 12, border: "1pt solid #dedede" }}>
                    <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Why Formal Property Analysis</Text>
                    <Text style={{ fontSize: 11, marginBottom: 6 }}>
                        Any number given without a Formal Property Analysis is marketing — not construction.
                    </Text>
                    <Text style={{ fontSize: 11 }}>
                        We send architects + engineers to answer the property-specific questions that determine real cost, scope, and timeline.
                    </Text>
                    {Array.isArray(data.riskFlags) && data.riskFlags.length ? (
                        <Text style={{ fontSize: 11, marginTop: 8 }}>
                            Focus areas flagged: {data.riskFlags.join(", ")}
                        </Text>
                    ) : null}
                </View>
            </Page>
        </Document>
    );
}
