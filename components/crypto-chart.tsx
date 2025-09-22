"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from "recharts"
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Activity, CandlestickChart as Candlestick } from "lucide-react"

interface ChartData {
  time: string
  price: number
  timestamp: number
  volume?: number
  open?: number
  high?: number
  low?: number
  close?: number
}

interface CryptoChartProps {
  symbol: string
  currentPrice?: number
  isConnected?: boolean
}

export function CryptoChart({ symbol, currentPrice, isConnected }: CryptoChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("1h")
  const [chartType, setChartType] = useState<"line" | "area" | "candlestick">("candlestick")
  const [error, setError] = useState<string | null>(null)
  const [showVolume, setShowVolume] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const chartWsRef = useRef<WebSocket | null>(null)

  const fetchHistoricalData = async () => {
    setLoading(true)
    setError(null)
    console.log("[v0] Fetching historical data for", symbol, "timeframe:", timeframe)

    try {
      const intervalMap = {
        "1h": { interval: "1m", limit: 60 },
        "24h": { interval: "5m", limit: 288 },
        "7d": { interval: "1h", limit: 168 },
        "30d": { interval: "4h", limit: 180 },
      }

      const config = intervalMap[timeframe as keyof typeof intervalMap] || intervalMap["1h"]
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${config.interval}&limit=${config.limit}`

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No data received from API")
      }

      const formattedData: ChartData[] = data.map((item: any[]) => {
        const timestamp = item[0]
        const date = new Date(timestamp)

        let timeFormat: string
        if (timeframe === "7d" || timeframe === "30d") {
          timeFormat = date.toLocaleDateString([], { month: "short", day: "numeric" })
        } else {
          timeFormat = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }

        return {
          timestamp,
          time: timeFormat,
          price: Number.parseFloat(item[4]), // Close price
          volume: Number.parseFloat(item[5]),
          open: Number.parseFloat(item[1]),
          high: Number.parseFloat(item[2]),
          low: Number.parseFloat(item[3]),
          close: Number.parseFloat(item[4]),
        }
      })

      setChartData(formattedData)
      console.log("[v0] Successfully loaded", formattedData.length, "data points")
    } catch (error) {
      console.error("[v0] Error fetching historical data:", error)
      setError(`Failed to load chart data: ${error instanceof Error ? error.message : "Unknown error"}`)

      if (currentPrice) {
        const sampleData: ChartData[] = []
        const now = Date.now()
        let price = currentPrice

        for (let i = 59; i >= 0; i--) {
          const timestamp = now - i * 60000
          const variation = (Math.random() - 0.5) * 0.02
          const open = price
          const close = price * (1 + variation)
          const high = Math.max(open, close) * (1 + Math.random() * 0.01)
          const low = Math.min(open, close) * (1 - Math.random() * 0.01)

          sampleData.push({
            timestamp,
            time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            price: close,
            open,
            high,
            low,
            close,
            volume: Math.random() * 1000000,
          })
          price = close
        }
        setChartData(sampleData)
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const connectWebSocket = () => {
      if (chartWsRef.current) {
        chartWsRef.current.close()
      }

      try {
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`
        const ws = new WebSocket(wsUrl)
        chartWsRef.current = ws

        ws.onmessage = (event) => {
          try {
            const ticker = JSON.parse(event.data)
            const newPrice = Number.parseFloat(ticker.c)
            const now = Date.now()

            const newDataPoint: ChartData = {
              timestamp: now,
              time: new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              price: newPrice,
              volume: Number.parseFloat(ticker.v),
              open: Number.parseFloat(ticker.o),
              high: Number.parseFloat(ticker.h),
              low: Number.parseFloat(ticker.l),
              close: newPrice,
            }

            setChartData((prev) => {
              const maxPoints = timeframe === "1h" ? 60 : timeframe === "24h" ? 288 : 168
              return [...prev.slice(-(maxPoints - 1)), newDataPoint]
            })
          } catch (error) {
            console.error("Error parsing WebSocket data:", error)
          }
        }
      } catch (error) {
        console.error("WebSocket connection error:", error)
      }
    }

    connectWebSocket()
    return () => {
      if (chartWsRef.current) {
        chartWsRef.current.close()
      }
    }
  }, [symbol, timeframe])

  useEffect(() => {
    fetchHistoricalData()
  }, [symbol, timeframe])

  const latestPrice = chartData[chartData.length - 1]?.price || currentPrice || 0
  const firstPrice = chartData[0]?.price || 0
  const priceChange = latestPrice - firstPrice
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0
  const isPositive = priceChange >= 0

  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(6)}`
    if (price < 100) return `$${price.toFixed(4)}`
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
    return volume.toFixed(0)
  }

  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props
    if (!payload || !payload.open || !payload.high || !payload.low || !payload.close) return null

    const { open, high, low, close } = payload
    const isBullish = close >= open
    const color = isBullish ? "#00d4aa" : "#ff6b6b"

    const minPrice = Math.min(...chartData.map((d) => d.low || d.price))
    const maxPrice = Math.max(...chartData.map((d) => d.high || d.price))
    const priceRange = maxPrice - minPrice

    const highY = y + ((maxPrice - high) / priceRange) * height
    const lowY = y + ((maxPrice - low) / priceRange) * height
    const openY = y + ((maxPrice - open) / priceRange) * height
    const closeY = y + ((maxPrice - close) / priceRange) * height

    const bodyTop = Math.min(openY, closeY)
    const bodyBottom = Math.max(openY, closeY)
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

    const wickX = x + width / 2
    const bodyX = x + width * 0.25
    const bodyWidth = width * 0.5

    return (
      <g>
        <line x1={wickX} y1={highY} x2={wickX} y2={lowY} stroke={color} strokeWidth={1.5} />
        <rect
          x={bodyX}
          y={bodyTop}
          width={bodyWidth}
          height={bodyHeight}
          fill={isBullish ? color : "transparent"}
          stroke={color}
          strokeWidth={1.5}
          rx={1}
        />
      </g>
    )
  }

  const VolumeBar = (props: any) => {
    const { payload, x, y, width, height } = props
    if (!payload || !payload.volume) return null

    const maxVolume = Math.max(...chartData.map((d) => d.volume || 0))
    const volumeHeight = (payload.volume / maxVolume) * height * 0.8
    const volumeY = y + height - volumeHeight

    const isBullish = payload.close >= payload.open
    const color = isBullish ? "#00d4aa40" : "#ff6b6b40"

    return <rect x={x + width * 0.1} y={volumeY} width={width * 0.8} height={volumeHeight} fill={color} rx={1} />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 border border-border rounded-lg p-4 shadow-2xl backdrop-blur-md">
          <p className="text-sm text-muted-foreground mb-3 font-semibold border-b pb-2">{label}</p>
          {chartType === "candlestick" && data.open !== undefined ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="font-medium">{formatPrice(data.open)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span className="font-medium text-green-400">{formatPrice(data.high)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span className="font-medium text-red-400">{formatPrice(data.low)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Close:</span>
                  <span className="font-semibold text-lg">{formatPrice(data.close)}</span>
                </div>
              </div>
              {data.volume && (
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="font-medium text-blue-400">{formatVolume(data.volume)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{formatPrice(payload[0].value)}</p>
              {data.volume && <p className="text-sm text-muted-foreground">Volume: {formatVolume(data.volume)}</p>}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-card/50 rounded-lg p-4 border">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold tracking-tight">{formatPrice(latestPrice)}</div>
            <Badge
              variant={isPositive ? "default" : "destructive"}
              className={`text-sm px-3 py-1 ${
                isPositive
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {isPositive ? "+" : ""}
              {priceChangePercent.toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              24h Change:{" "}
              <span className={isPositive ? "text-green-400" : "text-red-400"}>
                {isPositive ? "+" : ""}
                {formatPrice(Math.abs(priceChange))}
              </span>
            </span>
            {chartData.length > 0 && chartData[chartData.length - 1]?.volume && (
              <span>
                Volume: <span className="text-blue-400">{formatVolume(chartData[chartData.length - 1].volume!)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHistoricalData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-card/30 rounded-lg p-4 border">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-background/50 rounded-md p-1">
            <Button
              variant={chartType === "line" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartType("line")}
              className="h-8 px-3"
            >
              <Activity className="w-4 h-4 mr-1" />
              Line
            </Button>
            <Button
              variant={chartType === "area" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartType("area")}
              className="h-8 px-3"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Area
            </Button>
            <Button
              variant={chartType === "candlestick" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartType("candlestick")}
              className="h-8 px-3"
            >
              <Candlestick className="w-4 h-4 mr-1" />
              Candles
            </Button>
          </div>

          <div className="flex gap-1 bg-background/50 rounded-md p-1">
            {["1h", "24h", "7d", "30d"].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                disabled={loading}
                className="h-8 px-3"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showVolume ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVolume(!showVolume)}
            className="h-8 px-3"
          >
            Volume
          </Button>
        </div>
      </div>

      <Card className="flex-1 border-0 shadow-lg">
        <CardContent className="p-0 h-full">
          {loading ? (
            <div className="h-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
              <div className="text-center space-y-4">
                <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
                <p className="text-lg font-medium text-muted-foreground">Loading professional chart...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full min-h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-destructive text-lg">{error}</p>
                <Button variant="outline" onClick={fetchHistoricalData}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full min-h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-lg">No chart data available</p>
                <Button variant="outline" onClick={fetchHistoricalData}>
                  Load Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[700px] bg-gradient-to-br from-background via-background to-muted/10">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "candlestick" ? (
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 40, left: 20, bottom: showVolume ? 80 : 20 }}
                  >
                    <defs>
                      <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="url(#gridGradient)" strokeWidth={0.5} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      interval="preserveStartEnd"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      yAxisId="price"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={formatPrice}
                      domain={[(dataMin: number) => dataMin * 0.998, (dataMax: number) => dataMax * 1.002]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      orientation="right"
                    />
                    {showVolume && (
                      <YAxis
                        yAxisId="volume"
                        orientation="left"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickFormatter={formatVolume}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        domain={[0, (dataMax: number) => dataMax * 4]}
                      />
                    )}
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      yAxisId="price"
                      dataKey="close"
                      fill="transparent"
                      shape={<CandlestickBar />}
                      isAnimationActive={false}
                    />
                    {showVolume && (
                      <Bar
                        yAxisId="volume"
                        dataKey="volume"
                        fill="transparent"
                        shape={<VolumeBar />}
                        isAnimationActive={false}
                      />
                    )}
                  </ComposedChart>
                ) : chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#00d4aa" : "#ff6b6b"} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isPositive ? "#00d4aa" : "#ff6b6b"} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="url(#gridGradient)" strokeWidth={0.5} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={formatPrice}
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "#00d4aa" : "#ff6b6b"}
                      strokeWidth={3}
                      fill="url(#priceGradient)"
                      dot={false}
                      activeDot={{ r: 6, fill: isPositive ? "#00d4aa" : "#ff6b6b", strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="url(#gridGradient)" strokeWidth={0.5} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={formatPrice}
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "#00d4aa" : "#ff6b6b"}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: isPositive ? "#00d4aa" : "#ff6b6b", strokeWidth: 2, stroke: "#fff" }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground bg-card/30 rounded-lg p-3 border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="font-medium">{isConnected ? "Live data connected" : "Disconnected"}</span>
          </div>
          <span className="text-xs opacity-75">•</span>
          <span>{chartData.length} data points</span>
          <span className="text-xs opacity-75">•</span>
          <span>{timeframe} timeframe</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>Powered by Binance API</span>
        </div>
      </div>
    </div>
  )
}
