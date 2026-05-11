import { ColumnProfile, Profile } from "../api";
import { formatColumnLabel } from "./columnLabels";

export type DatasetType = "hotel" | "sales" | "generic";
export type FieldRole = "measure" | "dimension" | "timeDimension" | "binaryFlag" | "identifier" | "highMissingField";

export type DatasetIntelligence = {
  chartRecommendations: string[];
  dataQualityNotes: string[];
  description: string;
  insights: Array<{ label: string; value: string; detail: string; tone?: "teal" | "blue" | "amber" | "rose" | "slate" }>;
  kpis: Array<{ label: string; value: string; subtitle: string; tone?: "teal" | "blue" | "amber" | "rose" | "slate" }>;
  summaryStructure: string[];
  suggestedQuestions: string[];
  title: string;
  type: DatasetType;
  typeLabel: string;
};

export function buildDatasetIntelligence(profile: Profile, filename = "uploaded dataset"): DatasetIntelligence {
  const type = detectDatasetType(profile);
  const totalNulls = profile.columns.reduce((sum, column) => sum + column.null_count, 0);
  const totalCells = Math.max(profile.row_count * profile.column_count, 1);
  const dataQuality = ((totalCells - totalNulls) / totalCells) * 100;
  const highMissing = profile.columns.find((column) => column.null_percentage >= 20);

  if (type === "hotel") {
    return buildHotelIntelligence(profile, filename, dataQuality, highMissing);
  }

  if (type === "sales") {
    return buildSalesIntelligence(profile, filename, dataQuality, highMissing);
  }

  return buildGenericIntelligence(profile, filename, dataQuality, highMissing);
}

export function detectDatasetType(profile: Profile): DatasetType {
  const names = new Set(profile.columns.map((column) => normalize(column.name)));
  const hasHotelSignals =
    names.has("hotel") ||
    names.has("is_canceled") ||
    names.has("lead_time") ||
    names.has("adr") ||
    names.has("market_segment");

  if (hasHotelSignals && (names.has("is_canceled") || names.has("adr") || names.has("lead_time"))) {
    return "hotel";
  }

  const hasSalesMeasure = profile.columns.some((column) => {
    const name = normalize(column.name);
    return (
      column.detected_type === "numeric" &&
      (name.includes("sales") ||
        name.includes("revenue") ||
        name.includes("amount") ||
        name.includes("price") ||
        name.includes("profit"))
    );
  });
  const hasSalesDimension = profile.columns.some((column) => {
    const name = normalize(column.name);
    return name.includes("store") || name.includes("product") || name.includes("order") || name.includes("customer");
  });

  return hasSalesMeasure && hasSalesDimension ? "sales" : "generic";
}

export function classifyColumnRole(column: ColumnProfile): FieldRole {
  if (column.null_percentage >= 60) {
    return "highMissingField";
  }

  const name = normalize(column.name);
  const compactName = name.replace(/_/g, "");

  if (
    /\b(date|year|month|week|day|quarter|time)\b/.test(name) ||
    /(^|_)arrival_date_/.test(name) ||
    ["date", "year", "month", "week", "day"].includes(name)
  ) {
    return "timeDimension";
  }

  if (
    name === "id" ||
    name.endsWith("_id") ||
    name.includes("_id_") ||
    name.endsWith("_code") ||
    compactName.endsWith("code") ||
    compactName.endsWith("number") ||
    compactName.includes("identifier")
  ) {
    return "identifier";
  }

  if (isBinaryFlag(column)) {
    return "binaryFlag";
  }

  if (column.detected_type === "numeric" && column.stats) {
    return "measure";
  }

  if (column.detected_type === "datetime") {
    return "timeDimension";
  }

  return "dimension";
}

export function getColumnsByRole(profile: Profile) {
  return {
    measures: profile.columns.filter((column) => classifyColumnRole(column) === "measure"),
    dimensions: profile.columns.filter((column) => classifyColumnRole(column) === "dimension"),
    timeDimensions: profile.columns.filter((column) => classifyColumnRole(column) === "timeDimension"),
    binaryFlags: profile.columns.filter((column) => classifyColumnRole(column) === "binaryFlag"),
    identifiers: profile.columns.filter((column) => classifyColumnRole(column) === "identifier"),
    highMissingFields: profile.columns.filter((column) => classifyColumnRole(column) === "highMissingField"),
  };
}

