// "use client";

// import type { QuestionDef, Option } from "@/lib/feasibility/types";
// import styles from "./QuestionRenderer.module.css";

// function CardGrid({
//     options,
//     value,
//     onChange,
// }: {
//     options: Option[];
//     value: any;
//     onChange: (v: any) => void;
// }) {
//     return (
//         <div className={styles.cardGrid}>
//             {options.map((o) => {
//                 const active = value === o.value;
//                 return (
//                     <button
//                         key={o.value}
//                         type="button"
//                         className={`${styles.card} ${active ? styles.cardActive : ""}`}
//                         onClick={() => onChange(o.value)}
//                     >
//                         <div className={styles.cardTop}>
//                             <div className={styles.cardTitle}>{o.title ?? o.label ?? o.value}</div>
//                             {o.meta ? <div className={styles.cardMeta}>{o.meta}</div> : null}
//                         </div>
//                         {o.desc ? <div className={styles.cardDesc}>{o.desc}</div> : null}
//                     </button>
//                 );
//             })}
//         </div>
//     );
// }

// function PillRow({
//     options,
//     value,
//     onChange,
// }: {
//     options: Option[];
//     value: any;
//     onChange: (v: any) => void;
// }) {
//     return (
//         <div className={styles.pillRow}>
//             {options.map((o) => {
//                 const active = value === o.value;
//                 return (
//                     <button
//                         key={o.value}
//                         type="button"
//                         className={`${styles.pill} ${active ? styles.pillActive : ""}`}
//                         onClick={() => onChange(o.value)}
//                     >
//                         {o.label ?? o.title ?? o.value}
//                     </button>
//                 );
//             })}
//         </div>
//     );
// }

// function MultiPillRow({
//     options,
//     value,
//     onChange,
// }: {
//     options: Option[];
//     value: string[];
//     onChange: (v: string[]) => void;
// }) {
//     const selected = Array.isArray(value) ? value : [];
//     return (
//         <div className={styles.pillRow}>
//             {options.map((o) => {
//                 const active = selected.includes(o.value);
//                 return (
//                     <button
//                         key={o.value}
//                         type="button"
//                         className={`${styles.pill} ${active ? styles.pillActive : ""}`}
//                         onClick={() => {
//                             if (active) onChange(selected.filter((x) => x !== o.value));
//                             else onChange([...selected, o.value]);
//                         }}
//                     >
//                         {o.label ?? o.title ?? o.value}
//                     </button>
//                 );
//             })}
//         </div>
//     );
// }

// function Stepper({
//     value,
//     onChange,
//     min,
//     max,
//     step,
//     format,
// }: {
//     value: number | null | undefined;
//     onChange: (v: number) => void;
//     min: number;
//     max: number;
//     step: number;
//     format?: (n: number) => string;
// }) {
//     const v = typeof value === "number" ? value : min;
//     const dec = () => onChange(Math.max(min, Number((v - step).toFixed(2))));
//     const inc = () => onChange(Math.min(max, Number((v + step).toFixed(2))));

//     return (
//         <div className={styles.stepper}>
//             <button type="button" className={styles.stepperBtn} onClick={dec}>
//                 −
//             </button>
//             <div className={styles.stepperValue}>{format ? format(v) : v}</div>
//             <button type="button" className={styles.stepperBtn} onClick={inc}>
//                 +
//             </button>
//         </div>
//     );
// }

// export default function QuestionRenderer({
//     question,
//     value,
//     onChange,
//     // escape hatch for your special screens
//     renderInfo,
//     renderAction,
//     renderDynamicCards,
// }: {
//     question: QuestionDef;
//     value: any;
//     onChange: (v: any) => void;

//     // Optional hooks for “info” and “action” screens
//     renderInfo?: (q: QuestionDef) => React.ReactNode;
//     renderAction?: (q: QuestionDef) => React.ReactNode;

//     // For dynamic cardSelect (like floorplans fetched from Sanity)
//     renderDynamicCards?: (q: QuestionDef) => React.ReactNode;
// }) {
//     return (
//         <section className={styles.wrap}>
//             <div className={styles.header}>
//                 <h2 className={styles.title}>{question.title}</h2>
//                 {question.helper ? <p className={styles.helper}>{question.helper}</p> : null}
//             </div>

//             {question.type === "info" ? (
//                 <div className={styles.cardShell}>
//                     {renderInfo ? renderInfo(question) : <p className={styles.helper}>Info screen</p>}
//                 </div>
//             ) : null}

//             {question.type === "action" ? (
//                 <div className={styles.cardShell}>
//                     {renderAction ? renderAction(question) : null}
//                 </div>
//             ) : null}

//             {question.type === "cardSelect" ? (
//                 question.options?.length ? (
//                     <CardGrid options={question.options} value={value} onChange={onChange} />
//                 ) : (
//                     // dynamic options (e.g., floorplans from Sanity)
//                     <div>{renderDynamicCards ? renderDynamicCards(question) : null}</div>
//                 )
//             ) : null}

//             {question.type === "pillSelect" ? (
//                 <PillRow options={question.options ?? []} value={value} onChange={onChange} />
//             ) : null}

//             {question.type === "multiPillSelect" ? (
//                 <MultiPillRow options={question.options ?? []} value={value ?? []} onChange={onChange} />
//             ) : null}

//             {question.type === "stepper" ? (
//                 <Stepper
//                     value={value}
//                     onChange={onChange}
//                     min={question.stepper!.min}
//                     max={question.stepper!.max}
//                     step={question.stepper!.step}
//                     format={question.stepper?.format}
//                 />
//             ) : null}

//             {question.type === "select" ? (
//                 <select className={styles.select} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
//                     <option value="">{question.placeholder ?? "Select one…"}</option>
//                     {(question.options ?? []).map((o) => (
//                         <option key={o.value} value={o.value}>
//                             {o.label ?? o.title ?? o.value}
//                         </option>
//                     ))}
//                 </select>
//             ) : null}

//             {question.type === "text" ? (
//                 <input
//                     className={styles.input}
//                     value={value ?? ""}
//                     onChange={(e) => onChange(e.target.value)}
//                     placeholder="Type here…"
//                 />
//             ) : null}
//         </section>
//     );
// }
