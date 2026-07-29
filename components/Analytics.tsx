import Script from "next/script"
import prisma from "@/lib/prisma"

async function getTrackingSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["ga4_id", "meta_pixel_id", "clarity_id"] } },
    })
    return Object.fromEntries(settings.map((s) => [s.key, s.value]))
  } catch {
    return {}
  }
}

export default async function Analytics() {
  const s = await getTrackingSettings()

  // Fall back to env vars if DB has no value set yet
  const GA4_ID = s["ga4_id"] || process.env.NEXT_PUBLIC_GA4_ID || ""
  const PIXEL_ID = s["meta_pixel_id"] || process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
  const CLARITY_ID = s["clarity_id"] || process.env.NEXT_PUBLIC_CLARITY_ID || ""

  return (
    <>
      {GA4_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
          `}</Script>
        </>
      )}

      {PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}</Script>
          <noscript>
            <img height="1" width="1" style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} alt="" />
          </noscript>
        </>
      )}

      {CLARITY_ID && (
        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}</Script>
      )}
    </>
  )
}
