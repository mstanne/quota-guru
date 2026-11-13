/**
 * Thematic comparison pages under /siti-scommesse/<tema> (deposito minimo 5 €, prelievo immediato, cash out,
 * streaming, SPID, metodi di pagamento and one page per method), linked from the "Siti scommesse" menu.
 *
 * Everything is derived from the verified data already used by the operator pages: src/data/operators.ts,
 * src/data/operatorProfiles.ts (per-method limits and times) and offers.json. Nothing is estimated: a value the
 * operator does not state is shown as "Non indicato". No ratings, no ranking: operators are listed alphabetically.
 */
import { isPlaceholder, type OperatorData } from "../data/operators";
import { profileOf } from "../data/operatorProfiles";
import { formatEuro, offerTotals, visibleOffers, type WelcomeOffer } from "../data/offers";
import { publishedOperators } from "./operatorPages";
import { type RouteMeta } from "../routes";
import { paymentMethods, methodPath, topics, topicPath, type PaymentMethodInfo, type Topic, type TopicId } from "./topicDefs";

export * from "./topicDefs";

/** Methods not usable online (cash at shops, post office, vouchers bought in shops, cash pick-up). */
const OFFLINE =
  /punt[oi] vendita|titolo di ricarica|onshop|ricarica (digitale|eurobet)|istituti|sonect|bollettino|postagiro|domicili|assegno|epay|mooney/i;

export interface MethodRow {
  /** Name of the method as written by the operator. */
  method: string;
  deposit: string | null;
  withdrawal: string | null;
  withdrawalTime: string | null;
  fee: string | null;
}

const dash = (v?: string) => (!v || v.trim() === "—" ? null : v);

/** The operator's rows for one method: from the per-method table when there is one, otherwise from its list. */
export function methodRows(op: OperatorData, m: PaymentMethodInfo): MethodRow[] {
  const table = profileOf(op.id)?.payments;
  if (table?.length)
    return table
      .filter((r) => m.match.test(r.method) && !(m.id === "carte" && /postepay/i.test(r.method)))
      .map((r) => ({
        method: r.method,
        deposit: dash(r.deposit),
        withdrawal: dash(r.withdrawal),
        withdrawalTime: dash(r.withdrawalTime),
        fee: dash(r.fee),
      }));
  return op.paymentMethods
    .filter((x) => !isPlaceholder(x) && m.match.test(x))
    .map((x) => ({
      method: x,
      deposit: /solo prelievi/i.test(x) ? null : "Non indicato",
      withdrawal: /solo depositi/i.test(x) ? null : "Non indicato",
      withdrawalTime: null,
      fee: null,
    }));
}

/** true when the operator's data comes with limits and times per method. */
export const hasMethodTable = (op: OperatorData) => !!profileOf(op.id)?.payments?.length;

export const acceptsMethod = (op: OperatorData, m: PaymentMethodInfo) => methodRows(op, m).length > 0;

// ---------- offers ----------

/** The operator's sports welcome offer currently shown on the site (null when none is verified). */
export function sportOffer(op: OperatorData, offers = visibleOffers()): WelcomeOffer | null {
  return offers.find((o) => o.operatorId === op.id && o.sections.includes("sport")) ?? null;
}

export const offerAmount = (o: WelcomeOffer | null) => {
  if (!o) return null;
  const t = offerTotals(o, "sport");
  return [`Fino a ${formatEuro(t.total)}`, t.partLabel].filter(Boolean).join(", ");
};

/** Whether the method can be used for the first deposit of the sports offer: excluded / not excluded / no offer. */
export function bonusStatus(offer: WelcomeOffer | null, m: PaymentMethodInfo): "escluso" | "valido" | null {
  if (!offer) return null;
  return offer.excludedPaymentMethods.some((x) => m.excluded.test(x)) ? "escluso" : "valido";
}

// ---------- minimum deposit ----------

/** Lower bound of a deposit range ("1 – 2.000 €" → 1, "da 5 €" → 5, "fino a 50.000 €" → null). */
const lowerBound = (v: string | null) => {
  if (!v || /^fino a/i.test(v)) return null;
  const m = v.match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(",", ".")) : null;
};

