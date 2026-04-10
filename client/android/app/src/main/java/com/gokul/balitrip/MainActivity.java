package com.gokul.balitrip;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setNavigationBarColor(0xFF1E293B);

        // Push WebView below status bar using native padding (works on Android 15)
        View contentView = findViewById(android.R.id.content);
        contentView.setBackgroundColor(0xFF0F172A); // dark to match app background
        ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
            int top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            v.setPadding(0, top, 0, 0);
            return insets;
        });
    }
}