function buildHotelIntelligence(
  profile: Profile,
  filename: string,
  dataQuality: number,
  highMissing?: ColumnProfile,
): DatasetIntelligence {
  const canceled = findColumn(profile, "is_canceled");
  const hotel = findColumn(profile, "hotel");
  const country = findColumn(profile, "country");
  const adr = findColumn(profile, "adr");
  const leadTime = findColumn(profile, "lead_time");
  const marketSegment = findColumn(profile, "market_segment");

  return {
    chartRecommendations: [
      "Cancellation Rate by Hotel Type",
      "Top Source Countries",
      "Average Daily Rate by Arrival Month",
      "Lead Time vs Cancellation",
      "Market Segment Mix",
    ],
    dataQualityNotes: buildQualityNotes(profile, dataQuality, highMissing),
    description: `${filename} looks like Hotel Booking Demand data. DataLens is prioritizing reservations, cancellations, source markets, rates, and lead-time signals.`,
    insights: [
      canceled?.stats?.mean !== null && canceled?.stats?.mean !== undefined
        ? {
            label: "Cancellation Rate",
            value: `${(canceled.stats.mean * 100).toFixed(1)}%`,
            detail: "Average cancellation outcome across uploaded bookings.",
            tone: canceled.stats.mean > 0.35 ? "rose" : "teal",
          }
        : null,
      hotel?.top_values?.length
        ? {
            label: "City Hotel vs Resort Hotel",
            value: hotel.top_values.slice(0, 2).map((item) => `${item.value}: ${item.count.toLocaleString()}`).join(" vs "),
            detail: "Booking volume comparison by hotel type.",
            tone: "blue",
          }
        : null,
      country?.top_values?.[0]
        ? {
            label: "Top Source Country",
            value: country.top_values[0].value,
            detail: `${country.top_values[0].count.toLocaleString()} rows originate from this market.`,
            tone: "slate",
          }
        : null,
      leadTime?.stats?.mean !== null && leadTime?.stats?.mean !== undefined
        ? {
            label: "Average Lead Time",
            value: `${leadTime.stats.mean.toFixed(0)} days`,
            detail: "Mean booking window before arrival.",
            tone: "amber",
          }
        : null,
      marketSegment?.top_values?.[0]
        ? {
            label: "Top Market Segment",
            value: marketSegment.top_values[0].value,
            detail: "Dominant customer acquisition segment.",
            tone: "teal",
          }
        : null,
    ].filter(Boolean) as DatasetIntelligence["insights"],
    kpis: [
      { label: "Total Bookings", value: profile.row_count.toLocaleString(), subtitle: "Rows loaded", tone: "slate" },
      canceled?.stats?.mean !== null && canceled?.stats?.mean !== undefined
        ? { label: "Cancellation Rate", value: `${(canceled.stats.mean * 100).toFixed(1)}%`, subtitle: "Canceled bookings share", tone: "rose" }
        : null,
      adr?.stats?.mean !== null && adr?.stats?.mean !== undefined
        ? { label: "Average Daily Rate", value: formatNumber(adr.stats.mean), subtitle: "Mean ADR", tone: "teal" }
        : null,
      country?.top_values?.[0]
        ? { label: "Top Source Country", value: country.top_values[0].value, subtitle: "Largest source market", tone: "blue" }
        : null,
      { label: "Data Quality", value: `${dataQuality.toFixed(1)}%`, subtitle: "Completeness score", tone: "amber" },
    ].filter(Boolean) as DatasetIntelligence["kpis"],
    summaryStructure: [
      "Cancellation performance",
      "Hotel type comparison",
      "Source market concentration",
      "ADR and lead-time signals",
      "Data quality notes",
    ],
    suggestedQuestions: [
      "What is the overall cancellation rate and how does it differ between City Hotel and Resort Hotel?",
      "Which countries are the top 10 source markets?",
      "How does lead time correlate with cancellation probability?",
      "What is the average daily rate by month?",
      "Which market segments have the highest repeat guest rates?",
    ],
    title: "Hotel Booking Analytics Workspace",
    type: "hotel",
    typeLabel: "Hotel Booking",
  };
}

