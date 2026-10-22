import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        completion(SimpleEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
        let entry = SimpleEntry(date: Date())
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

struct LevelUpAutoWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("LevelUpAuto")
                .font(.headline)
            Text(entry.date, style: .time)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct LevelUpAutoWidget: Widget {
    let kind: String = "LevelUpAutoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            LevelUpAutoWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("LevelUpAuto")
        .description("Vehicle status at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct LevelUpAutoWidgetBundle: WidgetBundle {
    var body: some Widget {
        LevelUpAutoWidget()
    }
}
