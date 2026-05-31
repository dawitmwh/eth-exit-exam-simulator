# Exit Examiner - Mobile & WebView Guide

A fully responsive, native-feeling exam preparation platform built with React, Tailwind CSS, and modern web technologies.

## 🎯 Features

### Native-Like Experience
- **Bottom Navigation**: iOS/Android style tab bar on mobile
- **Haptic Feedback**: Vibration feedback for interactions (on supported devices)
- **Smooth Animations**: Motion animations for fluid transitions
- **Pull-to-Refresh Ready**: Disabled overscroll for native feel
- **Safe Area Support**: Properly handles notches and system UI
- **Splash Screen**: Native-style loading experience
- **Offline Detection**: Visual indicator when connection is lost

### Exam Modes
- **Practice Mode**: Learn at your own pace, see answers immediately
- **Simulated Mode**: Real exam conditions with timer and locked navigation

### Core Features
- **Dashboard**: Overview of progress and quick actions
- **Exam Library**: Browse and filter available exams
- **Live Exam Session**: Question navigation with timer
- **Analytics**: Detailed performance tracking with charts
- **User Profile**: Manage account and settings

## 📱 WebView Integration

### For Native App Developers

This app is optimized for webview integration in native iOS and Android apps.

#### iOS (WKWebView)

```swift
import WebKit

let webView = WKWebView()
let url = URL(string: "https://your-app-url.com")!
webView.load(URLRequest(url: url))

// Enable full-screen layout
webView.scrollView.contentInsetAdjustmentBehavior = .never

// Optional: Inject viewport meta tag if needed
let script = WKUserScript(
    source: "document.querySelector('meta[name=viewport]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');",
    injectionTime: .atDocumentEnd,
    forMainFrameOnly: true
)
webView.configuration.userContentController.addUserScript(script)
```

#### Android (WebView)

```kotlin
val webView = WebView(context)
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    databaseEnabled = true
    
    // Enable viewport
    useWideViewPort = true
    loadWithOverviewMode = true
    
    // Enable smooth scrolling
    setSupportZoom(false)
}

webView.loadUrl("https://your-app-url.com")
```

### HTML Meta Tags (Already Included)

The app should include these meta tags in the HTML:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#030213">
```

## 🌐 Progressive Web App (PWA)

The app includes a `manifest.json` for PWA installation:

### Installation
Users can install the app directly from their browser:
- **iOS Safari**: Tap Share → Add to Home Screen
- **Android Chrome**: Tap Menu → Install App

### Manifest Features
- Standalone display mode (no browser UI)
- Custom splash screen
- App icons (192x192, 512x512)
- Portrait orientation lock

## 🎨 Design System

### Colors
- Uses CSS custom properties for theming
- Light and dark mode support
- Consistent color tokens across all components

### Typography
- Responsive font sizes
- System font stack for native feel
- Font smoothing enabled

### Spacing
- Touch-friendly tap targets (minimum 44x44px)
- Adequate spacing for mobile interaction
- Safe area insets handled automatically

## 🔧 Technical Details

### Viewport Height Fix
The app includes a fix for mobile browser address bars:

```typescript
const setVH = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};
```

Use `calc(var(--vh, 1vh) * 100)` instead of `100vh` for full-height elements.

### Touch Optimizations
- `-webkit-tap-highlight-color: transparent` - Removes tap highlight
- `touch-action: manipulation` - Improves responsiveness
- `overscroll-behavior: none` - Prevents pull-to-refresh
- `-webkit-overflow-scrolling: touch` - Smooth scrolling on iOS

### Performance
- Lazy loading with React Router
- Optimized animations with Motion
- Minimal bundle size
- Code splitting by route

## 🚀 Deployment Checklist

### For Production WebView

1. **Set Proper Base URL**: Ensure all assets use absolute paths
2. **Enable HTTPS**: Required for many web APIs (geolocation, camera, etc.)
3. **Configure CORS**: If accessing external APIs
4. **Test Safe Areas**: Verify on devices with notches
5. **Test Orientation**: Both portrait and landscape
6. **Test Offline Mode**: Ensure graceful degradation
7. **Test Haptics**: Verify vibration on supported devices

### Recommended WebView Settings

```javascript
// Disable context menu (long press)
document.addEventListener('contextmenu', e => e.preventDefault());

// Disable text selection on UI elements
CSS: user-select: none;

// Prevent zoom on input focus
<input style="font-size: 16px;"> // iOS won't zoom if font-size >= 16px
```

## 📊 Analytics Integration

The app is ready for analytics integration:

```typescript
// Track page views
window.dataLayer?.push({ event: 'pageview', page: '/exams' });

// Track exam completion
window.dataLayer?.push({ 
  event: 'exam_completed', 
  score: 85,
  duration: 3600 
});
```

## 🔐 Authentication

Current implementation uses mock authentication. To integrate real auth:

1. Replace mock user data in components
2. Add token storage (localStorage/sessionStorage)
3. Implement API interceptors for auth headers
4. Add refresh token logic
5. Handle 401 responses globally

## 📱 Supported Browsers

- **iOS**: Safari 14+, Chrome, Firefox
- **Android**: Chrome 90+, Firefox, Samsung Internet
- **Desktop**: Chrome, Firefox, Safari, Edge (for testing)

## 🎯 Best Practices

1. **Always Test on Real Devices**: Simulators don't show all issues
2. **Test Different Screen Sizes**: iPhone SE to iPad Pro
3. **Test Network Conditions**: 3G, 4G, WiFi, Offline
4. **Test Different OS Versions**: iOS 14-17, Android 10-14
5. **Monitor Performance**: Use React DevTools and Chrome Performance tab

## 🐛 Common Issues

### Issue: Viewport not respecting safe area
**Solution**: Use `env(safe-area-inset-*)` CSS variables

### Issue: Buttons not responding
**Solution**: Ensure buttons have explicit `touch-action: manipulation`

### Issue: Scroll feels laggy
**Solution**: Add `-webkit-overflow-scrolling: touch`

### Issue: Fixed header jumps when scrolling
**Solution**: Use `backdrop-filter` with caution, or avoid on problematic devices

## 📝 License

This project is built for educational purposes as part of the Exit Examiner platform.