function buildSalesIntelligence(
  profile: Profile,
  filename: string,
  dataQuality: number,
  highMissing?: ColumnProfile,
): DatasetIntelligence {
  const salesMetric = findFirstMatching(profile, ["weekly_sales", "sales", "revenue", "amount", "profit"]);
  const store = findFirstMatching(profile, ["store", "store_id", "store_number"]);
  const date = findFirstMatching(profile, ["date", "order_date", "month"]);
  const holiday = findFirstMatching(profile, ["holiday_flag", "holiday", "is_holiday"]);
  const economicDrivers = profile.columns.filter((column) =>
    ["temperature", "fuel_price", "cpi", "unemployment"].includes(normalize(column.name)),
  );
  const totalSales =
    salesMetric?.stats?.mean !== null && salesMetric?.stats?.mean !== undefined
      ? salesMetric.stats.mean * profile.row_count
      : null;

  return {
    chartRecommendations: [
      `${formatColumnLabel(salesMetric?.name ?? "sales")} Trend Over Time`,
      `${formatColumnLabel(salesMetric?.name ?? "sales")} by ${formatColumnLabel(store?.name ?? "store")}`,
      holiday ? "Holiday vs Non-Holiday Sales" : "Top Category Sales Breakdown",
      ...economicDrivers.slice(0, 3).map((column) => `${formatColumnLabel(column.name)} Relationship with ${formatColumnLabel(salesMetric?.name ?? "sales")}`),
    ],
    dataQualityNotes: buildQualityNotes(profile, dataQuality, highMissing),
    description: `${filename} looks like Retail/Sales data. DataLens is prioritizing sales volume, store or product performance, date trends, holiday effects, and external drivers.`,
    insights: [
      salesMetric?.stats?.mean !== null && salesMetric?.stats?.mean !== undefined
        ? {
            label: `Average ${formatColumnLabel(salesMetric.name)}`,
            value: formatNumber(salesMetric.stats.mean),
            detail: "Mean sales value from the uploaded profile.",
            tone: "teal",
          }
        : null,
      totalSales !== null
        ? {
            label: "Estimated Total Sales",
            value: formatNumber(totalSales),
            detail: "Estimated from average sales multiplied by row count.",
            tone: "blue",
          }
        : null,
      store?.top_values?.[0]
        ? {
            label: "Best Covered Store",
            value: store.top_values[0].value,
            detail: `${store.top_values[0].count.toLocaleString()} rows available for this store.`,
            tone: "slate",
          }
        : null,
      holiday
        ? {
            label: "Holiday Analysis Ready",
            value: formatColumnLabel(holiday.name),
            detail: "The dataset contains a holiday indicator for sales comparison.",
            tone: "amber",
          }
        : null,
    ].filter(Boolean) as DatasetIntelligence["insights"],
    kpis: [
      totalSales !== null
        ? { label: "Total Sales", value: formatNumber(totalSales), subtitle: "Estimated from profile", tone: "blue" }
        : null,
      salesMetric?.stats?.mean !== null && salesMetric?.stats?.mean !== undefined
        ? { label: `Average ${formatColumnLabel(salesMetric.name)}`, value: formatNumber(salesMetric.stats.mean), subtitle: "Mean sales metric", tone: "teal" }
        : null,
      store?.top_values?.[0]
        ? { label: "Best Performing Store", value: store.top_values[0].value, subtitle: "Most represented store in profile", tone: "slate" }
        : null,
      { label: "Data Quality", value: `${dataQuality.toFixed(1)}%`, subtitle: "Completeness score", tone: "amber" },
    ].filter(Boolean) as DatasetIntelligence["kpis"],
    summaryStructure: [
      "Sales volume and average sales",
      date ? "Sales trend over time" : "Available time fields",
      store ? "Store performance coverage" : "Available category dimensions",
      holiday ? "Holiday vs non-holiday comparison" : "Dominant segments",
      "Data quality notes",
    ],
    suggestedQuestions: [
      `What is the total ${formatColumnLabel(salesMetric?.name ?? "sales")} and average ${formatColumnLabel(salesMetric?.name ?? "sales")}?`,
      store ? `Which ${formatColumnLabel(store.name)} has the strongest sales signal?` : "Which segment contributes the most rows?",
      date ? `How does ${formatColumnLabel(salesMetric?.name ?? "sales")} trend over ${formatColumnLabel(date.name)}?` : "Which numeric metric varies the most?",
      holiday ? "How do holiday and non-holiday sales compare?" : "Which categories should I compare first?",
      economicDrivers[0] ? `How does ${formatColumnLabel(economicDrivers[0].name)} relate to ${formatColumnLabel(salesMetric?.name ?? "sales")}?` : "What data quality issues should I fix first?",
    ],
    title: "Retail Sales Analytics Workspace",
    type: "sales",
    typeLabel: "Retail / Sales",
  };
}

