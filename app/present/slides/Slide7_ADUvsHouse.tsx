"use client";

import React from "react";
import { usePresentationStore } from "@/lib/store/presentationStore";
import s from "./Slide7.module.css";
import { ProposalFooter } from "./_shared/ProposalFooter";

function fmt$(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtNeg(n: number) {
    if (!n) return "$0";
    return `−${fmt$(n)}`;
}

function fmtSigned(n: number) {
    if (!n) return "$0";
    return n > 0 ? `+${fmt$(n)}` : `−${fmt$(Math.abs(n))}`;
}

function fmtMo(n?: number) {
    return n != null && n !== 0 ? `${fmt$(n)}/mo` : "—";
}

function val(n?: number) {
    return n != null ? fmt$(n) : "—";
}

export function Slide7_ADUvsHouse() {
    const { scenarios, comparedUnitIds, floorplans } = usePresentationStore();

    const aduScenarios = scenarios.filter((sc) => sc.kind === "adu");
    const compared = comparedUnitIds.length > 0
        ? aduScenarios.filter((sc) => comparedUnitIds.includes(sc.key.replace(/^adu_/, "")))
        : aduScenarios;
    const displayAdus = compared.length > 0 ? compared : aduScenarios;
    const house = scenarios.find((sc) => sc.kind === "house");

    function getFpName(key: string) {
        const id = key.replace(/^adu_/, "");
        const fp = floorplans.find((f) => f._id === id);
        return fp?.name ?? id;
    }

    return (
        <div className={s.slide}>
            <div className={s.banner}>
                <h1 className={s.bannerTitle}>ADU vs Purchasing a House</h1>
            </div>

            <div className={s.body}>
                <div className={s.tableWrap}>
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th className={s.thHead}>Costs</th>
                                <th className={s.thHead}>House</th>
                                {displayAdus.map((sc) => (
                                    <th key={sc.key} className={s.thHead}>
                                        <span className={s.thAduLabel}>ADU</span>
                                        <span className={s.thAduName}>{getFpName(sc.key)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={s.tdLabel}>Purchase Price</td>
                                <td className={s.tdValue}>{val(house?.purchasePrice)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>
                                        {val(sc.finalAduPrice ?? sc.purchasePrice)}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className={s.tdLabel}>Down Payment</td>
                                <td className={s.tdValue}>{val(house?.downPayment)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>$0</td>
                                ))}
                            </tr>
                            <tr>
                                <td className={s.tdLabel}>Remodel</td>
                                <td className={s.tdValue}>{val(house?.remodelCost)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>—</td>
                                ))}
                            </tr>

                            <tr className={s.rowAccent}>
                                <td className={s.tdLabel}>Cost Out of Pocket</td>
                                <td className={s.tdValue}>
                                    {fmtNeg((house?.downPayment ?? 0) + (house?.remodelCost ?? 0))}
                                </td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>$0</td>
                                ))}
                            </tr>

                            <tr>
                                <td className={s.tdLabel}>Monthly Payment</td>
                                <td className={s.tdValue}>{fmtMo(house?.mtgPaymentMonthly)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>{fmtMo(sc.mtgPaymentMonthly)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className={s.tdLabel}>Property Tax</td>
                                <td className={s.tdValue}>{fmtMo(house?.propertyTaxMonthly)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>{fmtMo(sc.propertyTaxMonthly)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className={s.tdLabel}>Insurance</td>
                                <td className={s.tdValue}>{fmtMo(house?.insuranceMonthly)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>{fmtMo(sc.insuranceMonthly)}</td>
                                ))}
                            </tr>
                            <tr>
                                <td className={s.tdLabel}>Maintenance</td>
                                <td className={s.tdValue}>{fmtMo(house?.maintenanceMonthly)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>{fmtMo(sc.maintenanceMonthly)}</td>
                                ))}
                            </tr>

                            <tr className={s.rowAccent}>
                                <td className={s.tdLabel}>Monthly Cost</td>
                                <td className={s.tdValue}>{house?.monthlyCost ? `${fmtNeg(house.monthlyCost)}/mo` : "—"}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>
                                        {sc.monthlyCost ? `${fmtNeg(sc.monthlyCost)}/mo` : "—"}
                                    </td>
                                ))}
                            </tr>

                            <tr>
                                <td className={s.tdLabel}>Rent</td>
                                <td className={s.tdValue}>{fmtMo(house?.rentMonthly)}</td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={s.tdValue}>{fmtMo(sc.rentMonthly)}</td>
                                ))}
                            </tr>

                            <tr className={s.rowAccent}>
                                <td className={s.tdLabel}>Cashflow</td>
                                <td className={`${s.tdValue} ${(house?.cashflowMonthly ?? 0) < 0 ? s.neg : ""}`}>
                                    {house?.cashflowMonthly != null ? `${fmtSigned(house.cashflowMonthly)}/mo` : "—"}
                                </td>
                                {displayAdus.map((sc) => (
                                    <td key={sc.key} className={`${s.tdValue} ${(sc.cashflowMonthly ?? 0) >= 0 ? s.pos : s.neg}`}>
                                        {sc.cashflowMonthly != null ? `${fmtSigned(sc.cashflowMonthly)}/mo` : "—"}
                                    </td>
                                ))}
                            </tr>

                            <tr className={s.rowCap}>
                                <td colSpan={2 + displayAdus.length}>&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <ProposalFooter
                pageNum={7}
                pageTotal={9}
                disclaimer="Backyard Estates does not guarantee rental income or long-term property value. The homeowner is responsible for their own analysis."
            />
        </div>
    );
}