export interface LowDeposit {
  /** Online methods with a minimum deposit of 5 € or less, e.g. "MuchBetter da 1 €". */
  methods: string[];
  /** The lowest online minimum deposit, in euro. */
  min: number;
}

/** Online minimum deposit of 5 € or less, from the per-method table or, without one, from `minDeposit`. */
export function lowDeposit(op: OperatorData, limit = 5): LowDeposit | null {
  const table = profileOf(op.id)?.payments;
  if (table?.length) {
    const rows = table
      .filter((r) => !OFFLINE.test(r.method))
      .map((r) => ({ method: r.method, min: lowerBound(dash(r.deposit) ?? null) }))
      .filter((r): r is { method: string; min: number } => r.min !== null && r.min <= limit)
      .sort((a, b) => a.min - b.min);
    return rows.length ? { methods: rows.map((r) => `${r.method} da ${r.min} €`), min: rows[0].min } : null;
  }
  if (isPlaceholder(op.minDeposit)) return null;
  const min = lowerBound(op.minDeposit);
  return min !== null && min <= limit ? { methods: [op.minDeposit], min } : null;
}

// ---------- withdrawals ----------

export type Speed = "immediato" | "24h" | "oltre";
export const speedLabels: Record<Speed, string> = {
  immediato: "Immediato",
  "24h": "Entro 24 ore",
  oltre: "Oltre 24 ore",
};

function speedOf(time: string): Speed {
  if (/^(generalmente )?immediat|pochi minuti(?! a)/i.test(time)) return "immediato";
  if (/entro (1 giorno|12 ore|24 ore)|^generalmente entro 24|in giornata|^1-4 ore|pochi minuti a 24 ore/i.test(time)) return "24h";
  return "oltre";
}

export interface FastWithdrawal {
  speed: Speed;
  /** Online methods with the fastest stated time. */
  methods: string[];
  /** Time as stated by the operator for those methods. */
  time: string;
}

/** The operator's fastest stated online withdrawal (null when its times are not known). */
export function fastestWithdrawal(op: OperatorData): FastWithdrawal | null {
  const table = profileOf(op.id)?.payments;
  if (table?.length) {
    const rows = table
      .filter((r) => !OFFLINE.test(r.method) && dash(r.withdrawalTime) && dash(r.withdrawal))
      .map((r) => ({ method: r.method, time: r.withdrawalTime.replace(/\*$/, ""), speed: speedOf(r.withdrawalTime) }));
    if (!rows.length) return null;
    const order: Speed[] = ["immediato", "24h", "oltre"];
    const best = order.find((s) => rows.some((r) => r.speed === s))!;
    const top = rows.filter((r) => r.speed === best);
    return { speed: best, methods: top.map((r) => r.method), time: [...new Set(top.map((r) => r.time))].join("; ") };
  }
  return op.fastestWithdrawal ?? null;
}

/** Operators that match a topic (all published operators for "metodi"), alphabetically. */
export function topicOperators(id: TopicId): OperatorData[] {
  const list = publishedOperators().sort((a, b) => a.name.localeCompare(b.name, "it"));
  switch (id) {
    case "deposito-5":
      return list.filter((o) => lowDeposit(o));
    case "prelievo":
      return list.filter((o) => {
        const f = fastestWithdrawal(o);
        return f && f.speed !== "oltre";
      });
    case "cash-out":
      return list.filter((o) => o.cashOut);
    case "streaming":
      return list.filter((o) => o.liveStreaming);
    case "spid":
      return list.filter((o) => o.spidRegistration === true);
    case "metodi":
      return list;
  }
}

export const methodOperators = (m: PaymentMethodInfo) =>
  publishedOperators()
    .sort((a, b) => a.name.localeCompare(b.name, "it"))
    .filter((o) => acceptsMethod(o, m));

export function topicMeta(t: Topic): RouteMeta {
  return { path: topicPath(t), title: t.title, description: t.description };
}