function buildGenericIntelligence(
  profile: Profile,
  filename: string,
  dataQuality: number,
  highMissing?: ColumnProfile,
): DatasetIntelligence {
  const roles = getColumnsByRole(profile);
  const numericColumns = roles.measures;
  const categoricalColumns = roles.dimensions.filter((column) => column.top_values?.length);
  const primaryNumeric = numericColumns[0];
  const primaryCategory = categoricalColumns[0];

  return {
    chartRecommendations: [
      primaryCategory ? `${formatColumnLabel(primaryCategory.name)} Breakdown` : "Category Breakdown",
      primaryNumeric ? `${formatColumnLabel(primaryNumeric.name)} Distribution` : "Numeric Measure Distribution",
      "Column Completeness",
      "Dominant Categories",
      "Missing Value Review",
    ],
    dataQualityNotes: buildQualityNotes(profile, dataQuality, highMissing),
    description: `${filename} does not match a specialized template yet, so DataLens built a generic analytics workspace from detected numeric, categorical, date, and text columns.`,
    insights: [
      primaryCategory?.top_values?.[0]
        ? {
            label: `Dominant ${formatColumnLabel(primaryCategory.name)}`,
            value: primaryCategory.top_values[0].value,
            detail: `${primaryCategory.top_values[0].count.toLocaleString()} rows are in this top segment.`,
            tone: "blue",
          }
        : null,
      primaryNumeric?.stats?.mean !== null && primaryNumeric?.stats?.mean !== undefined
        ? {
            label: `Average ${formatColumnLabel(primaryNumeric.name)}`,
            value: formatNumber(primaryNumeric.stats.mean),
            detail: "Primary numeric measure detected from the uploaded profile.",
            tone: "teal",
          }
        : null,
      highMissing
        ? {
            label: "Quality Watch",
            value: formatColumnLabel(highMissing.name),
            detail: `${highMissing.null_percentage}% missing values in this field.`,
            tone: "amber",
          }
        : {
            label: "Quality Watch",
            value: "No major warning",
            detail: "No column exceeds 20% missing values.",
            tone: "slate",
          },
    ].filter(Boolean) as DatasetIntelligence["insights"],
    kpis: [
      { label: "Total Rows", value: profile.row_count.toLocaleString(), subtitle: "Records loaded", tone: "slate" },
      { label: "Total Columns", value: profile.column_count.toLocaleString(), subtitle: "Fields detected", tone: "blue" },
      { label: "Data Quality", value: `${dataQuality.toFixed(1)}%`, subtitle: "Completeness score", tone: "teal" },
      primaryNumeric?.stats?.mean !== null && primaryNumeric?.stats?.mean !== undefined
        ? { label: `Average ${formatColumnLabel(primaryNumeric.name)}`, value: formatNumber(primaryNumeric.stats.mean), subtitle: "Primary numeric field", tone: "amber" }
        : null,
    ].filter(Boolean) as DatasetIntelligence["kpis"],
    summaryStructure: [
      "Dataset size and schema",
      "Important numeric measures",
      "Important categorical segments",
      "Missing value warnings",
      "Recommended next analysis",
    ],
    suggestedQuestions: [
      "What are the most important numeric measures in this dataset?",
      primaryCategory ? `Which ${formatColumnLabel(primaryCategory.name)} values dominate the dataset?` : "Which categories dominate the dataset?",
      primaryNumeric ? `What is the average ${formatColumnLabel(primaryNumeric.name)}?` : "Which columns should I analyze first?",
      "Which columns have the most missing values?",
      "What dashboard should I build from this CSV?",
    ],
    title: "Generic CSV Analytics Workspace",
    type: "generic",
    typeLabel: "Generic CSV",
  };
}

function buildQualityNotes(profile: Profile, dataQuality: number, highMissing?: ColumnProfile) {
  const notes = [
    `${profile.row_count.toLocaleString()} rows and ${profile.column_count.toLocaleString()} columns were profiled.`,
    `Overall completeness score is ${dataQuality.toFixed(1)}%.`,
  ];

  if (highMissing) {
    notes.push(`${formatColumnLabel(highMissing.name)} has ${highMissing.null_percentage}% missing values and should be reviewed.`);
  } else {
    notes.push("No column exceeds the 20% missing-value warning threshold.");
  }

  return notes;
}

function findColumn(profile: Profile, columnName: string) {
  return profile.columns.find((column) => normalize(column.name) === normalize(columnName));
}

function findFirstMatching(profile: Profile, candidates: string[]) {
  const normalizedCandidates = candidates.map(normalize);
  return profile.columns.find((column) => {
    const name = normalize(column.name);
    return normalizedCandidates.some((candidate) => name === candidate || name.includes(candidate));
  });
}

function isBinaryFlag(column: ColumnProfile) {
  const name = normalize(column.name);
  const stats = column.stats;
  const nameLooksBinary =
    name.startsWith("is_") ||
    name.endsWith("_flag") ||
    name.endsWith("_status") ||
    ["holiday", "holiday_flag", "is_canceled", "is_repeated_guest"].includes(name);

  return (
    column.detected_type === "numeric" &&
    !!stats &&
    stats.min === 0 &&
    stats.max === 1 &&
    column.unique_value_count <= 2 &&
    stats.mean !== null &&
    stats.mean !== undefined &&
    (nameLooksBinary || column.unique_value_count <= 2)
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
