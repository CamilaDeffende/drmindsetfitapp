import Foundation
import Capacitor
import CoreMotion

@objc(StepsPlugin)
public class StepsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StepsPlugin"
    public let jsName = "Steps"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTodaySteps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startUpdates", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopUpdates", returnType: CAPPluginReturnPromise)
    ]

    private let pedometer = CMPedometer()
    private var isUpdating = false

    @objc public func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": CMPedometer.isStepCountingAvailable(),
            "platform": "ios",
            "source": "coremotion_pedometer"
        ])
    }

    @objc public func requestPermissions(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve([
                "granted": false,
                "status": "unavailable"
            ])
            return
        }

        queryToday { data, error in
            if let error = error {
                let nsError = error as NSError
                let denied = nsError.domain == CMErrorDomain
                call.resolve([
                    "granted": false,
                    "status": denied ? "denied" : "error"
                ])
                return
            }

            let _ = data
            call.resolve([
                "granted": true,
                "status": "granted"
            ])
        }
    }

    @objc public func getTodaySteps(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve(unavailablePayload(source: "coremotion_unavailable"))
            return
        }

        queryToday { data, error in
            if let error = error {
                let nsError = error as NSError
                call.resolve([
                    "available": false,
                    "granted": false,
                    "steps": 0,
                    "date": self.todayKey(),
                    "source": nsError.domain == CMErrorDomain ? "permission_required" : "coremotion_error",
                    "accurate": false,
                    "distanceMeters": 0
                ])
                return
            }

            call.resolve(self.payload(from: data, source: "coremotion_query"))
        }
    }

    @objc public func startUpdates(_ call: CAPPluginCall) {
        guard CMPedometer.isStepCountingAvailable() else {
            call.resolve(["started": false])
            return
        }

        if isUpdating {
            call.resolve(["started": true])
            return
        }

        pedometer.startUpdates(from: startOfDay()) { [weak self] data, error in
            guard let self = self, error == nil else { return }
            self.notifyListeners("stepsUpdate", data: self.payload(from: data, source: "coremotion_live"))
        }

        isUpdating = true
        call.resolve(["started": true])
    }

    @objc public func stopUpdates(_ call: CAPPluginCall) {
        pedometer.stopUpdates()
        isUpdating = false
        call.resolve(["stopped": true])
    }

    private func queryToday(completion: @escaping (CMPedometerData?, Error?) -> Void) {
        pedometer.queryPedometerData(from: startOfDay(), to: Date(), withHandler: completion)
    }

    private func payload(from data: CMPedometerData?, source: String) -> [String: Any] {
        let steps = data?.numberOfSteps.intValue ?? 0
        let distance = data?.distance?.doubleValue ?? Double(steps) * 0.75

        return [
            "available": true,
            "granted": true,
            "steps": max(0, steps),
            "date": todayKey(),
            "source": source,
            "accurate": true,
            "distanceMeters": max(0, distance)
        ]
    }

    private func unavailablePayload(source: String) -> [String: Any] {
        return [
            "available": false,
            "granted": false,
            "steps": 0,
            "date": todayKey(),
            "source": source,
            "accurate": false,
            "distanceMeters": 0
        ]
    }

    private func startOfDay() -> Date {
        return Calendar.current.startOfDay(for: Date())
    }

    private func todayKey() -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}
