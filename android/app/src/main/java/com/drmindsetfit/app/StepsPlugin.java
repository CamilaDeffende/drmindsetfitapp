package com.drmindsetfit.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(
    name = "Steps",
    permissions = {
        @Permission(
            alias = "activityRecognition",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        )
    }
)
public class StepsPlugin extends Plugin implements SensorEventListener {
    private static final String PREFS = "mf_native_steps_v1";
    private static final String KEY_BASELINE_DATE = "baseline_date";
    private static final String KEY_BASELINE_VALUE = "baseline_value";
    private static final String KEY_LAST_RAW = "last_raw_value";

    private SensorManager sensorManager;
    private Sensor stepCounter;
    private SharedPreferences prefs;
    private boolean updatesStarted = false;

    @Override
    public void load() {
        Context context = getContext();
        sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        stepCounter = sensorManager != null ? sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) : null;
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepCounter != null);
        ret.put("platform", "android");
        ret.put("source", "sensor_step_counter");
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("status", "granted");
            call.resolve(ret);
            return;
        }

        if (getPermissionState("activityRecognition") == PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("status", "granted");
            call.resolve(ret);
            return;
        }

        requestPermissionForAlias("activityRecognition", call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = getPermissionState("activityRecognition") == PermissionState.GRANTED;
        ret.put("granted", granted);
        ret.put("status", granted ? "granted" : "denied");
        call.resolve(ret);
    }

    @PluginMethod
    public void getTodaySteps(PluginCall call) {
        if (stepCounter == null) {
            call.resolve(unavailablePayload("sensor_unavailable"));
            return;
        }

        if (!hasPermission()) {
            JSObject ret = unavailablePayload("permission_required");
            ret.put("granted", false);
            call.resolve(ret);
            return;
        }

        final AtomicBoolean resolved = new AtomicBoolean(false);
        final SensorEventListener oneShot = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                if (resolved.getAndSet(true)) return;
                sensorManager.unregisterListener(this);
                call.resolve(buildPayload(Math.round(event.values[0])));
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };

        boolean registered = sensorManager.registerListener(oneShot, stepCounter, SensorManager.SENSOR_DELAY_NORMAL);
        if (!registered) {
            call.resolve(unavailablePayload("register_failed"));
            return;
        }

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (resolved.getAndSet(true)) return;
            sensorManager.unregisterListener(oneShot);
            call.resolve(unavailablePayload("timeout"));
        }, 1500);
    }

    @PluginMethod
    public void startUpdates(PluginCall call) {
        if (stepCounter == null) {
            JSObject ret = new JSObject();
            ret.put("started", false);
            call.resolve(ret);
            return;
        }

        if (!hasPermission()) {
            JSObject ret = new JSObject();
            ret.put("started", false);
            call.resolve(ret);
            return;
        }

        if (!updatesStarted) {
            updatesStarted = sensorManager.registerListener(this, stepCounter, SensorManager.SENSOR_DELAY_UI);
        }

        JSObject ret = new JSObject();
        ret.put("started", updatesStarted);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopUpdates(PluginCall call) {
        if (updatesStarted && sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        updatesStarted = false;

        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        JSObject payload = buildPayload(Math.round(event.values[0]));
        notifyListeners("stepsUpdate", payload);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true;
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACTIVITY_RECOGNITION)
            == PackageManager.PERMISSION_GRANTED;
    }

    private JSObject unavailablePayload(String source) {
        JSObject ret = new JSObject();
        ret.put("available", false);
        ret.put("granted", hasPermission());
        ret.put("steps", 0);
        ret.put("date", todayKey());
        ret.put("source", source);
        ret.put("accurate", false);
        ret.put("distanceMeters", 0);
        return ret;
    }

    private JSObject buildPayload(long rawSteps) {
        String today = todayKey();
        String baselineDate = prefs.getString(KEY_BASELINE_DATE, null);
        long baselineValue = prefs.getLong(KEY_BASELINE_VALUE, rawSteps);
        long lastRaw = prefs.getLong(KEY_LAST_RAW, rawSteps);

        long stepsToday;
        boolean accurate = true;
        String source = "sensor_daily_baseline";

        if (isBootToday()) {
            stepsToday = rawSteps;
            source = "sensor_since_boot";
        } else if (baselineDate == null || !today.equals(baselineDate)) {
            prefs.edit()
                .putString(KEY_BASELINE_DATE, today)
                .putLong(KEY_BASELINE_VALUE, rawSteps)
                .putLong(KEY_LAST_RAW, rawSteps)
                .apply();

            stepsToday = 0;
            accurate = false;
            source = "sensor_baseline_started";
        } else if (rawSteps < baselineValue) {
            // Reboot or sensor reset after baseline.
            prefs.edit()
                .putString(KEY_BASELINE_DATE, today)
                .putLong(KEY_BASELINE_VALUE, rawSteps)
                .putLong(KEY_LAST_RAW, rawSteps)
                .apply();

            stepsToday = isBootToday() ? rawSteps : Math.max(0, rawSteps - lastRaw);
            accurate = isBootToday();
            source = accurate ? "sensor_since_boot" : "sensor_reset_detected";
        } else {
            stepsToday = rawSteps - baselineValue;
            prefs.edit().putLong(KEY_LAST_RAW, rawSteps).apply();
        }

        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("granted", true);
        ret.put("steps", Math.max(0, stepsToday));
        ret.put("date", today);
        ret.put("source", source);
        ret.put("accurate", accurate);
        ret.put("distanceMeters", Math.max(0, stepsToday) * 0.75);
        return ret;
    }

    private boolean isBootToday() {
        long bootTime = System.currentTimeMillis() - SystemClock.elapsedRealtime();
        return dayKey(bootTime).equals(todayKey());
    }

    private String todayKey() {
        return dayKey(System.currentTimeMillis());
    }

    private String dayKey(long millis) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        sdf.setTimeZone(TimeZone.getDefault());
        return sdf.format(new Date(millis));
    }
}
