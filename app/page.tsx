"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, Activity, Moon, Sun, Wifi, WifiOff } from "lucide-react"
import { CryptoChart } from "@/components/crypto-chart"

interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  lastUpdate: number
  previousPrice?: number
  priceDirection?: "up" | "down" | "neutral"
}

const CRYPTO_SYMBOLS = [
  { symbol: "BTCUSDT", name: "Bitcoin", shortName: "BTC" },
  { symbol: "ETHUSDT", name: "Ethereum", shortName: "ETH" },
  { symbol: "ADAUSDT", name: "Cardano", shortName: "ADA" },
  { symbol: "SOLUSDT", name: "Solana", shortName: "SOL" },
  { symbol: "DOGEUSDT", name: "Dogecoin", shortName: "DOGE" },
]

export default function CryptoTracker() {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({})
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const priceAnimationRefs = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    const connectWebSocket = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      try {
        console.log("[v0] Attempting WebSocket connection, attempt:", connectionAttempts + 1)
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr")
        wsRef.current = ws

        ws.onopen = () => {
          console.log("[v0] WebSocket connected to Binance successfully")
          setIsConnected(true)
          setConnectionAttempts(0)
          setIsLoading(false)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const newPrices: Record<string, CryptoPrice> = {}

            data.forEach((ticker: any) => {
              const crypto = CRYPTO_SYMBOLS.find((c) => c.symbol === ticker.s)
              if (crypto) {
                const currentPrice = Number.parseFloat(ticker.c)
                const previousData = prices[crypto.symbol]

                let priceDirection: "up" | "down" | "neutral" = "neutral"
                if (previousData && previousData.price !== currentPrice) {
                  priceDirection = currentPrice > previousData.price ? "up" : "down"

                  // Clear existing animation timeout
                  if (priceAnimationRefs.current[crypto.symbol]) {
                    clearTimeout(priceAnimationRefs.current[crypto.symbol])
                  }

                  // Reset animation after 2 seconds
                  priceAnimationRefs.current[crypto.symbol] = setTimeout(() => {
                    setPrices((prev) => ({
                      ...prev,
                      [crypto.symbol]: {
                        ...prev[crypto.symbol],
                        priceDirection: "neutral",
                      },
                    }))
                  }, 2000)
                }

                newPrices[crypto.symbol] = {
                  symbol: crypto.shortName,
                  name: crypto.name,
                  price: currentPrice,
                  change24h: Number.parseFloat(ticker.P),
                  changePercent24h: Number.parseFloat(ticker.P),
                  lastUpdate: Date.now(),
                  previousPrice: previousData?.price,
                  priceDirection,
                }
              }
            })

            if (Object.keys(newPrices).length > 0) {
              setPrices((prev) => ({ ...prev, ...newPrices }))
            }
          } catch (error) {
            console.error("[v0] Error parsing WebSocket data:", error)
          }
        }

        ws.onclose = (event) => {
          console.log("[v0] WebSocket disconnected, code:", event.code, "reason:", event.reason)
          setIsConnected(false)

          const backoffDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000)
          console.log("[v0] Reconnecting in", backoffDelay, "ms")

          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts((prev) => prev + 1)
            connectWebSocket()
          }, backoffDelay)
        }

        ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          setIsConnected(false)
        }
      } catch (error) {
        console.error("[v0] Failed to create WebSocket connection:", error)
        setIsConnected(false)

        const retryDelay = Math.min(5000 * (connectionAttempts + 1), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts((prev) => prev + 1)
          connectWebSocket()
        }, retryDelay)
      }
    }

    connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      Object.values(priceAnimationRefs.current).forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(6)}`
    } else if (price < 100) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(2)}%`
  }

  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setConnectionAttempts(0)
  }

  const handleCryptoClick = (symbol: string) => {
    setSelectedCrypto(symbol)
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Activity className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CryptoTracker</h1>
                <p className="text-sm text-muted-foreground">Live cryptocurrency prices</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="transition-all duration-300">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-success animate-pulse" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {isConnected
                    ? "Live"
                    : connectionAttempts > 0
                      ? `Reconnecting... (${connectionAttempts})`
                      : "Connecting..."}
                </span>
                {!isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReconnect}
                    className="text-xs px-2 py-1 h-auto transition-all duration-200 hover:scale-105"
                  >
                    Retry
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="w-9 h-9 p-0 transition-all duration-200 hover:scale-110 hover:rotate-12"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 transition-transform duration-300" />
                ) : (
                  <Moon className="w-4 h-4 transition-transform duration-300" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">Market Overview</h2>
          <p className="text-muted-foreground">Click on any cryptocurrency to view detailed charts</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CRYPTO_SYMBOLS.map((crypto, index) => (
              <Card
                key={crypto.symbol}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700 border-border bg-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                      <div className="space-y-2">
                        <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-8 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Crypto Grid */}
        {!isLoading && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {CRYPTO_SYMBOLS.map((crypto, index) => {
              const priceData = prices[crypto.symbol]
              const isPositive = priceData?.changePercent24h >= 0

              return (
                <Card
                  key={crypto.symbol}
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:scale-[1.02] hover:-translate-y-1 border-border bg-card group animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms`, animationDuration: "700ms" }}
                  onClick={() => handleCryptoClick(crypto.symbol)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110">
                          <span className="text-sm font-bold text-accent transition-all duration-300">
                            {crypto.shortName.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg text-card-foreground transition-colors duration-300">
                            {crypto.shortName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{crypto.name}</p>
                        </div>
                      </div>
                      {priceData && (
                        <Badge
                          variant={isPositive ? "default" : "destructive"}
                          className={`transition-all duration-300 ${
                            isPositive
                              ? "bg-success text-success-foreground hover:bg-success/90"
                              : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 mr-1 transition-transform duration-300" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1 transition-transform duration-300" />
                          )}
                          {formatChange(priceData.changePercent24h)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {priceData ? (
                      <div className="space-y-2">
                        <div
                          className={`text-2xl font-bold transition-all duration-500 ${
                            priceData.priceDirection === "up"
                              ? "text-success scale-105"
                              : priceData.priceDirection === "down"
                                ? "text-destructive scale-105"
                                : "text-card-foreground scale-100"
                          }`}
                        >
                          {formatPrice(priceData.price)}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="hidden sm:inline">
                            Last updated: {new Date(priceData.lastUpdate).toLocaleTimeString()}
                          </span>
                          <span className="sm:hidden">
                            {new Date(priceData.lastUpdate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isConnected && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                              <span className="text-xs">Live</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-8 bg-muted animate-pulse rounded" />
                        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Chart Modal */}
        <Dialog open={!!selectedCrypto} onOpenChange={() => setSelectedCrypto(null)}>
          <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 m-0 rounded-none border-0 bg-background overflow-auto">
            <DialogHeader className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedCrypto && (
                    <>
                      <span className="text-xl font-bold">
                        {CRYPTO_SYMBOLS.find((c) => c.symbol === selectedCrypto)?.name}
                      </span>
                      <Badge variant="outline" className="text-sm">
                        {CRYPTO_SYMBOLS.find((c) => c.symbol === selectedCrypto)?.shortName}
                      </Badge>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCrypto(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </DialogTitle>
            </DialogHeader>
            {selectedCrypto && (
              <div className="min-h-[calc(100vh-80px)] p-6">
                <CryptoChart
                  symbol={selectedCrypto}
                  currentPrice={prices[selectedCrypto]?.price}
                  isConnected={isConnected}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
