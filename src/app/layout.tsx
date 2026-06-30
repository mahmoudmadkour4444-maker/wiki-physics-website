import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ويكي فيزياء | Wiki Physics",
  description: "منصة تعليمية متخصصة في الفيزياء للطالب العربي — مبنية على الفهم الحقيقي لا الحفظ",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Security: Disable wayback machine caching */}
        <meta name="robots" content="noarchive, nocache" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {/* Client-side protection script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ===== ANTI-THEFT PROTECTION =====
              (function(){
                // Disable right-click context menu globally
                document.addEventListener('contextmenu', function(e){ e.preventDefault(); }, true);

                // Disable keyboard shortcuts for DevTools, Save, View Source
                document.addEventListener('keydown', function(e){
                  // F12 - DevTools
                  if(e.key === 'F12'){ e.preventDefault(); return false; }
                  // Ctrl+Shift+I - DevTools
                  if(e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')){ e.preventDefault(); return false; }
                  // Ctrl+Shift+J - Console
                  if(e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')){ e.preventDefault(); return false; }
                  // Ctrl+Shift+C - Element Inspector
                  if(e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')){ e.preventDefault(); return false; }
                  // Ctrl+U - View Source
                  if(e.ctrlKey && (e.key === 'U' || e.key === 'u')){ e.preventDefault(); return false; }
                  // Ctrl+S - Save Page
                  if(e.ctrlKey && (e.key === 'S' || e.key === 's')){ e.preventDefault(); return false; }
                  // Ctrl+A - Select All (prevent content selection)
                  if(e.ctrlKey && (e.key === 'A' || e.key === 'a')){
                    var t = e.target.tagName;
                    if(t !== 'INPUT' && t !== 'TEXTAREA'){ e.preventDefault(); return false; }
                  }
                  // Ctrl+C - Copy (prevent outside inputs)
                  if(e.ctrlKey && (e.key === 'C' || e.key === 'c')){
                    var t2 = e.target.tagName;
                    if(t2 !== 'INPUT' && t2 !== 'TEXTAREA'){ e.preventDefault(); return false; }
                  }
                  // Ctrl+P - Print
                  if(e.ctrlKey && (e.key === 'P' || e.key === 'p')){ e.preventDefault(); return false; }
                }, true);

                // Disable drag on images and videos
                document.addEventListener('dragstart', function(e){
                  var t = e.target.tagName;
                  if(t === 'IMG' || t === 'VIDEO' || t === 'A'){ e.preventDefault(); return false; }
                }, true);

                // Disable copy/cut on non-input elements
                document.addEventListener('copy', function(e){
                  var t = e.target.tagName;
                  if(t !== 'INPUT' && t !== 'TEXTAREA'){ e.preventDefault(); return false; }
                }, true);
                document.addEventListener('cut', function(e){
                  var t = e.target.tagName;
                  if(t !== 'INPUT' && t !== 'TEXTAREA'){ e.preventDefault(); return false; }
                }, true);

                // Protect images from being saved via long-press (mobile)
                document.addEventListener('touchstart', function(e){
                  var t = e.target.tagName;
                  if(t === 'IMG'){
                    // Add a transparent overlay on long press
                    var img = e.target;
                    var handler = setTimeout(function(){
                      var overlay = document.createElement('div');
                      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:transparent;cursor:default;';
                      overlay.onclick = function(){ overlay.remove(); };
                      document.body.appendChild(overlay);
                      setTimeout(function(){ overlay.remove(); }, 2000);
                    }, 500);
                    document.addEventListener('touchend', function(){ clearTimeout(handler); }, {once:true});
                    document.addEventListener('touchmove', function(){ clearTimeout(handler); }, {once:true});
                  }
                }, true);

                // DevTools detection (subtle - console.log timing)
                var devtoolsOpen = false;
                var threshold = 160;
                var checkDevTools = function(){
                  var widthThreshold = window.outerWidth - window.innerWidth > threshold;
                  var heightThreshold = window.outerHeight - window.innerHeight > threshold;
                  devtoolsOpen = widthThreshold || heightThreshold;
                  if(devtoolsOpen){
                    document.body.setAttribute('data-devtools', 'open');
                  } else {
                    document.body.removeAttribute('data-devtools');
                  }
                };
                setInterval(checkDevTools, 1000);

                // Disable print via CSS media
                var style = document.createElement('style');
                style.textContent = '@media print{body{display:none !important;} @page{size:0;margin:0;}}';
                document.head.appendChild(style);

                // Console warning
                console.log('%c⚠️ محمي بحقوق النشر!', 'color:#FF7A00;font-size:24px;font-weight:bold;');
                console.log('%cهذا الموقع محمي بقوانين حقوق النشر. أي محاولة لنسخ أو سرقة المحتوى ستُعرضك للمساءلة القانونية.', 'color:#ff4444;font-size:14px;');
              })();
            `,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