export function methodMeta(m: PaymentMethodInfo): RouteMeta {
  const n = methodOperators(m).length;
  const subject = m.id === "carte" ? "con carta di credito" : m.id === "bitcoin" ? "con Bitcoin e criptovalute" : `con ${m.name}`;
  if (!n)
    return {
      path: methodPath(m),
      title: `Siti scommesse ${subject}: si può usare?`,
      description: `${m.name} sui siti di scommesse ADM: quali operatori lo accettano, perché e quali metodi usare al suo posto, con costi e tempi dai dati degli operatori.`,
    };
  return {
    path: methodPath(m),
    title: `Siti scommesse ${subject}: limiti, tempi e costi`,
    description: `${n} operatori ADM accettano ${m.name}: deposito minimo e massimo, tempi di prelievo, costi, come depositare e prelevare e validità per le offerte di benvenuto.`,
  };
}

/** Card circuit pages: operators that accept cards but do not name this circuit. */
export const cardsWithoutCircuit = (m: PaymentMethodInfo) => {
  if (!m.circuit) return [];
  const carte = paymentMethods.find((x) => x.id === "carte")!;
  return methodOperators(carte).filter((o) => !acceptsMethod(o, m));
};

/** Upper bound of a range ("10 – 2.000 €" → 2000, "fino a 50.000 €" → 50000, "da 10 €" → null). */
const upperBound = (v: string | null) => {
  if (!v || /^da /i.test(v)) return null;
  const nums = [...v.matchAll(/(\d+(?:\.\d{3})*(?:,\d+)?)/g)].map((x) => Number(x[1].replace(/\./g, "").replace(",", ".")));
  return nums.length ? nums[nums.length - 1] : null;
};
const lower = (v: string | null) => {
  if (!v || /^fino a/i.test(v)) return null;
  const x = v.match(/(\d+(?:\.\d{3})*(?:,\d+)?)/);
  return x ? Number(x[1].replace(/\./g, "").replace(",", ".")) : null;
};

export interface Highlight {
  label: string;
  value: string;
  ops: OperatorData[];
}

/** Facts that stand out among the operators' stated values for one method (no ranking: only the extremes). */
export function methodHighlights(m: PaymentMethodInfo): Highlight[] {
  const rows = methodOperators(m).flatMap((op) => methodRows(op, m).map((r) => ({ op, r })));
  const out: Highlight[] = [];
  const pick = (vals: { op: OperatorData; v: number }[], best: (a: number, b: number) => number) => {
    if (!vals.length) return null;
    const top = vals.reduce((a, b) => (best(a.v, b.v) === a.v ? a : b)).v;
    return { v: top, ops: [...new Map(vals.filter((x) => x.v === top).map((x) => [x.op.id, x.op])).values()] };
  };
  const fmt = (n: number) => `${n.toLocaleString("it-IT")} €`;
  const minDep = pick(
    rows.map(({ op, r }) => ({ op, v: lower(r.deposit) })).filter((x): x is { op: OperatorData; v: number } => x.v !== null),
    Math.min,
  );
  if (minDep) out.push({ label: "Deposito minimo più basso", value: fmt(minDep.v), ops: minDep.ops });
  const maxDep = pick(
    rows.map(({ op, r }) => ({ op, v: upperBound(r.deposit) })).filter((x): x is { op: OperatorData; v: number } => x.v !== null),
    Math.max,
  );
  if (maxDep) out.push({ label: "Deposito massimo più alto", value: fmt(maxDep.v), ops: maxDep.ops });
  const maxWd = pick(
    rows.map(({ op, r }) => ({ op, v: upperBound(r.withdrawal) })).filter((x): x is { op: OperatorData; v: number } => x.v !== null),
    Math.max,
  );
  if (maxWd) out.push({ label: "Prelievo massimo più alto", value: fmt(maxWd.v), ops: maxWd.ops });
  const timed = rows.filter(({ r }) => r.withdrawal && r.withdrawalTime);
  const order: Speed[] = ["immediato", "24h", "oltre"];
  for (const sp of order) {
    const hit = timed.filter(({ r }) => speedOf(r.withdrawalTime!) === sp);
    if (hit.length) {
      out.push({
        label: "Prelievo più rapido dichiarato",
        value: speedLabels[sp],
        ops: [...new Map(hit.map(({ op }) => [op.id, op])).values()],
      });
      break;
    }
  }
  return out;
}

export const topicRoutes = (): RouteMeta[] => [...topics.map(topicMeta), ...paymentMethods.map(methodMeta)];
