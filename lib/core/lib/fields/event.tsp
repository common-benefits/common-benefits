import "../types.tsp";

namespace CommonBenefits.Fields;

using Types;

/** Type of event (e.g., a single date, a date range, or a custom event).
 *
 * - `singleDate`: A single date (and possible time).
 * - `dateRange`: A period of time with a start and end date.
 * - `other`: Other event type (e.g., a recurring event).
 */
@Versioning.added(Versions.v0_1)
enum EventType {
  /** A single date with no time. */
  singleDate,

  /** A range of dates with no time. */
  dateRange,

  /** Other event type. */
  other,
}

/** Union of all event types. */
@Versioning.added(Versions.v0_1)
union Event {
  /** A single date event. */
  singleDate: SingleDateEvent,

  /** A date range event. */
  dateRange: DateRangeEvent,

  /** Other event type. */
  other: OtherEvent,
}

/** Base model for all events. */
@discriminator("eventType")
@Versioning.added(Versions.v0_1)
model EventBase {
  /** Human-readable name of the event. */
  name: string;

  /** Type of event. */
  eventType: EventType;

  /** Description of what this event represents. */
  description?: string;
}

/** An event that has a date (and possible time) associated with it. */
@example(Examples.Event.applicationOpens, #{ title: "Application opens" })
@example(Examples.Event.applicationCloses, #{ title: "Application closes" })
@Versioning.added(Versions.v0_1)
model SingleDateEvent extends EventBase {
  /** Type of event. */
  eventType: EventType.singleDate;

  /** Date of the event in ISO 8601 format: YYYY-MM-DD. */
  date: isoDate;

  /** Time of the event in ISO 8601 format: HH:MM:SS. */
  time?: isoTime;
}

/** An event that has a start and end date (and possible time) associated with it. */
@example(Examples.Event.enrollmentPeriod, #{ title: "Enrollment period" })
@Versioning.added(Versions.v0_1)
model DateRangeEvent extends EventBase {
  /** Type of event. */
  eventType: EventType.dateRange;

  /** Start date of the event in ISO 8601 format: YYYY-MM-DD. */
  startDate: isoDate;

  /** Start time of the event in ISO 8601 format: HH:MM:SS. */
  startTime?: isoTime;

  /** End date of the event in ISO 8601 format: YYYY-MM-DD. */
  endDate: isoDate;

  /** End time of the event in ISO 8601 format: HH:MM:SS. */
  endTime?: isoTime;
}

/** An event that is not a single date or date range. */
@example(Examples.Event.infoSessions, #{ title: "Info sessions" })
@Versioning.added(Versions.v0_1)
model OtherEvent extends EventBase {
  /** Type of event. */
  eventType: EventType.other;

  /** Details of the event's timeline (e.g. "Every other Tuesday"). */
  details?: string;
}

namespace Examples.Event {
  const applicationOpens = #{
    name: "Application opens",
    eventType: EventType.singleDate,
    date: isoDate.fromISO("2024-01-15"),
    description: "Applications begin being accepted.",
  };

  const applicationCloses = #{
    name: "Application closes",
    eventType: EventType.singleDate,
    date: isoDate.fromISO("2024-12-31"),
    time: isoTime.fromISO("17:00:00"),
    description: "Applications stop being accepted.",
  };

  const enrollmentPeriod = #{
    name: "Enrollment period",
    eventType: EventType.dateRange,
    startDate: isoDate.fromISO("2024-01-01"),
    endDate: isoDate.fromISO("2024-01-31"),
    endTime: isoTime.fromISO("17:00:00"),
    description: "Open enrollment window.",
  };

  const infoSessions = #{
    name: "Info sessions",
    eventType: EventType.other,
    details: "Every other Tuesday at 10:00 AM during the enrollment period.",
    description: "Live info sessions for prospective applicants.",
  };
}
