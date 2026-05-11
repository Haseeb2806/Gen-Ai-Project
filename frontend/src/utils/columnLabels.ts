const SPECIAL_LABELS: Record<string, string> = {
  adr: "Average Daily Rate",
  arrival_date_day_of_month: "Arrival Day of Month",
  arrival_date_month: "Arrival Month",
  arrival_date_week_number: "Arrival Week Number",
  arrival_date_year: "Arrival Year",
  assigned_room_type: "Assigned Room Type",
  country: "Source Country",
  customer_type: "Customer Type",
  cpi: "Consumer Price Index",
  date: "Date",
  deposit_type: "Deposit Type",
  distribution_channel: "Distribution Channel",
  fuel_price: "Fuel Price",
  holiday_flag: "Holiday Week",
  hotel: "Hotel Type",
  is_canceled: "Cancellation Status",
  is_repeated_guest: "Repeat Guest Status",
  lead_time: "Lead Time",
  market_segment: "Market Segment",
  previous_bookings_not_canceled: "Previous Non-Canceled Bookings",
  previous_cancellations: "Previous Cancellations",
  required_car_parking_spaces: "Required Car Parking Spaces",
  reservation_status_date: "Reservation Status Date",
  reserved_room_type: "Reserved Room Type",
  revenue: "Revenue",
  sales: "Sales",
  store: "Store",
  store_id: "Store ID",
  temperature: "Temperature",
  total_of_special_requests: "Total Special Requests",
  unemployment: "Unemployment Rate",
  weekly_sales: "Weekly Sales",
};

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to"]);

export function humanizeColumnName(columnName: string): string {
  const normalized = columnName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return columnName;

  return normalized
    .split(" ")
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function formatColumnLabel(columnName: string): string {
  return SPECIAL_LABELS[columnName.toLowerCase()] ?? humanizeColumnName(columnName);
}
