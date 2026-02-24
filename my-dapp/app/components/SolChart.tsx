"use client";

import { useEffect, useRef } from "react";

export default function SolChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const seriesInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    async function initChart() {
      const LW = await import("lightweight-charts");

      const chart = LW.createChart(chartRef.current!, {
        width: chartRef.current!.offsetWidth,
        height: 200,
        layout: {
          background: { color: "#0d0020" },
          textColor: "#a855f7",
        },
        grid: {
          vertLines: { color: "rgba(139,92,246,0.1)" },
          horzLines: { color: "rgba(139,92,246,0.1)" },
        },
        crosshair: {
          vertLine: { color: "rgba(168,85,247,0.5)" },
          horzLine: { color: "rgba(168,85,247,0.5)" },
        },
        rightPriceScale: { borderColor: "rgba(139,92,246,0.3)" },
        timeScale: {
          borderColor: "rgba(139,92,246,0.3)",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      let series: any;
      if (typeof (chart as any).addAreaSeries === "function") {
        series = (chart as any).addAreaSeries({
          lineColor: "#a855f7",
          topColor: "rgba(168,85,247,0.4)",
          bottomColor: "rgba(168,85,247,0.0)",
          lineWidth: 2,
        });
      } else {
        series = chart.addSeries(LW.AreaSeries, {
          lineColor: "#a855f7",
          topColor: "rgba(168,85,247,0.4)",
          bottomColor: "rgba(168,85,247,0.0)",
          lineWidth: 2,
        });
      }

      seriesInstance.current = series;

      try {
        // Fetch last 120 min of 1-min candles
        const res = await fetch("https://api.kraken.com/0/public/OHLC?pair=SOLUSD&interval=1");
        const data = await res.json();
        const candles = data.result.SOLUSD || data.result[Object.keys(data.result)[0]];
        const last120 = candles.slice(-120);

        const lineData = last120.map((c: any[]) => ({
          time: c[0] as number,
          value: parseFloat(c[4]),
        }));

        series.setData(lineData);
        chart.timeScale().fitContent();

        // Find the first candle of the current hour
        const now = new Date();
        const hourStart = new Date(now);
        hourStart.setMinutes(0, 0, 0);
        const hourStartUnix = Math.floor(hourStart.getTime() / 1000);

        // Find candle at or just after the hour start
        const hourOpenCandle = last120.find((c: any[]) => c[0] >= hourStartUnix);
        const hourOpenPrice = hourOpenCandle ? parseFloat(hourOpenCandle[1]) : null; // [1] = open price

        if (hourOpenPrice) {
          series.createPriceLine({
            price: hourOpenPrice,
            color: "#facc15",
            lineWidth: 2,
            lineStyle: 1,
            axisLabelVisible: true,
            title: "Hour open",
          });
        }

      } catch (e) {
        console.error("Chart fetch failed", e);
      }

      // Live updates every 10s
      const interval = setInterval(async () => {
        try {
          const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLUSD");
          const data = await res.json();
          const price = parseFloat(data.result.SOLUSD.c[0]);
          const time = Math.floor(Date.now() / 1000) as any;
          seriesInstance.current?.update({ time, value: price });
        } catch {}
      }, 10000);

      return () => clearInterval(interval);
    }

    let cleanup: any;
    initChart().then(fn => { cleanup = fn; });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: "200px", background: "#0d0020" }}
    />
  );
}
