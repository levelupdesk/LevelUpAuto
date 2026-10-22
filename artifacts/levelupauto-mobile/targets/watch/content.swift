import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "car.fill")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("LevelUpAuto")
                .font(.headline)
            Text("Watch companion")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
