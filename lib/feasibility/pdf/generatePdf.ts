import { pdf } from "@react-pdf/renderer";
import { FeasibilityPdf } from "./FeasibilityPdf";

export async function generateFeasibilityPdfBytes(data: any) {
    console.log(data);
    const instance = pdf(FeasibilityPdf({ data }));
    const buf = await instance.toBuffer();
    return buf;
}
